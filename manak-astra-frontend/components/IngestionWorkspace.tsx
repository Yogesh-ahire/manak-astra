"use client";

import { useMemo, useState } from "react";
import { FileText, Sparkles, ArrowRight, RefreshCcw, Search, FileSearch, Zap } from "lucide-react";
import { Navbar } from "./Navbar";
import { PdfDropzone, type PdfSelection } from "./PdfDropzone";
import { WorkflowProgress } from "./WorkflowProgress";
import { VerificationCard, type EditableSpec } from "./VerificationCard";
import { AnalysisResult } from "./AnalysisResult";
import type { AnalysisResponse, AnalysisPayload, ExtractedSpecification } from "@/lib/types";
import { requestAnalysis } from "@/lib/api";
import { cleanRawText, extractCitedISNumbers, validateText } from "@/lib/validation";
import { I18N, LanguageCode } from "@/lib/i18n";

type ProcessingState = "idle" | "processing" | "verification" | "analyzing";
type InputMode = "text" | "pdf";
type WorkflowMode = "search" | "audit";
type Notice = { type: "error" | "info" | "success"; message: string } | null;

// Distinct, highly technical demos for SIH Judges to prove versatility
const AUDIT_DEMOS = {
  en: "Product: Heavy-Duty PVC insulated cable for domestic and industrial distribution.\nRated working voltage up to and including 1100 V. Conductor shall be copper with PVC insulation and suitable for grounded systems.\nCross-sectional area: 2.5 sq mm. Maximum conductor operating temperature: 70°C. Testing shall comply with IS 694:2010 and relevant IS 10810 methods.",
  hi: "उत्पाद: 500 kVA वितरण ट्रांसफार्मर। आउटडोर उपयोग के लिए डिज़ाइन किया गया। कोर प्रकार का निर्माण और तांबे की वाइंडिंग। अधिकतम स्वीकार्य तापमान वृद्धि 50°C है। IS 1180 (Part 1) के अनुसार परीक्षण और ऊर्जा दक्षता स्तर 2 होना चाहिए।",
  mr: "उत्पादन: शेतीसाठी सेंट्रीफ्यूगल पंप. मोटर क्षमता 5 HP असावी आणि पंप केसिंग उच्च दर्जाच्या कास्ट आयर्नचे असावे. कार्यक्षमता किमान ६५% असणे आवश्यक आहे. पंप IS 6595 (Part 1) च्या मानकांनुसार प्रमाणित असावा.",
  bn: "পণ্য: সোলার ফটোভোলটাইক মডিউল। পলিক্রিস্টালাইন সিলিকন সেল ব্যবহার করতে হবে। ন্যূনতম মডিউল দক্ষতা ১৫% হতে হবে। বাইরের পরিবেশে ব্যবহারের জন্য উপযুক্ত। আইএস 14286 এবং আইএস 61730 অনুযায়ী পরীক্ষিত হতে হবে।",
  ta: "தயாரிப்பு: தொழில்துறை பாதுகாப்பு ஹெல்மெட். அதிக தாக்கத்தை தாங்கும் வகையிலான பிளாஸ்டிக் உறை இருக்க வேண்டும். மின்சார அதிர்ச்சியில் இருந்து பாதுகாக்க வேண்டும். ஐஎஸ் 2925:1984 தரநிலைகளுக்கு உட்பட்டு சோதிக்கப்பட வேண்டும்.",
  as: "পণ্য: পানীয় জলৰ বাবে ছাবমাৰ্চিবল পাম্প। ষ্টেইনলেছ ষ্টীলৰ শৰীৰ থাকিব লাগিব। মটৰৰ ক্ষমতা ১.৫ HP। IS 8034 মানদণ্ড অনুসৰি পৰীক্ষা কৰা হ'ব লাগিব।"
};

const SEARCH_DEMOS = {
  en: "Heavy-Duty PVC insulated copper cable 1100V",
  hi: "500 kVA वितरण ट्रांसफार्मर ऊर्जा दक्षता 2",
  mr: "शेतीसाठी सेंट्रीफ्यूगल पंप 5 HP",
  bn: "সোলার ফটোভোলটাইক মডিউল 15% দক্ষতা",
  ta: "தொழில்துறை பாதுகாப்பு ஹெல்மெட்",
  as: "পানীয় জলৰ ছাবমাৰ্চিবল পাম্প"
};

