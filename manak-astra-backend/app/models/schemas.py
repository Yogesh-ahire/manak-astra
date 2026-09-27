from pydantic import BaseModel, Field
from typing import List, Optional

class AnalysisRequest(BaseModel):
    search_query: str
    detected_product: Optional[str] = None
    application: Optional[str] = None
    attributes: List[str] = Field(default_factory=list)
    cited_standards: List[str] = Field(default_factory=list)
    workflow_mode: Optional[str] = "search"

class StandardResult(BaseModel):
    standard_id: str
    full_title: str
    scope: Optional[str]
    scheme: Optional[str] = None
    mandatory_qco: Optional[bool] = None
    status: Optional[str] = None
    similarity: float
    rrf_score: float