from app.core.database import db

def get_ecosystem_standards(primary_standard_id: str):
    response = db.rpc('get_ecosystem', {'p_standard_id': primary_standard_id}).execute()
    return response.data if response.data else []

def perform_audit(primary_standard, cited_standards, ecosystem):
    """
    Compares user-cited standards against the required ecosystem to find gaps.
    """
    # Clean user cited standards (e.g., 'IS 694:2010' -> 'IS 694')
    cleaned_cited = [c.split(':')[0].strip().upper() for c in cited_standards] if cited_standards else []
    
    gaps = []
    
    for std in ecosystem:
        required_id_base = std['standard_id'].split(':')[0].strip().upper()
        
        # Check if the base ID (e.g., 'IS 10810') exists anywhere in the user's cited list
        is_covered = False
        for cited in cleaned_cited:
            if required_id_base.startswith(cited) or cited.startswith(required_id_base):
                is_covered = True
                break
                
        if not is_covered:
            severity = "high" if std.get('relationship_type') in ["SAFETY", "TEST_METHOD"] else "medium"
            gaps.append({
                "alert_type": "MISSING_ECOSYSTEM_STANDARD",
                "standard_id": std['standard_id'],
                "title": std.get('full_title', ''),
                "severity": severity,
                "reason": f"Required {std.get('relationship_type', 'standard')} is missing from your cited references.",
                "action_required": f"Add {std['standard_id']} to your tender."
            })
            
    return {
        "total_cited": len(cited_standards) if cited_standards else 0,
        "ecosystem_size": len(ecosystem),
        "coverage_gaps_count": len(gaps),
        "gaps": gaps
    }

# Ensure get_ecosystem_standards is also correctly defined in this file to fetch from DB
from app.core.database import db

def get_ecosystem_standards(standard_id: str):
    try:
        # Get the internal DB ID for the primary standard
        std_res = db.table('standards').select('id').eq('standard_id', standard_id).limit(1).execute()
        if not std_res.data:
            return []
            
        internal_id = std_res.data[0]['id']
        
        # Fetch cross references
        refs_res = db.table('cross_references').select(
            'relationship_type, target_standard_id, verification_status'
        ).eq('source_standard_id', internal_id).execute()
        
        if not refs_res.data:
            return []
            
        ecosystem = []
        for ref in refs_res.data:
            target_res = db.table('standards').select('standard_id, full_title').eq('id', ref['target_standard_id']).limit(1).execute()
            if target_res.data:
                target_std = target_res.data[0]
                ecosystem.append({
                    "standard_id": target_std['standard_id'],
                    "full_title": target_std['full_title'],
                    "relationship_type": ref['relationship_type'],
                    "confidence": ref['verification_status'] if ref['verification_status'] else "Suggested"
                })
                
        return ecosystem
    except Exception as e:
        print(f"Error fetching ecosystem: {e}")
        return []
    # Normalize cited standards for comparison (lowercase, strip spaces)
    cited_normalized = [c.lower().strip() for c in cited_standards]
    
    missing_gaps = []
    
    for eco in ecosystem:
        # Check if the ecosystem standard is cited by the user
        is_cited = any(eco['standard_id'].lower() in c for c in cited_normalized)
        
        if not is_cited:
            missing_gaps.append({
                "alert_type": "MISSING_ECOSYSTEM_STANDARD",
                "standard_id": eco['standard_id'],
                "title": eco['full_title'],
                "severity": "high" if eco['relationship_type'] == "TEST_METHOD" else "medium",
                "reason": f"Required {eco['relationship_type']} is missing from your cited references.",
                "action_required": f"Add {eco['standard_id']} to your tender."
            })
            
    return {
        "total_cited": len(cited_standards),
        "ecosystem_size": len(ecosystem),
        "coverage_gaps_count": len(missing_gaps),
        "gaps": missing_gaps
    }