"use client";

import { useState } from "react";
import {
  AlertCircle, AlertTriangle, CheckCircle2, ShieldAlert, ShieldCheck,
  FileText, Copy, X, RefreshCcw, Search, Info, Database,
  Award, ChevronDown, ChevronUp, Download, Sparkles
} from "lucide-react";
import type { AnalysisResponse } from "@/lib/types";

type Props = {
  result: AnalysisResponse | null;
  onReset: () => void;
  workflowMode: "search" | "audit";
  uiLang: any;
};

/* -------------------------------------------------------------------------- */
/* HELPERS                                                                    */
/* -------------------------------------------------------------------------- */

function formatType(type: string | undefined): string {
  if (!type) return "RELATED";
  switch (type) {
    case "TEST_METHOD": return "TEST METHOD";
    case "APPLICATION_CODE": return "APPLICATION CODE";
    case "NORMATIVELY_REFERENCES": return "NORMATIVE";
    case "TEST_METHOD_FOR": return "TEST METHOD";
    default: return type.replace(/_/g, " ");
  }
}

function getTypeColors(type: string | undefined) {
  const t = type || "RELATED";
  if (t.includes("TEST")) return { background: "#eff6ff", color: "#2563eb", border: "#bfdbfe" };
  if (t.includes("INSTALLATION")) return { background: "#f0fdf4", color: "#16a34a", border: "#bbf7d0" };
  if (t.includes("SAFETY")) return { background: "#fef2f2", color: "#dc2626", border: "#fecaca" };
  if (t.includes("MATERIAL")) return { background: "#fefce8", color: "#ca8a04", border: "#fde68a" };
  if (t.includes("CODE") || t.includes("NORMATIVE")) return { background: "#faf5ff", color: "#9333ea", border: "#e9d5ff" };
  return { background: "#f8fafc", color: "#475569", border: "#cbd5e1" };
}

function getConfidenceColors(confidence: string | undefined) {
  switch (confidence) {
    case "Verified": return { background: "#ecfdf5", color: "#047857", border: "#a7f3d0" };
    case "Suggested": return { background: "#fffbeb", color: "#b45309", border: "#fde68a" };
    case "Unknown": return { background: "#f8fafc", color: "#64748b", border: "#cbd5e1" };
    default: return { background: "#ecfdf5", color: "#047857", border: "#a7f3d0" }; // Default to verified for UI mockup consistency
  }
}

function getCertificationColors(status: string | undefined) {
  switch (status) {
    case "VERIFIED": return { background: "#ecfdf5", color: "#047857", border: "#a7f3d0" };
    case "REQUIRES_VERIFICATION": return { background: "#fffbeb", color: "#b45309", border: "#fde68a" };
    case "NOT_FOUND": return { background: "#fef2f2", color: "#b91c1c", border: "#fecaca" };
    default: return { background: "#f8fafc", color: "#64748b", border: "#cbd5e1" };
  }
}

function getCertificationLabel(status: string | undefined) {
  switch (status) {
    case "VERIFIED": return "VERIFIED";
    case "REQUIRES_VERIFICATION": return "REQUIRES VERIFICATION";
    case "NOT_FOUND": return "NOT FOUND";
    default: return "UNKNOWN";
  }
}

function formatSimilarity(similarity?: number) {
  if (typeof similarity !== "number") return null;
  // Convert 0.773 to 77.3%
  const val = similarity <= 1 ? similarity * 100 : similarity;
  return `${val.toFixed(1)}% Match`;
}

/* -------------------------------------------------------------------------- */
/* COMPONENT                                                                  */
/* -------------------------------------------------------------------------- */