export function IngestionWorkspace() {
  const [text, setText] = useState("");
  const [pdf, setPdf] = useState<PdfSelection | null>(null);
  const [inputMode, setInputMode] = useState<InputMode>("text");
  
  const [workflowMode, setWorkflowMode] = useState<WorkflowMode>("search");
  const [uiLang, setUiLang] = useState<LanguageCode>("en");

  const [state, setState] = useState<ProcessingState>("idle");
  const [activeStep, setActiveStep] = useState<"pdf" | "language" | "translation" | "extract">("language");
  const [translated, setTranslated] = useState(false);

  const [sourceSpec, setSourceSpec] = useState<ExtractedSpecification | null>(null);
  const [editable, setEditable] = useState<EditableSpec>({
    product: "", application: "", attributes: [], cited_is_numbers: [],
  });

  const [notice, setNotice] = useState<Notice>(null);
  const [result, setResult] = useState<AnalysisResponse | null>(null);

  const t = I18N[uiLang];
  const busy = state === "processing" || state === "analyzing";

  const canSubmit = useMemo(() => {
    if (inputMode === "pdf") return Boolean(pdf);
    return !validateText(text);
  }, [inputMode, pdf, text]);

  const reset = () => {
    setText(""); setPdf(null); setInputMode("text"); setState("idle");
    setActiveStep("language"); setSourceSpec(null); setTranslated(false);
    setEditable({ product: "", application: "", attributes: [], cited_is_numbers: [] });
    setNotice(null); setResult(null);
  };

  const loadDemo = (lang: "en" | "hi" | "mr" | "bn" | "ta" | "as") => {
    const demoText = workflowMode === "audit" ? AUDIT_DEMOS[lang] : SEARCH_DEMOS[lang];
    setText(demoText);
    setInputMode("text");
    setPdf(null);
  };

  const runExtraction = async () => {
    setNotice(null); setResult(null);
    let rawText = text;

    if (inputMode === "pdf") {
      if (!pdf) return setNotice({ type: "error", message: "Choose a PDF first." });
      
      setState("processing"); setActiveStep("pdf");
      const form = new FormData(); form.append("file", pdf.file);
      
      try {
        const response = await fetch("/api/parse-pdf", { method: "POST", body: form });
        const body = await response.json();
        if (!response.ok) throw new Error(body.error || "PDF extraction failed.");
        rawText = cleanRawText(body.raw_text ?? "");
        setText(rawText);
      } catch (error) {
        setState("idle");
        return setNotice({ type: "error", message: error instanceof Error ? error.message : "Failed to extract PDF text." });
      }
    }

    const textError = validateText(rawText);
    if (textError) { setState("idle"); return setNotice({ type: "error", message: textError }); }

    setState("processing"); 
    setActiveStep("language"); 

    try {
      const response = await fetch("/api/extract-specs", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: rawText }),
      });
      
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Extraction failed.");

      setTranslated(body.translation_applied || false);
      setSourceSpec(body);
      setEditable({
        product: body.product || "", application: body.application || "",
        attributes: Array.isArray(body.attributes) ? body.attributes : [],
        cited_is_numbers: Array.isArray(body.cited_is_numbers) ? body.cited_is_numbers : [],
      });
      setState("verification");
    } catch (error) {
      setState("idle");
      setNotice({ type: "error", message: error instanceof Error ? error.message : "Specification extraction failed." });
    }
  };

  const analyze = async (rawMode = false) => {
    const raw = cleanRawText(text);
    if (!raw) return setNotice({ type: "error", message: "No text available." });

    const searchQuery = rawMode ? raw : [editable.product, editable.application, ...editable.attributes].filter(Boolean).join(" ");
    const citedStandards = rawMode ? extractCitedISNumbers(raw) : editable.cited_is_numbers;

    const payload: AnalysisPayload = {
      search_query: searchQuery,
      detected_product: rawMode ? "Raw Text" : editable.product.trim(),
      application: rawMode ? "" : editable.application.trim(),
      attributes: rawMode ? [] : editable.attributes,
      cited_standards: citedStandards,
      workflow_mode: workflowMode,
    };

    setNotice(null);
    setState("analyzing");

    try {
      const response = await requestAnalysis(payload);
      setResult(response);
    } catch (error) {
      setNotice({ type: "error", message: error instanceof Error ? error.message : "Recommendation analysis failed." });
    } finally {
      setState("verification");
    }
  };

  return (
    <main className="page-shell" style={{ maxWidth: "1000px", width: "100%", margin: "0 auto", padding: "32px 16px", boxSizing: "border-box" }}>
      <Navbar uiLang={uiLang} setUiLang={setUiLang} busy={busy} />

      {state === "idle" && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", marginBottom: "24px" }}>
          <button type="button" onClick={() => {setWorkflowMode("search"); setText("");}}
            style={{
              display: "flex", alignItems: "center", gap: "8px", padding: "10px 16px", borderRadius: "8px",
              border: workflowMode === "search" ? "2px solid #2563eb" : "1px solid #e2e8f0",
              background: workflowMode === "search" ? "#eff6ff" : "white",
              color: workflowMode === "search" ? "#1d4ed8" : "#64748b", fontWeight: 600, cursor: "pointer", transition: "all 0.2s"
            }}>
            <Search size={16} /> {t.searchMode}
          </button>
          <button type="button" onClick={() => {setWorkflowMode("audit"); setText("");}}
            style={{
              display: "flex", alignItems: "center", gap: "8px", padding: "10px 16px", borderRadius: "8px",
              border: workflowMode === "audit" ? "2px solid #d97706" : "1px solid #e2e8f0",
              background: workflowMode === "audit" ? "#fffbeb" : "white",
              color: workflowMode === "audit" ? "#b45309" : "#64748b", fontWeight: 600, cursor: "pointer", transition: "all 0.2s"
            }}>
            <FileSearch size={16} /> {t.auditMode}
          </button>
        </div>
      )}

      {notice && !result && (
        <div style={{ padding: "12px 16px", borderRadius: "8px", marginBottom: "24px", fontSize: "12px", display: "flex", alignItems: "center", gap: "8px", background: notice.type === "error" ? "#fef2f2" : "#f0fdf4", color: notice.type === "error" ? "#991b1b" : "#166534" }}>
          <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: notice.type === "error" ? "#dc2626" : "#16a34a", flexShrink: 0 }} />
          {notice.message}
        </div>
      )}

      {state === "idle" && (
        <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "24px" }}>
          
          {/* Inputs Grid - Now Perfectly Symmetrical & Responsive */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 300px), 1fr))", gap: "20px" }}>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
                <FileText size={14} color="#64748b" />
                <span style={{ fontSize: "12px", fontWeight: 600 }}>{t.rawText}</span>
              </div>
              <textarea
                style={{ flexGrow: 1, minHeight: "220px", width: "100%", boxSizing: "border-box", padding: "16px", fontSize: "13px", border: "1px solid #cbd5e1", borderRadius: "12px", resize: "none", outline: "none", lineHeight: 1.6 }}
                value={text} onChange={(e) => { setText(e.target.value); setInputMode("text"); }} disabled={busy} placeholder={workflowMode === "search" ? t.searchPlaceholder : t.auditPlaceholder}
              />
            </div>
            
            <PdfDropzone value={pdf} onChange={(v) => { setPdf(v); if (v) setInputMode("pdf"); }} disabled={busy} />
          </div>

          {/* SIH Hackathon Demo Buttons - Moved Outside the Grid */}
          <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap", marginTop: "20px", padding: "12px 16px", background: "#f8fafc", borderRadius: "8px", border: "1px dashed #cbd5e1" }}>
            <span style={{ fontSize: "11px", fontWeight: 800, color: "#64748b", display: "flex", alignItems: "center", gap: "6px", textTransform: "uppercase", letterSpacing: "0.05em", flexShrink: 0 }}>
              <Zap size={14} color="#f59e0b" /> Try Demos:
            </span>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              <button type="button" onClick={() => loadDemo('en')} className="secondary-button" style={{ minHeight: "28px", padding: "0 12px", fontSize: "11px", borderRadius: "6px", color: "#475569" }}>ENG</button>
              <button type="button" onClick={() => loadDemo('hi')} className="secondary-button" style={{ minHeight: "28px", padding: "0 12px", fontSize: "11px", borderRadius: "6px", color: "#475569" }}>HIN</button>
              <button type="button" onClick={() => loadDemo('mr')} className="secondary-button" style={{ minHeight: "28px", padding: "0 12px", fontSize: "11px", borderRadius: "6px", color: "#475569" }}>MAR</button>
              <button type="button" onClick={() => loadDemo('bn')} className="secondary-button" style={{ minHeight: "28px", padding: "0 12px", fontSize: "11px", borderRadius: "6px", color: "#475569" }}>BEN</button>
              <button type="button" onClick={() => loadDemo('ta')} className="secondary-button" style={{ minHeight: "28px", padding: "0 12px", fontSize: "11px", borderRadius: "6px", color: "#475569" }}>TAM</button>
              <button type="button" onClick={() => loadDemo('as')} className="secondary-button" style={{ minHeight: "28px", padding: "0 12px", fontSize: "11px", borderRadius: "6px", color: "#475569" }}>ASM</button>
            </div>
          </div>

          {/* Submit Action */}
          <div style={{ marginTop: "24px", display: "flex", justifyContent: "flex-end" }}>
            <button type="button" onClick={runExtraction} disabled={!canSubmit || busy}
              style={{ background: "#2563eb", color: "white", padding: "10px 24px", borderRadius: "8px", fontWeight: 600, border: "none", cursor: canSubmit ? "pointer" : "not-allowed", display: "flex", alignItems: "center", gap: "8px" }}>
              {busy ? <span className="button-spinner" /> : <Sparkles size={16} />}
              {busy ? t.btnLoading : t.btnExtract} <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {state === "processing" && (
        <WorkflowProgress mode={inputMode} active={activeStep} translated={translated} />
      )}

      {(state === "verification" || state === "analyzing") && !result && (
        <VerificationCard spec={editable} source={sourceSpec} onChange={setEditable} onAnalyze={() => analyze(false)} onRawAnalyze={() => analyze(true)} analyzing={state === "analyzing"} />
      )}

      {result && <AnalysisResult result={result} onReset={reset} workflowMode={workflowMode} uiLang={uiLang} />}

      {state === "verification" && !result && !busy && (
        <button type="button" onClick={reset} className="secondary-button" style={{ display: "flex", margin: "32px auto", minHeight: "40px", padding: "0 20px", borderRadius: "99px", color: "#475569", alignItems: "center", gap: "8px", boxShadow: "0 4px 14px rgba(15,23,42,0.05)" }}>
          <RefreshCcw size={14} /> {t.startOver}
        </button>
      )}
    </main>
  );
}