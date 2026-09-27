import sys
import pandas as pd
import glob
import time
import warnings
import sqlite3
from pathlib import Path
from sentence_transformers import SentenceTransformer

BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.append(str(BASE_DIR))

from app.core.database import db
warnings.filterwarnings("ignore")

def setup_local_cache():
    """Sets up a local SQLite DB to track ingestion progress and cache embeddings."""
    conn = sqlite3.connect('ingestion_cache.db')
    c = conn.cursor()
    c.execute('''CREATE TABLE IF NOT EXISTS processed_standards
                 (standard_id TEXT PRIMARY KEY, inserted INTEGER)''')
    conn.commit()
    return conn

def check_if_processed(conn, standard_id):
    c = conn.cursor()
    c.execute("SELECT inserted FROM processed_standards WHERE standard_id=?", (standard_id,))
    result = c.fetchone()
    return result is not None and result[0] == 1

def mark_as_processed(conn, standard_ids):
    c = conn.cursor()
    for sid in standard_ids:
        c.execute("INSERT OR REPLACE INTO processed_standards (standard_id, inserted) VALUES (?, 1)", (sid,))
    conn.commit()

def insert_with_retry(payload, max_retries=5, initial_delay=3):
    """Robust insertion with increasing backoff."""
    delay = initial_delay
    for attempt in range(max_retries):
        try:
            db.table("standards").insert(payload).execute()
            return True
        except Exception as e:
            error_msg = str(e).lower()
            if "duplicate key value violates unique constraint" in error_msg:
                # If duplicate, assume it's already there and move on
                return True 
            
            print(f"Network/DB error on attempt {attempt + 1}: {error_msg[:100]}... Retrying in {delay}s...")
            time.sleep(delay)
            delay *= 2
    return False

def load_excel_data():
    print("Finding Excel files...")
    excel_dir = BASE_DIR / "data" / "raw"
    all_files = glob.glob(str(excel_dir / "File_Published_Standards_List*.xlsx"))
    
    if not all_files:
        print(f"Error: No Excel files found in {excel_dir}.")
        return

    all_data = []
    for f in all_files:
        try:
            df = pd.read_excel(f, skiprows=1)
            all_data.append(df)
        except Exception as e:
            print(f"Error reading {f}: {e}")

    if not all_data:
        return

    combined_df = pd.concat(all_data, ignore_index=True)
    combined_df.columns = ['Sl_No', 'Standard_Number', 'Date_of_Publish', 'Title', 'Type_of_Standard', 'Degree_of_Equivalence']
    clean_df = combined_df.dropna(subset=['Standard_Number'])
    clean_df = clean_df.drop_duplicates(subset=['Standard_Number'])
    
    print(f"Total unique valid standards found: {len(clean_df)}")
    
    conn = setup_local_cache()
    
    # Filter out already processed standards
    pending_df = clean_df[~clean_df['Standard_Number'].apply(lambda sid: check_if_processed(conn, str(sid).strip()))]
    print(f"Standards remaining to process: {len(pending_df)}")

    if len(pending_df) == 0:
        print("All standards have already been ingested.")
        return

    print("Loading embedding model...")
    model = SentenceTransformer("sentence-transformers/all-mpnet-base-v2")
    
    success_count = len(clean_df) - len(pending_df)
    batch_payload = []
    batch_ids = []
    
    # Keep batch size extremely conservative for Supabase free tier vector inserts
    BATCH_SIZE = 25 

    print("Starting robust ingestion...")
    for idx, row in pending_df.iterrows():
        standard_number = str(row['Standard_Number']).strip()
        title = str(row['Title']).strip()
        std_type = str(row['Type_of_Standard']).strip()
            
        search_text = f"{standard_number} {title} {std_type}"
        embedding = model.encode(search_text).tolist()
        
        standard_record = {
            "standard_id": standard_number,
            "standard_number": standard_number.split(":")[0] if ":" in standard_number else standard_number,
            "full_title": title,
            "scope": f"Standard Type: {std_type}. Date of Publish: {row['Date_of_Publish']}",
            "status": "Active",
            "search_text": search_text,
            "embedding": embedding
        }

        batch_payload.append(standard_record)
        batch_ids.append(standard_number)

        if len(batch_payload) >= BATCH_SIZE:
            if insert_with_retry(batch_payload):
                mark_as_processed(conn, batch_ids)
                success_count += len(batch_payload)
                print(f"Successfully tracked {success_count} / {len(clean_df)} records...")
            else:
                print("CRITICAL: Batch completely failed after all retries. Stopping script to prevent data corruption.")
                sys.exit(1)
                
            batch_payload = []
            batch_ids = []
            # Generous sleep to let Supabase breathe
            time.sleep(1)

    if batch_payload:
        if insert_with_retry(batch_payload):
            mark_as_processed(conn, batch_ids)
            success_count += len(batch_payload)

    print("\n" + "="*50)
    print("INGESTION COMPLETE")
    print(f"Total standards safely in DB: {success_count}")
    print("="*50)

if __name__ == "__main__":
    load_excel_data()