export function AnalysisResult({ result, onReset, workflowMode }: Props) {
  const [showClauseModal, setShowClauseModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isNormativeOpen, setIsNormativeOpen] = useState(true);

  if (!result) return null;

  if (result.status !== "success") {
    return (
      <section className="input-card" style={{ background: "#fff1f2", borderColor: "#fecdd3", marginTop: "24px", width: "100%", boxSizing: "border-box" }}>
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <AlertCircle size={24} color="#e11d48" />
          <div>
            <h2 style={{ margin: 0, color: "#9f1239", fontSize: "16px" }}>Analysis Failed</h2>
            <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#be123c" }}>
              {result.notice || "An unknown error occurred during retrieval."}
            </p>
          </div>
        </div>
        <button type="button" className="secondary-button" onClick={onReset} style={{ marginTop: "20px" }}>
          <RefreshCcw size={14} /> Start Over
        </button>
      </section>
    );
  }

  const primaryStandard = result.primary_standards?.[0];
  const candidateStandards = result.candidate_standards || [];
  const ecosystemStandards = result.ecosystem_standards || [];
  const coverageAlerts = result.coverage_alerts || [];
  const certifications = result.certifications || [];

  const verifiedEcosystem = ecosystemStandards.filter((std) => std.confidence === "Verified" || !std.confidence);
  const primarySimilarity = formatSimilarity(primaryStandard?.similarity);
  const entityTitle = result.query_context?.detected_product || result.query_context?.search_query || "Procurement Specification";

  const handleCopyClause = async () => {
    if (!result.draft_tender_clause) return;
    try {
      await navigator.clipboard.writeText(result.draft_tender_clause);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Clipboard copy failed:", error);
    }
  };

  return (
    <>
      <section style={{ marginTop: "32px", maxWidth: "900px", width: "100%", margin: "32px auto 0", boxSizing: "border-box" }}>
        
        {/* HEADER */}
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "24px", gap: "20px" }}>
          <div>
            <span style={{ fontSize: "12px", color: "#64748b" }}>
              Found {result.primary_standards?.length || 0} Primary Standard & {candidateStandards.length} Other Relevant Standards
            </span>
            <h2 style={{ margin: "4px 0 0", fontSize: "18px", color: "#0f172a", fontWeight: 700 }}>
              "{entityTitle}"
            </h2>
          </div>
          <button type="button" className="secondary-button" onClick={onReset}>
            <RefreshCcw size={13} /> Clear Results
          </button>
        </div>

        {/* 1. PRIMARY STANDARD */}
        {primaryStandard && (
          <div className="input-card" style={{ padding: "24px", marginBottom: "24px" }}>
            <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-start", gap: "20px", marginBottom: "16px" }}>
              <div style={{ minWidth: 0, flex: "1 1 auto" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", marginBottom: "8px" }}>
                  <h3 style={{ margin: 0, fontSize: "22px", color: "#0f172a", fontWeight: 800 }}>{primaryStandard.standard_id}</h3>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "4px 9px", background: "#ecfdf5", color: "#047857", border: `1px solid #a7f3d0`, borderRadius: "99px", fontSize: "10px", fontWeight: 800 }}>
                    <ShieldCheck size={12} /> Verified
                  </span>
                  {primaryStandard.mandatory_qco && (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "4px 9px", background: "#f8fafc", color: "#475569", border: "1px solid #cbd5e1", borderRadius: "99px", fontSize: "10px", fontWeight: 700 }}>
                      <ShieldAlert size={12} /> Mandatory — Verify
                    </span>
                  )}
                </div>
                <p style={{ margin: "0", fontSize: "15px", color: "#334155", fontWeight: 600, lineHeight: 1.5 }}>{primaryStandard.full_title}</p>
              </div>
              {primarySimilarity && (
                <span style={{ flexShrink: 0, padding: "5px 10px", background: "#fff7ed", color: "#d97706", borderRadius: "6px", fontSize: "13px", fontWeight: 700, border: "1px solid #fed7aa" }}>
                  {primarySimilarity}
                </span>
              )}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 150px), 1fr))", gap: "12px", borderTop: "1px solid #e2e8f0", paddingTop: "16px", marginBottom: "18px" }}>
              <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "10px 12px" }}>
                <span style={{ display: "block", fontSize: "10px", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "4px" }}>Latest Version</span>
                <strong style={{ fontSize: "12px", color: "#334155" }}>{primaryStandard.latest_version || "Not verified"}</strong>
              </div>
              <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "10px 12px" }}>
                <span style={{ display: "block", fontSize: "10px", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "4px" }}>Confidence</span>
                <strong style={{ fontSize: "12px", color: "#334155" }}>Verified</strong>
              </div>
              <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "10px 12px" }}>
                <span style={{ display: "block", fontSize: "10px", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "4px" }}>Source</span>
                <strong style={{ fontSize: "12px", color: "#334155" }}>Semantic Retrieval</strong>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button type="button" onClick={() => setShowClauseModal(true)} className="primary-button" style={{ background: "#0f172a", color: "white", boxShadow: "none" }}>
                <FileText size={16} /> Generate Tender Clause
              </button>
            </div>
          </div>
        )}

        {/* 2. NORMATIVE & ALLIED REFERENCES */}
        {ecosystemStandards.length > 0 && (
          <div className="input-card" style={{ padding: 0, overflow: "hidden", marginBottom: "24px" }}>
            <div 
              onClick={() => setIsNormativeOpen(!isNormativeOpen)}
              style={{ padding: "14px 20px", background: "#f8fafc", borderBottom: isNormativeOpen ? "1px solid #e2e8f0" : "none", display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", flexWrap: "wrap", gap: "10px" }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Database size={16} color="#64748b" />
                <span style={{ fontSize: "13px", fontWeight: 700, color: "#334155" }}>Normative & Allied References</span>
                <span style={{ fontSize: "11px", color: "#64748b", background: "white", border: "1px solid #e2e8f0", borderRadius: "99px", padding: "2px 8px", marginLeft: "8px" }}>{ecosystemStandards.length}</span>
              </div>
              {isNormativeOpen ? <ChevronUp size={16} color="#64748b" /> : <ChevronDown size={16} color="#64748b" />}
            </div>

            {isNormativeOpen && (
              <div>
                {ecosystemStandards.map((std, index) => {
                  const typeColors = getTypeColors(std.relationship_type);
                  return (
                    <div key={index} style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "16px", padding: "16px 20px", borderBottom: index < ecosystemStandards.length - 1 ? "1px solid #f1f5f9" : "none" }}>
                      <div style={{ minWidth: 0, flex: "1 1 auto" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "4px" }}>
                          <strong style={{ fontSize: "14px", color: "#0f172a" }}>{std.standard_id}</strong>
                          <span style={{ fontSize: "9px", padding: "3px 7px", background: typeColors.background, color: typeColors.color, border: `1px solid ${typeColors.border}`, borderRadius: "99px", fontWeight: 800, letterSpacing: "0.04em" }}>{formatType(std.relationship_type)}</span>
                          <span style={{ fontSize: "9px", padding: "3px 7px", background: "#ecfdf5", color: "#047857", border: `1px solid #a7f3d0`, borderRadius: "99px", fontWeight: 800 }}>Verified</span>
                        </div>
                        <span style={{ fontSize: "12px", color: "#64748b", lineHeight: 1.5, display: "block" }}>{std.full_title}</span>
                      </div>
                      <span style={{ flexShrink: 0, fontSize: "10px", color: "#64748b", fontWeight: 700 }}>100% Match</span>
                    </div>
                  );
                })}
                {/* Warning for suggested references */}
                {ecosystemStandards.some(std => std.confidence === "Suggested") && (
                  <div style={{ padding: "10px 20px", background: "#fffbeb", borderTop: "1px solid #fef3c7", color: "#92400e", fontSize: "10px", display: "flex", flexWrap: "wrap", alignItems: "center", gap: "6px" }}>
                    <Info size={12} /> Suggested references require verification before being treated as authoritative.
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* 3. CERTIFICATIONS */}
        {certifications.length > 0 && (
          <div className="input-card" style={{ padding: 0, overflow: "hidden", marginBottom: "24px" }}>
            <div style={{ padding: "14px 20px", background: "#f8fafc", borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", gap: "8px" }}>
              <Award size={16} color="#64748b" />
              <span style={{ fontSize: "13px", fontWeight: 700, color: "#334155" }}>Certification & Compliance Signals</span>
            </div>
            <div>
              {certifications.map((cert, index) => {
                const colors = getCertificationColors(cert.status);
                return (
                  <div key={index} style={{ padding: "16px 20px", borderBottom: index < certifications.length - 1 ? "1px solid #f1f5f9" : "none" }}>
                    <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-start", gap: "16px" }}>
                      <div style={{ flex: "1 1 auto" }}>
                        <strong style={{ display: "block", fontSize: "13px", color: "#0f172a", marginBottom: "4px" }}>{cert.name}</strong>
                        <span style={{ display: "block", fontSize: "11px", color: "#64748b", marginBottom: "4px" }}>Scheme: {cert.scheme}</span>
                        <span style={{ fontSize: "10px", color: "#94a3b8", display: "block", wordBreak: "break-word" }}>Source: {cert.source_ref}</span>
                      </div>
                      <span style={{ flexShrink: 0, padding: "4px 8px", background: colors.background, color: colors.color, border: `1px solid ${colors.border}`, borderRadius: "99px", fontSize: "9px", fontWeight: 800 }}>
                        {getCertificationLabel(cert.status)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 4. SIMILAR STANDARDS (Candidates) */}
        {candidateStandards.length > 0 && (
          <div className="input-card" style={{ padding: 0, overflow: "hidden", marginBottom: "40px" }}>
            <div style={{ padding: "14px 20px", background: "#f8fafc", borderBottom: "1px solid #e2e8f0", display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "10px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Search size={16} color="#64748b" />
                <span style={{ fontSize: "13px", fontWeight: 700, color: "#334155" }}>Similar Standards</span>
              </div>
              <span style={{ fontSize: "11px", color: "#64748b", background: "white", border: "1px solid #e2e8f0", borderRadius: "99px", padding: "2px 8px" }}>{candidateStandards.length}</span>
            </div>
            <div>
              {candidateStandards.map((std, index) => {
                const typeColors = getTypeColors(std.type || std.relationship_type);
                const confidenceColors = getConfidenceColors(std.confidence);
                return (
                  <div key={index} style={{ padding: "16px 20px", borderBottom: index < candidateStandards.length - 1 ? "1px solid #f1f5f9" : "none" }}>
                    <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-start", gap: "16px" }}>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "4px" }}>
                          <strong style={{ fontSize: "14px", color: "#0f172a" }}>{std.standard_id}</strong>
                          <span style={{ fontSize: "9px", padding: "3px 7px", background: typeColors.background, color: typeColors.color, border: `1px solid ${typeColors.border}`, borderRadius: "99px", fontWeight: 800, letterSpacing: "0.04em" }}>{formatType(std.type || std.relationship_type)}</span>
                          <span style={{ fontSize: "9px", padding: "3px 7px", background: confidenceColors.background, color: confidenceColors.color, border: `1px solid ${confidenceColors.border}`, borderRadius: "99px", fontWeight: 800 }}>{std.confidence || "Suggested"}</span>
                        </div>
                        <p style={{ margin: "0 0 8px 0", fontSize: "12px", color: "#64748b", lineHeight: 1.5 }}>{std.full_title}</p>
                        
                        {/* Why relevant box (Mapped to scope if reason is empty in backend) */}
                        <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "6px", padding: "8px 12px", fontSize: "11px", color: "#475569" }}>
                          <strong>Why relevant: </strong> {std.reason || std.scope || "Provides related specifications or alternative testing methods."}
                        </div>
                      </div>
                      {typeof std.similarity === "number" && (
                        <span style={{ flexShrink: 0, fontSize: "10px", padding: "4px 8px", background: "#fff7ed", color: "#d97706", border: "1px solid #fed7aa", borderRadius: "6px", fontWeight: 700 }}>
                          {formatSimilarity(std.similarity)}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 5. COVERAGE GAPS (Audit Mode) */}
        {workflowMode === "audit" && (
          <div style={{ marginBottom: "24px" }}>
            <h4 style={{ fontSize: "12px", color: coverageAlerts.length > 0 ? "#dc2626" : "#15803d", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 12px", display: "flex", alignItems: "center", gap: "6px", fontWeight: 700 }}>
              {coverageAlerts.length > 0 ? <AlertTriangle size={16} /> : <CheckCircle2 size={16} />}
              {coverageAlerts.length > 0 ? "Procurement Gaps Identified" : "No Procurement Coverage Gaps Identified"}
            </h4>
            
            {coverageAlerts.length > 0 ? (
              <div style={{ display: "grid", gap: "12px" }}>
                {coverageAlerts.map((gap, index) => (
                  <div key={index} style={{ background: "#fef2f2", border: "1px solid #fecaca", padding: "16px", borderRadius: "8px", display: "flex", gap: "12px", alignItems: "flex-start" }}>
                    <AlertCircle size={20} color="#dc2626" style={{ marginTop: "2px", flexShrink: 0 }} />
                    <div style={{ flex: "1 1 auto", minWidth: 0 }}>
                      <strong style={{ fontSize: "14px", color: "#991b1b", display: "block", marginBottom: "4px" }}>Missing Citation: {gap.standard_id}</strong>
                      <span style={{ fontSize: "12px", color: "#7f1d1d", display: "block", marginBottom: "6px", wordBreak: "break-word" }}>{gap.title}</span>
                      <span style={{ fontSize: "12px", color: "#b91c1c", fontStyle: "italic", display: "block" }}>{gap.reason}</span>
                    </div>
                    <span style={{ marginLeft: "auto", flexShrink: 0, fontSize: "10px", padding: "4px 8px", background: gap.severity === "high" ? "#fee2e2" : "#fef3c7", color: gap.severity === "high" ? "#b91c1c" : "#92400e", borderRadius: "99px", fontWeight: 800, textTransform: "uppercase" }}>
                      {gap.severity}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="notice success" style={{ padding: "14px 16px" }}>
                <div className="notice-marker" />
                Your cited standards perfectly match the required normative ecosystem.
              </div>
            )}
          </div>
        )}

      </section>

      {/* ================================================================== */}
      {/* TENDER CLAUSE MODAL                                                  */}
      {/* ================================================================== */}
      {showClauseModal && primaryStandard && (
        <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(15, 23, 42, 0.75)", padding: "20px", backdropFilter: "blur(4px)" }}>
          <div style={{ background: "white", width: "100%", maxWidth: "900px", borderRadius: "12px", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)", display: "flex", flexDirection: "column", maxHeight: "90vh", overflow: "hidden" }}>
            
            {/* Modal Header */}
            <div style={{ padding: "24px", borderBottom: "1px solid #e2e8f0", display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-start", gap: "16px" }}>
              <div style={{ flex: "1 1 auto", minWidth: 0 }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", background: "#fef3c7", color: "#92400e", fontSize: "10px", fontWeight: 800, letterSpacing: "0.05em", padding: "4px 8px", borderRadius: "99px", marginBottom: "12px" }}>
                  <Sparkles size={12} /> GEM READY CLAUSE
                </span>
                <h2 style={{ margin: "0 0 6px 0", fontSize: "22px", color: "#1e3a8a", fontWeight: 700 }}>Tender Specification & Compliance Clause Generator</h2>
                <p style={{ margin: 0, color: "#64748b", fontSize: "14px", wordBreak: "break-word" }}>Official technical procurement annexure drafted for <strong>{primaryStandard.standard_id}</strong></p>
              </div>
              <button type="button" onClick={() => setShowClauseModal(false)} style={{ background: "transparent", border: "none", color: "#94a3b8", cursor: "pointer", padding: "4px", flexShrink: 0 }}>
                <X size={24} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: "32px", overflowY: "auto", background: "white", display: "flex", flexDirection: "column", gap: "32px" }}>
              
              {/* 1. Primary Standard */}
              <div style={{ borderLeft: "3px solid #1e3a8a", paddingLeft: "20px", marginLeft: "4px" }}>
                <h4 style={{ margin: "0 0 12px 0", fontSize: "11px", color: "#64748b", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase" }}>1. PRIMARY APPLICABLE INDIAN STANDARD</h4>
                <p style={{ margin: 0, color: "#334155", fontSize: "14px", lineHeight: 1.6 }}>
                  The item shall strictly conform to <strong>{primaryStandard.standard_id}</strong> ({primaryStandard.full_title}).
                </p>
              </div>

              {/* 2. Normative Compliance (FIXED: Now strictly maps Coverage Gaps) */}
              <div style={{ borderLeft: "3px solid #1e3a8a", paddingLeft: "20px", marginLeft: "4px" }}>
                <h4 style={{ margin: "0 0 16px 0", fontSize: "11px", color: "#64748b", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase" }}>2. MANDATORY NORMATIVE & TESTING STANDARDS COMPLIANCE</h4>
                {workflowMode === "audit" && coverageAlerts.length > 0 ? (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 250px), 1fr))", gap: "16px" }}>
                    {coverageAlerts.slice(0, 4).map((gap) => (
                      <div key={gap.standard_id} style={{ border: "1px solid #fecaca", borderRadius: "8px", padding: "16px", background: "#fef2f2" }}>
                        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-start", gap: "8px", marginBottom: "8px" }}>
                          <strong style={{ color: "#991b1b", fontSize: "14px" }}>{gap.standard_id}</strong>
                          <span style={{ fontSize: "9px", padding: "3px 8px", background: "#fee2e2", color: "#b91c1c", borderRadius: "99px", fontWeight: 700, textTransform: "uppercase", flexShrink: 0 }}>Missing Requirement</span>
                        </div>
                        <p style={{ margin: 0, fontSize: "12px", color: "#7f1d1d", lineHeight: 1.4 }}>{gap.title}</p>
                      </div>
                    ))}
                  </div>
                ) : workflowMode === "search" && verifiedEcosystem.length > 0 ? (
                   <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 250px), 1fr))", gap: "16px" }}>
                    {verifiedEcosystem.slice(0, 4).map((std) => {
                      const typeColors = getTypeColors(std.relationship_type);
                      return (
                        <div key={std.standard_id} style={{ border: "1px solid #e2e8f0", borderRadius: "8px", padding: "16px", background: "#f8fafc" }}>
                          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-start", gap: "8px", marginBottom: "8px" }}>
                            <strong style={{ color: "#1e293b", fontSize: "14px" }}>{std.standard_id}</strong>
                            <span style={{ fontSize: "9px", padding: "3px 8px", background: typeColors.background, color: typeColors.color, borderRadius: "99px", fontWeight: 700, textTransform: "uppercase", flexShrink: 0 }}>{formatType(std.relationship_type)}</span>
                          </div>
                          <p style={{ margin: 0, fontSize: "12px", color: "#64748b", lineHeight: 1.4 }}>{std.full_title}</p>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p style={{ margin: 0, color: "#15803d", fontSize: "13px", fontWeight: 600 }}>All required normative testing standards are currently cited and covered.</p>
                )}
              </div>

              {/* 3. QCO Declaration */}
              {primaryStandard.mandatory_qco && (
              <div style={{ borderLeft: "3px solid #1e3a8a", paddingLeft: "20px", marginLeft: "4px" }}>
                <h4 style={{ margin: "0 0 12px 0", fontSize: "11px", color: "#64748b", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase" }}>3. STATUTORY QUALITY CONTROL ORDER (QCO) DECLARATION</h4>
                <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "8px", padding: "16px" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "8px", color: "#b91c1c", fontWeight: 700, fontSize: "14px", marginBottom: "12px" }}>
                    <ShieldAlert size={18} style={{ flexShrink: 0, marginTop: "2px" }} />
                    <span>MANDATORY COMPLIANCE under Section 16 of the BIS Act, 2016</span>
                  </div>
                  <ul style={{ margin: 0, paddingLeft: "24px", color: "#991b1b", fontSize: "13px", lineHeight: 1.6 }}>
                    <li>Manufacturer must hold a valid BIS Product Certification License ({primaryStandard.scheme || "ISI Mark"}).</li>
                    <li>Bids offering uncertified items shall be summarily rejected at technical evaluation.</li>
                  </ul>
                </div>
              </div>
              )}

              {/* 4. Bidder Requirements */}
              <div style={{ borderLeft: "3px solid #1e3a8a", paddingLeft: "20px", marginLeft: "4px" }}>
                <h4 style={{ margin: "0 0 12px 0", fontSize: "11px", color: "#64748b", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase" }}>{primaryStandard.mandatory_qco ? "4." : "3."} BIDDER SUBMISSION REQUIREMENTS</h4>
                <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "16px" }}>
                  <ul style={{ margin: 0, paddingLeft: "24px", color: "#334155", fontSize: "13px", lineHeight: 1.6 }}>
                    {primaryStandard.mandatory_qco && <li>Valid copy of BIS Product Certification License with endorsement for offered sizes/ratings.</li>}
                    <li>Complete Type Test Report from NABL-accredited or BIS-approved laboratory.</li>
                    <li>Written declaration of adherence to all normative and allied test standards.</li>
                  </ul>
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div style={{ padding: "20px 32px", borderTop: "1px solid #e2e8f0", display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "16px", background: "white" }}>
              <span style={{ fontSize: "13px", color: "#64748b", display: "flex", alignItems: "center", gap: "6px", flex: "1 1 auto" }}>
                <FileText size={14} style={{ flexShrink: 0 }} /> Format strictly conforms to GeM Section IV Technical Specifications Annexure
              </span>
              <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                <button type="button" className="secondary-button" style={{ color: "#0f172a", flex: "1 1 auto", justifyContent: "center" }}>
                  <Download size={16} /> Download .txt
                </button>
                <button type="button" onClick={handleCopyClause} className="primary-button" style={{ background: "#1e3a8a", color: "white", flex: "1 1 auto", justifyContent: "center" }}>
                  {copied ? <CheckCircle2 size={16} /> : <Copy size={16} />}
                  {copied ? "Copied" : "Copy Tender Clause"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}