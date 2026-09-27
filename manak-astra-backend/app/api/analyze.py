from fastapi import APIRouter, HTTPException
from app.models.schemas import AnalysisRequest
from app.services.rrf import hybrid_search
from app.services.audit import get_ecosystem_standards, perform_audit
from app.core.config import settings
import time
import json
from groq import Groq

client = Groq(api_key=settings.GROQ_API_KEY)

def generate_explainability_and_clause(primary_standard, gaps, mode):
    prompt = f"""
    You are a strict technical formatting assistant for BIS standards.
    PRIMARY STANDARD: {primary_standard['standard_id']} - {primary_standard['full_title']}
    """
    
    if mode == "audit":
        prompt += f"\nMISSING STANDARDS (GAPS): {[g['standard_id'] for g in gaps] if gaps else 'None'}"
        prompt += "\nTask 1 (Explainability): Write a 1-sentence technical reason why the primary standard is relevant based on semantic matching."
        prompt += "\nTask 2 (Draft Clause): Write a 2-sentence procurement tender clause mandating the primary standard. If there are missing standards, include them as mandatory testing/installation requirements."
    else:
        prompt += "\nTask 1 (Explainability): Write a 1-sentence technical reason why the primary standard is relevant based on semantic matching."
        prompt += "\nTask 2 (Draft Clause): Write a 2-sentence procurement tender clause mandating the primary standard and requiring adherence to associated normative test methods."
    
    prompt += "\nOutput strictly in this JSON format: {\"explainability\": \"...\", \"draft_tender_clause\": \"...\"}"
    
    try:
        response = client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model=settings.GROQ_MODEL,
            response_format={"type": "json_object"},
            temperature=0.0
        )
        return json.loads(response.choices[0].message.content)
    except Exception as e:
        return {
            "explainability": "Analysis complete based on semantic matching.", 
            "draft_tender_clause": f"The material shall strictly conform to {primary_standard['standard_id']}."
        }

router = APIRouter()

@router.post("/analyze")
def analyze_tender(payload: AnalysisRequest):
    start_time = time.time()
    try:
        # Frontend already handled Bhashini translation, pass query directly to search
        results = hybrid_search(payload.search_query)
        
        primary_standard = results[0] if results else None
        ecosystem = []
        candidate_standards = []
        certifications = []
        audit_results = None
        gaps = []
        
        # STRICT MODE ENFORCEMENT: Listen to frontend, don't guess.
        mode = payload.workflow_mode if payload.workflow_mode else "search"
        
        if primary_standard:
            primary_standard['mandatory_qco'] = True
            primary_standard['latest_version'] = "Active (Verify via BIS)"
            primary_standard['status'] = "ACTIVE"
            primary_standard['scheme'] = "Scheme-I (ISI)"
            
            ecosystem = get_ecosystem_standards(primary_standard['standard_id'])
            
            if len(results) > 1:
                candidate_standards = results[1:3]
                for cand in candidate_standards:
                    cand['type'] = "RELATED"
                    cand['confidence'] = "Suggested"
                    cand['status'] = "ACTIVE"

            certifications = [{
                "name": "BIS Product Certification",
                "scheme": "Scheme-I (ISI Mark)",
                "status": "REQUIRES_VERIFICATION",
                "source_ref": "BIS Catalogue Database"
            }]
            
            if mode == "audit":
                audit_results = perform_audit(primary_standard, payload.cited_standards, ecosystem)
                gaps = audit_results.get("gaps", [])

        # BASE RESPONSE FOR BOTH MODES
        response = {
            "status": "success",
            "workflow_mode": mode,
            "notice": "Tender audit completed against verified reference set." if mode == "audit" else "Standards identified and ecosystem generated successfully.",
            "query_context": {
                "search_query": payload.search_query,
                "detected_product": payload.detected_product,
                "application": payload.application if payload.application else "",
                "attributes": payload.attributes,
                "cited_standards": payload.cited_standards
            },
            "primary_standards": [primary_standard] if primary_standard else [],
            "candidate_standards": candidate_standards,
            "ecosystem_standards": ecosystem,
            "certifications": certifications,
        }
        
        # INJECT AUDIT FIELDS ONLY IF IN AUDIT MODE
        if mode == "audit":
            response["audit_summary"] = audit_results if audit_results else {
                "total_cited": len(payload.cited_standards) if payload.cited_standards else 0,
                "ecosystem_size": len(ecosystem),
                "coverage_gaps_count": len(gaps),
                "gaps": gaps
            }
            response["coverage_alerts"] = gaps
            
        if primary_standard:
            llm_output = generate_explainability_and_clause(primary_standard, gaps, mode)
            response["explainability"] = llm_output.get("explainability", "")
            response["draft_tender_clause"] = llm_output.get("draft_tender_clause", "")
            
        response["performance"] = {
            "total_ms": int((time.time() - start_time) * 1000)
        }
        
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))