"use client";

import { Check, Plus, X } from "lucide-react";
import { useState } from "react";

type Props = {
  items: string[];
  onChange: (items: string[]) => void;
  disabled?: boolean;
};

export function ChipInput({ items, onChange, disabled }: Props) {
  const [draft, setDraft] = useState("");

  const add = () => {
    const value = draft.trim();
    if (!value) return;
    if (!items.some((item) => item.toLowerCase() === value.toLowerCase())) {
      onChange([...items, value]);
    }
    setDraft("");
  };

  const remove = (target: string) => onChange(items.filter((item) => item !== target));

  return (
    <div className="chip-editor" style={{ display: "flex", flexWrap: "wrap", gap: "8px", alignItems: "center" }}>
      {items.map((item) => (
        <span className="tag" key={item}>
          <span>{item}</span>
          <button type="button" onClick={() => remove(item)} disabled={disabled} aria-label={`Remove ${item}`}><X size={13} /></button>
        </span>
      ))}
      <div className="tag-input-wrap">
        <Plus size={14} />
        <input
          value={draft}
          disabled={disabled}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
          placeholder="Add parameter"
          aria-label="Add parameter"
          style={{ width: "100%", boxSizing: "border-box" }}
        />
        {draft.trim() ? <button type="button" className="tag-add-confirm" onClick={add} aria-label="Add parameter"><Check size={13} /></button> : null}
      </div>
    </div>
  );
}