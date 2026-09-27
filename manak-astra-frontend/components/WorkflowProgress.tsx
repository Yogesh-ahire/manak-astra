"use client";

import { Check, Languages, FileText, Sparkles, Loader2 } from "lucide-react";

type Props = {
  mode: "text" | "pdf";
  active: "pdf" | "language" | "translation" | "extract";
  translated: boolean;
};

const steps = [
  { id: "pdf", title: "Input Processing", icon: FileText },
  { id: "language", title: "Language Detection", icon: Languages },
  { id: "translation", title: "Translation Engine", icon: Languages },
  { id: "extract", title: "Parameter Extraction", icon: Sparkles },
] as const;

export function WorkflowProgress({ mode, active, translated }: Props) {
  const activeIndex = steps.findIndex((step) => step.id === active);

  return (
    <section className="workflow-card" aria-label="Ingestion workflow progress" style={{ border: "1px solid #dce3ef", background: "#ffffff", padding: "24px", borderRadius: "16px", boxShadow: "0 4px 20px rgba(15, 23, 42, 0.03)" }}>
      <div className="workflow-head" style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", gap: "12px" }}>
        <div>
          <p className="eyebrow" style={{ color: "#64748b", fontWeight: 800, fontSize: "10px", letterSpacing: "0.1em", margin: "0 0 4px" }}>AI INGESTION PIPELINE</p>
          <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#0f172a", margin: 0 }}>Processing Specification</h2>
        </div>
        <span className="live-pill" style={{ background: "#e9faf7", color: "#0f9d8f", border: "1px solid #bcece5", padding: "4px 10px", borderRadius: "99px", fontSize: "11px", fontWeight: 700, display: "flex", alignItems: "center", gap: "6px" }}>
          <span className="pulse-dot" style={{ width: "6px", height: "6px", background: "#0f9d8f", borderRadius: "50%", animation: "pulse 1.5s infinite" }} /> Live
        </span>
      </div>

      <div className="workflow-steps-container" style={{ width: "100%", overflowX: "auto", paddingBottom: "8px" }}>
        <div className="workflow-steps" style={{ display: "flex", alignItems: "center", width: "100%", minWidth: "600px" }}>
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isTranslationRelevant = translated || active === "translation" || activeIndex >= index;
            const done = index < activeIndex || (step.id === "translation" && !translated && index < activeIndex);
            const current = step.id === active;
            const skipped = step.id === "translation" && !translated && mode === "text" && activeIndex >= 2;

            return (
              <div className="workflow-step-wrap" key={step.id} style={{ flex: index === steps.length - 1 ? "none" : 1, display: "flex", alignItems: "center" }}>
                <div className={`workflow-step ${current ? "current" : ""} ${done ? "done" : ""} ${skipped ? "skipped" : ""}`} style={{ display: "flex", alignItems: "center", gap: "12px", opacity: skipped ? 0.6 : 1 }}>
                  
                  {/* Icon Container */}
                  <div className="step-icon" style={{ 
                    width: "36px", height: "36px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.3s ease",
                    background: current ? "#5756e8" : done ? "#0f9d8f" : "#f1f5f9",
                    color: current || done ? "#ffffff" : "#94a3b8",
                    boxShadow: current ? "0 0 0 4px rgba(87, 86, 232, 0.15)" : "none",
                    flexShrink: 0
                  }}>
                    {current ? <Loader2 size={18} className="animate-spin" style={{ animation: "spin 1.5s linear infinite" }} /> : 
                     done || (step.id === "pdf" && mode === "text" && activeIndex > 0) ? <Check size={18} strokeWidth={3} /> : 
                     <Icon size={18} />}
                  </div>

                  {/* Text Container */}
                  <div style={{ minWidth: "120px" }}>
                    <strong style={{ display: "block", fontSize: "12px", color: current ? "#5756e8" : done ? "#0f172a" : "#64748b", fontWeight: current || done ? 700 : 500 }}>
                      {step.id === "pdf" ? (mode === "pdf" ? "PDF Processing" : "Input Accepted") : step.title}
                    </strong>
                    <span style={{ display: "block", fontSize: "10px", color: "#94a3b8", marginTop: "2px", whiteSpace: "nowrap" }}>
                      {step.id === "pdf" && mode === "text" ? "Payload ready" : null}
                      {step.id === "pdf" && mode === "pdf" && done ? "Text extracted" : null}
                      {step.id === "language" && done ? "Detected locally" : null}
                      {step.id === "language" && current ? "Analyzing syntax..." : null}
                      {step.id === "translation" && translated ? (current ? "Bridging dialects..." : "English mapped") : null}
                      {step.id === "translation" && !translated ? (current ? "Verifying context..." : "English path bypass") : null}
                      {step.id === "extract" && current ? "Structuring technicals..." : null}
                      {step.id === "extract" && !current && !done ? "In queue" : null}
                      {step.id === "extract" && done ? "Data structured" : null}
                    </span>
                  </div>
                </div>

                {/* Connecting Line */}
                {index < steps.length - 1 && (
                  <div className={`workflow-line ${isTranslationRelevant || index < activeIndex ? "filled" : ""}`} style={{ 
                    height: "2px", flex: 1, margin: "0 16px", borderRadius: "2px", transition: "background 0.3s ease",
                    background: done ? "#0f9d8f" : "#e2e8f0" 
                  }} />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}