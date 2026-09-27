"use client";

import { AlertTriangle, CheckCircle2, Info, Trash2 } from "lucide-react";
import { useMemo } from "react";
import type { ExtractedSpecification } from "@/lib/types";
import { ChipInput } from "./ChipInput";

export type EditableSpec = {
  product: string;
  application: string;
  attributes: string[];
  cited_is_numbers: string[];
};

type Props = {
  spec: EditableSpec;
  source: ExtractedSpecification | null;
  onChange: (value: EditableSpec) => void;
  onAnalyze: () => void;
  onRawAnalyze: () => void;
  analyzing: boolean;
};

export function VerificationCard({ spec, source, onChange, onAnalyze, onRawAnalyze, analyzing }: Props) {
  const fallback = source?.extraction_method === "raw-fallback";
  const hasChanges = useMemo(() => Boolean(spec.product.trim() || spec.application.trim() || spec.attributes.length || spec.cited_is_numbers.length), [spec]);

  return (
    <section className="verification-section" style={{ marginTop: "16px" }}>
      <div className="section-title-row" style={{ marginBottom: "12px" }}>
        <div>
          <h2 style={{ fontSize: "18px" }}>Interactive Data Verification</h2>
        </div>
      </div>

      <div className="verification-card" style={{ padding: "20px" }}>
        <div className="field-block" style={{ marginBottom: "12px" }}>
          <label htmlFor="product">Product Name</label>
          <input
            id="product"
            value={spec.product}
            onChange={(e) => onChange({ ...spec, product: e.target.value })}
            placeholder="e.g. Submersible Pumpset"
            style={{ height: "38px", width: "100%", boxSizing: "border-box" }}
          />
        </div>

        <div className="field-block" style={{ marginBottom: "12px" }}>
          <label htmlFor="application">Application Context</label>
          <textarea
            id="application"
            value={spec.application}
            onChange={(e) => onChange({ ...spec, application: e.target.value })}
            placeholder="Operating environment or duty parameters"
            rows={1}
            style={{ minHeight: "44px", height: "44px", padding: "10px 12px", width: "100%", boxSizing: "border-box" }}
          />
        </div>

        <div className="field-block" style={{ marginBottom: "12px" }}>
          <label>Technical Attributes</label>
          <ChipInput items={spec.attributes} onChange={(attributes) => onChange({ ...spec, attributes })} disabled={analyzing} />
        </div>

        <div className="field-block standards-block" style={{ marginBottom: "0" }}>
          <label>Cited IS Standards</label>
          <div className="standards-list" style={{ gap: "6px", display: "flex", flexWrap: "wrap" }}>
            {spec.cited_is_numbers.length === 0 && <p style={{ fontSize: "11px", color: "#94a3b8", margin: 0 }}>No explicit standards cited in the source text.</p>}
            {spec.cited_is_numbers.map((standard) => (
              <div className="standard-row" key={standard} style={{ minHeight: "24px", display: "flex", alignItems: "center", gap: "6px" }}>
                <span className="standard-check" style={{ width: "14px", height: "14px", flexShrink: 0 }}>✓</span>
                <span style={{ fontWeight: 600 }}>{standard}</span>
                <button type="button" onClick={() => onChange({ ...spec, cited_is_numbers: spec.cited_is_numbers.filter((item) => item !== standard) })} aria-label={`Remove ${standard}`}>
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="verification-actions" style={{ marginTop: "16px", paddingTop: "16px", display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "12px", flexWrap: "wrap" }}>
        <button type="button" className="secondary-button" onClick={onRawAnalyze} disabled={analyzing || !hasChanges} style={{ minHeight: "40px", color: "#475569", padding: "0 20px" }}>
          Skip extraction · Analyze raw text
        </button>
        <button type="button" className="primary-button" onClick={onAnalyze} disabled={analyzing || !spec.product.trim()} style={{ minHeight: "40px" }}>
          {analyzing ? <span className="button-spinner" /> : <CheckCircle2 size={16} />}
          {analyzing ? "Running analysis…" : "Analyze standards & check coverage"}
        </button>
      </div>
    </section>
  );
}