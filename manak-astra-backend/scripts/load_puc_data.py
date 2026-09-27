import sys
import pandas as pd
import glob
import re
from pathlib import Path
import warnings

BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.append(str(BASE_DIR))

from app.core.database import db
warnings.filterwarnings("ignore")

def clean_is_number(is_num_str):
    """Removes trailing year (e.g., ':2016') to improve database matching."""
    is_num_str = str(is_num_str).strip()
    return re.sub(r'\s*:\s*\d{4}\s*$', '', is_num_str).strip()

def extract_puc_data(filepath):
    """Scans entire excel sheet dynamically regardless of column names."""
    extracted = []
    try:
        # Read the file and flatten it row by row
        df = pd.read_excel(filepath)
        for idx, row in df.iterrows():
            is_number = None
            qco_text = "BIS Quality Control Order"
            
            for col_idx, val in enumerate(row):
                val_str = str(val).strip()
                
                # Identify if the cell contains an IS standard number
                if val_str.startswith('IS') and any(char.isdigit() for char in val_str):
                    is_number = clean_is_number(val_str)
                    
                # Identify if the cell contains Notification/QCO text
                elif 'Order' in val_str or 'S.O.' in val_str or 'dated' in val_str.lower():
                    qco_text = val_str
                    
            if is_number:
                extracted.append((is_number, qco_text))
    except Exception as e:
        print(f"Error reading file structure: {e}")
        
    return extracted

def load_puc_data():
    excel_dir = BASE_DIR / "data" / "raw"
    all_files = glob.glob(str(excel_dir / "PUC Scheme*.xlsx"))
    
    if not all_files:
        print("Error: No PUC Scheme files found.")
        return

    for file_path in all_files:
        file_name = Path(file_path).stem
        scheme_label = file_name if "Scheme" in file_name else "Mandatory Scheme"
        
        print(f"\nLoading Mandatory Certification data from: {file_name}...")
        
        data_pairs = extract_puc_data(file_path)
        
        if not data_pairs:
            print("No IS numbers detected in this file.")
            continue
            
        print(f"Found {len(data_pairs)} mandatory standards entries.")
        
        success_count = 0
        seen_standards = set()
        
        for is_num, qco_details in data_pairs:
            if is_num in seen_standards:
                continue # Skip duplicates in the same sheet
            seen_standards.add(is_num)
            
            try:
                # 1. Update Standards Table
                db.table('standards').update({
                    "mandatory_qco": True,
                    "scheme": scheme_label,
                    "certification_route": "Mandatory"
                }).ilike('standard_id', f"{is_num}%").execute()
                
                # 2. Get the internal ID
                std_res = db.table('standards').select('id').ilike('standard_id', f"{is_num}%").limit(1).execute()
                
                if std_res.data:
                    internal_id = std_res.data[0]['id']
                    
                    # 3. Fill Certifications Table
                    cert_payload = {
                        "standard_id": internal_id,
                        "scheme": scheme_label,
                        "certification_route": "Mandatory",
                        "mandatory": True,
                        "verified": True
                    }
                    try:
                        db.table('certifications').insert(cert_payload).execute()
                    except: pass 
                    
                    # 4. Fill QCO Records Table
                    qco_payload = {
                        "standard_id": internal_id,
                        "qco_name": qco_details[:200] if qco_details else "BIS Quality Control Order",
                        "issuing_ministry": "Govt. of India",
                        "verified": True
                    }
                    try:
                        db.table('qco_records').insert(qco_payload).execute()
                    except: pass 
                    
                    success_count += 1
                    
            except Exception:
                pass

        print(f"Successfully mapped {success_count} standards from {file_name}.")

if __name__ == "__main__":
    load_puc_data()