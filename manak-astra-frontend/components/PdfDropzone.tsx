"use client";

import { useCallback, useRef, useState } from "react";
import { FileUp, FileCheck2, X } from "lucide-react";
import { PDFDocument } from "pdf-lib";
import { MAX_FILE_BYTES, MAX_PDF_PAGES } from "@/lib/validation";

export type PdfSelection = { file: File; pages: number };

type Props = {
  value: PdfSelection | null;
  onChange: (selection: PdfSelection | null) => void;
  disabled?: boolean;
};

export function PdfDropzone({ value, onChange, disabled }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  const validateFile = useCallback(async (file: File) => {
    setError(null);
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      setError("Please select a PDF document.");
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setError(`File exceeds ${MAX_FILE_BYTES / (1024 * 1024)}MB. Extract the specification section only.`);
      return;
    }

    setChecking(true);
    try {
      const bytes = await file.arrayBuffer();
      const pdf = await PDFDocument.load(bytes, { ignoreEncryption: true });
      const pages = pdf.getPageCount();
      if (pages > MAX_PDF_PAGES) {
        setError(`PDF has ${pages} pages. Maximum allowed is ${MAX_PDF_PAGES}.`);
        return;
      }
      onChange({ file, pages });
    } catch {
      setError("This PDF could not be validated.");
    } finally {
      setChecking(false);
    }
  }, [onChange]);

  const onDrop = async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragActive(false);
    const file = event.dataTransfer.files?.[0];
    if (file) await validateFile(file);
  };

  return (
    <div className="upload-column" style={{ gap: "8px" }}>
      <div className="card-label-row">
        <div className="label-with-icon" style={{ display: "flex", flexWrap: "wrap", alignItems: "center" }}>
          <span className="section-icon purple" style={{ width: "28px", height: "28px" }}><FileUp size={15} /></span>
          <div>
            <h3 style={{ fontSize: "13px" }}>Official PDF Upload</h3>
          </div>
        </div>
      </div>

      <div
        className={`dropzone ${dragActive ? "drag-active" : ""} ${value ? "has-file" : ""} ${disabled ? "disabled" : ""}`}
        style={{ minHeight: "220px", height: "220px", marginTop: "0", padding: "16px", display: "flex", flexDirection: "column", justifyContent: "center" }}
        onDragOver={(e) => { e.preventDefault(); if (!disabled) setDragActive(true); }}
        onDragLeave={() => setDragActive(false)}
        onDrop={onDrop}
        onClick={() => !disabled && inputRef.current?.click()}
        role="button"
        tabIndex={0}
      >
        <input
          ref={inputRef}
          className="visually-hidden"
          type="file"
          accept="application/pdf,.pdf"
          disabled={disabled}
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (file) await validateFile(file);
            e.target.value = "";
          }}
        />

        {value ? (
          <div className="selected-file" onClick={(e) => e.stopPropagation()} style={{ padding: "12px", border: "1px solid #e2e8f0", display: "flex", flexWrap: "wrap", alignItems: "center", gap: "10px" }}>
            <div className="selected-file-icon" style={{ width: "36px", height: "36px", flexShrink: 0 }}><FileCheck2 size={18} /></div>
            <div className="selected-file-copy" style={{ flex: "1 1 auto", minWidth: 0 }}>
              <strong style={{ fontSize: "12px", display: "block", wordBreak: "break-word" }}>{value.file.name}</strong>
              <span style={{ fontSize: "10px" }}>{value.pages} page{value.pages === 1 ? "" : "s"} · {(value.file.size / 1024).toFixed(0)} KB</span>
            </div>
            <button className="icon-button" type="button" onClick={() => onChange(null)} aria-label="Remove PDF" style={{ flexShrink: 0 }}>
              <X size={15} />
            </button>
          </div>
        ) : (
          <>
            <div className="upload-icon" style={{ width: "48px", height: "48px", marginBottom: "12px" }}><FileUp size={22} strokeWidth={1.8} /></div>
            <strong style={{ fontSize: "13px" }}>{checking ? "Validating PDF…" : "Drag and drop specification PDF"}</strong>
            <div className="limit-copy" style={{ marginTop: "8px" }}>LIMITS · Max {MAX_FILE_BYTES / (1024 * 1024)}MB · Up to {MAX_PDF_PAGES} pages</div>
          </>
        )}
      </div>

      {error && <div className="field-error" role="alert" style={{ margin: 0, padding: "8px", fontSize: "11px" }}>{error}</div>}
    </div>
  );
}