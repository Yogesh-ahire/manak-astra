"use client";

import { LanguageCode } from "@/lib/i18n";

interface NavbarProps {
    uiLang: LanguageCode;
    setUiLang: (lang: LanguageCode) => void;
    busy: boolean;
}

export function Navbar({ uiLang, setUiLang, busy }: NavbarProps) {
    return (
        <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            flexWrap: 'wrap',
            gap: '16px',
            marginBottom: '32px', 
            borderBottom: '1px solid #e2e8f0', 
            paddingBottom: '16px',
            width: '100%',
            fontFamily: 'system-ui, -apple-system, sans-serif'
        }}>
            
            <div className="brand-lockup" style={{ display: 'flex', alignItems: 'center' }}>
                <img 
                    src="/logo.png" 
                    alt="Manak Astra Logo" 
                    style={{ 
                        height: '42px',
                        width: 'auto', 
                        objectFit: 'contain',
                        flexShrink: 0
                    }} 
                />

                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <strong style={{ 
                        fontSize: '16px', 
                        fontWeight: '700', 
                        color: '#0f172a', 
                        lineHeight: '1.2',
                        letterSpacing: '-0.01em'
                    }}>
                        MANAK ASTRA
                    </strong>
                    <span style={{ 
                        fontSize: '12px', 
                        color: '#64748b',
                        fontWeight: '400',
                        lineHeight: '1',
                        whiteSpace: 'nowrap'
                    }}>
                        Standards intelligence workspace
                    </span>
                </div>
            </div>

            <div style={{ position: 'relative' }}>
                <select
                    value={uiLang}
                    onChange={(e) => setUiLang(e.target.value as LanguageCode)}
                    disabled={busy}
                    style={{
                        padding: "8px 32px 8px 12px",
                        borderRadius: "6px",
                        border: "1px solid #cbd5e1",
                        fontSize: "13px",
                        fontWeight: "500",
                        background: "white",
                        color: busy ? "#94a3b8" : "#334155",
                        cursor: busy ? "not-allowed" : "pointer",
                        appearance: "none",
                        WebkitAppearance: "none",
                        backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://w3.org' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='m6 9 6 6 6-6'/></svg>")`,
                        backgroundRepeat: "no-repeat",
                        backgroundPosition: "right 10px center",
                        transition: "all 0.15s ease",
                        outline: "none",
                        opacity: busy ? 0.6 : 1
                    }}
                >
                    <option value="en">English</option>
                    <option value="hi">हिन्दी (Hindi)</option>
                    <option value="mr">मराठी (Marathi)</option>
                    <option value="bn">বাংলা (Bengali)</option>
                    <option value="ta">தமிழ் (Tamil)</option>
                    <option value="as">অসমীয়া (Assamese)</option>
                </select>
            </div>
        </div>
    );
}