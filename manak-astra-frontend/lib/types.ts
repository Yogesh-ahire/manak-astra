// E:\projects\standards-ingestion-frontend\lib\types.ts

export type ExtractionMethod =
  | "groq"
  | "raw-fallback"
  | "manual"
  | "unknown";

export type DetectedLanguage = {
  code3: string;
  code2: string;
  name: string;
  confidence: number;
  isEnglish: boolean;
};

export type ExtractedSpecification = {
  product: string;
  application: string;
  attributes: string[];
  cited_is_numbers: string[];
  extraction_method?: ExtractionMethod;
  fallback_reason?: string;
};

export type AnalysisPayload = {
  search_query: string;
  detected_product: string;
  cited_standards: string[];
  workflow_mode?: "search" | "audit";
  application?: string;
  attributes?: string[];
};

export type ConfidenceTier =
  | "Verified"
  | "Suggested"
  | "Unknown";

export type StandardType =
  | "PRIMARY"
  | "TEST_METHOD"
  | "MATERIAL"
  | "SAFETY"
  | "INSTALLATION"
  | "APPLICATION_CODE"
  | "RELATED"
  | string;

export type StandardNode = {
  standard_id: string;
  full_title: string;
  scope?: string;
  scheme?: string;
  mandatory_qco?: boolean;
  status?: string;
  similarity?: number;
  rrf_score?: number;
  relationship_type?: StandardType;
  type?: StandardType;
  confidence?: ConfidenceTier;
  latest_version?: string;
  source_ref?: string;
  reason?: string;
};

export type CandidateStandard = StandardNode & {
  reason?: string;
};

export type CoverageAlert = {
  alert_type?: string;
  standard_id: string;
  title: string;
  reason: string;
  severity: "high" | "medium";
  action_required?: string;
};

export type AuditSummary = {
  total_cited: number;
  ecosystem_size: number;
  coverage_gaps_count: number;
  gaps: CoverageAlert[];
};

export type CertificationRecord = {
  name: string;
  scheme: string;
  status:
    | "VERIFIED"
    | "REQUIRES_VERIFICATION"
    | "NOT_FOUND"
    | "UNKNOWN";
  source_ref: string;
};

export type AnalysisPerformance = {
  total_ms?: number;
  vector_search_ms?: number;
  fts_search_ms?: number;
  graph_traversal_ms?: number;
  provider?: string;
  model?: string;
  source?: string;
  groq_error?: string;
  [key: string]: unknown;
};

export type AnalysisResponse = {
  status: "success" | "error";
  workflow_mode: "search" | "audit";
  notice?: string;
  query_context: any;
  primary_standards: StandardNode[];
  candidate_standards?: CandidateStandard[];
  ecosystem_standards: StandardNode[];
  coverage_alerts?: CoverageAlert[];
  certifications?: CertificationRecord[];
  audit_summary?: AuditSummary;
  explainability?: string;
  draft_tender_clause?: string;
  performance?: AnalysisPerformance;
  received_payload?: AnalysisPayload;
};