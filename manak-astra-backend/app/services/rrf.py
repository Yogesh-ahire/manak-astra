from app.core.database import db
from app.core.config import settings
from sentence_transformers import SentenceTransformer

# Load model once
model = SentenceTransformer(settings.EMBEDDING_MODEL)

def compute_rrf(vector_results, fts_results, k=60):
    rrf_scores = {}
    standard_data = {}

    for rank, item in enumerate(vector_results):
        std_id = item['standard_id']
        if std_id not in rrf_scores:
            rrf_scores[std_id] = 0.0
            standard_data[std_id] = item
        rrf_scores[std_id] += 1.0 / (k + rank + 1)

    for rank, item in enumerate(fts_results):
        std_id = item['standard_id']
        if std_id not in rrf_scores:
            rrf_scores[std_id] = 0.0
            standard_data[std_id] = item
        rrf_scores[std_id] += 1.0 / (k + rank + 1)

    sorted_results = sorted(rrf_scores.items(), key=lambda x: x[1], reverse=True)
    
    final_results = []
    # Basic Threshold Gate: Only include results with a minimum RRF score
    threshold = 0.015 
    
    for std_id, score in sorted_results[:settings.TOP_K_FINAL]:
        if score < threshold:
            continue
            
        data = standard_data[std_id]
        final_results.append({
            "standard_id": data['standard_id'],
            "full_title": data['full_title'],
            "scope": data.get('scope', ''),
            "scheme": data.get('scheme', ''),
            "mandatory_qco": data.get('mandatory_qco', False),
            "status": data.get('status', ''),
            "similarity": round(data.get('similarity', 0.0), 4),
            "rrf_score": round(score, 4)
        })
        
    return final_results

def hybrid_search(query: str):
    query_embedding = model.encode(query).tolist()

    vector_response = db.rpc(
        'match_standards', 
        {'query_embedding': query_embedding, 'match_count': settings.TOP_K_VECTOR}
    ).execute()
    
    fts_response = db.rpc(
        'search_standards_fts', 
        {'search_query': query, 'match_count': settings.TOP_K_FTS}
    ).execute()

    return compute_rrf(vector_response.data, fts_response.data)