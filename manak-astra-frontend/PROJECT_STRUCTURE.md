# Project structure

```text
standards-ingestion-frontend/
├── app/
│   ├── api/
│   │   ├── extract-specs/route.ts      # franc-min + Bhashini + Groq orchestration
│   │   ├── parse-pdf/route.ts           # Node PDF parsing with pdf-parse
│   │   └── v1/recommend/route.ts        # FastAPI proxy boundary
│   ├── globals.css                      # UI system, responsive layout, states
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── AnalysisResult.tsx
│   ├── ChipInput.tsx
│   ├── IngestionWorkspace.tsx           # Main state machine / user journey
│   ├── PdfDropzone.tsx                  # size + page checks in browser
│   ├── VerificationCard.tsx             # FR-12 editable verification
│   └── WorkflowProgress.tsx
├── lib/
│   ├── api.ts
│   ├── bhashini.ts
│   ├── groq.ts
│   ├── language.ts                      # local franc-min detection
│   ├── types.ts
│   └── validation.ts
├── .env.example
├── .gitignore
├── next.config.mjs
├── next-env.d.ts
├── package.json
├── PROJECT_STRUCTURE.md
├── README.md
└── tsconfig.json
```

## Flow implemented

```text
User text / PDF
      ↓
Client validation
      ↓
/api/parse-pdf (PDF only)
      ↓
local language detection (franc-min)
      ↓
Bhashini only for non-English supported Indian languages
      ↓
Groq structured extraction + strict JSON
      ↓
Editable verification card (no second LLM correction loop)
      ↓
Verified search payload
      ↓
/api/v1/recommend → FastAPI
```
