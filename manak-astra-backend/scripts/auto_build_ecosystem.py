import sys
import re
from pathlib import Path
from collections import defaultdict

BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.append(str(BASE_DIR))

from app.core.database import db

def extract_keywords(title: str):
    if not title: return set()
    # Expanded stop words to prevent generic linking
    stop_words = {"specification", "methods", "test", "code", "practice", "part", "for", "of", "and", "in", "to", "the", "a", "an", "determination", "requirements", "general", "guide", "standard", "measurement", "equipment"}
    words = re.findall(r'\b[a-zA-Z]{4,}\b', title.lower()) # Only consider words with 4+ letters
    return {w for w in words if w not in stop_words}

def auto_generate_ecosystem():
    print("Starting Automated High-Performance Knowledge Graph Builder...")
    
    print("Fetching all standards from DB (Paginated)...")
    all_standards = []
    start = 0
    step = 1000
    
    # Supabase pagination loop to bypass the 1000 record limit
    while True:
        res = db.table('standards').select('id, standard_id, full_title, scope').range(start, start + step - 1).execute()
        if not res.data:
            break
        all_standards.extend(res.data)
        start += step
        print(f"Fetched {len(all_standards)} records so far...")
        
        if len(res.data) < step:
            break

    print(f"\nRetrieved {len(all_standards)} total standards.")

    products = []
    support_standards = []

    for std in all_standards:
        scope = str(std.get('scope', '')).lower()
        if 'product specification' in scope:
            products.append(std)
        else:
            support_standards.append(std)
            
    print(f"Categorized: {len(products)} Products and {len(support_standards)} Support Standards.")
    
    print("Building inverted lookup index for products...")
    product_keyword_index = defaultdict(list)
    product_cached_keywords = {}

    for prod in products:
        prod_keywords = extract_keywords(prod['full_title'])
        product_cached_keywords[prod['id']] = prod_keywords
        for kw in prod_keywords:
            product_keyword_index[kw].append(prod['id'])

    links_created = 0
    batch_payload = []
    BATCH_SIZE = 100  

    def push_batch(payload):
        if not payload: return
        try:
            db.table('cross_references').insert(payload).execute()
        except Exception:
            pass

    print("Mapping cross-references via indexed lookup...")
    seen_pairs = set()

    for support in support_standards:
        support_id = support['id']
        title = support['full_title']
        scope_str = str(support.get('scope', '')).lower()
        
        rel_type = "RELATED"
        if "methods of tests" in scope_str or "testing" in scope_str or "method" in scope_str:
            rel_type = "TEST_METHOD"
        elif "code of practice" in scope_str:
            rel_type = "CODE_OF_PRACTICE"
        elif "terminology" in scope_str or "glossary" in scope_str:
            rel_type = "TERMINOLOGY"
        elif "safety" in scope_str:
            rel_type = "SAFETY"

        support_keywords = extract_keywords(title)
        if len(support_keywords) < 2:
            continue

        candidate_product_scores = defaultdict(int)
        for kw in support_keywords:
            if kw in product_keyword_index:
                for prod_id in product_keyword_index[kw]:
                    candidate_product_scores[prod_id] += 1

        for prod_id, match_count in candidate_product_scores.items():
            # STRICTER THRESHOLD: Must share at least 3 highly specific keywords
            if match_count >= 3:
                pair = (prod_id, support_id)
                if pair not in seen_pairs:
                    batch_payload.append({
                        "source_standard_id": prod_id,
                        "target_standard_id": support_id,
                        "relationship_type": rel_type,
                        "verification_status": "SUGGESTED",
                        "source_url": "Heuristic Hash Match"
                    })
                    seen_pairs.add(pair)
                    links_created += 1

            if len(batch_payload) >= BATCH_SIZE:
                push_batch(batch_payload)
                batch_payload = []

    if batch_payload:
        push_batch(batch_payload)
            
    print("="*50)
    print("KNOWLEDGE GRAPH GENERATION COMPLETE.")
    print(f"Total Ecosystem Links Created: {links_created}")
    print("="*50)

if __name__ == "__main__":
    try:
        # Warning: This deletes ALL existing cross references before rebuilding.
        db.table('cross_references').delete().neq('id', 0).execute()
        print("Cleared old cross_references.")
    except Exception:
        print("Could not clear old references, proceeding anyway.")
    
    auto_generate_ecosystem()