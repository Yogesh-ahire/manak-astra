# Indian Standards Specification Ingestion — Next.js 14 Frontend

A production-style ingestion and human-verification frontend for procurement specifications.

## Implemented flow

1. Raw text input or PDF upload.
2. Client-side PDF size/page validation.
3. Server-side Node PDF text extraction with `pdf-parse`.
4. Local language detection with `franc-min`.
5. Bhashini translation for non-English supported Indian languages.
6. Groq structured extraction using JSON mode.
7. Human-in-the-loop editable verification card.
8. Raw-text fallback when Groq times out/fails.
9. Thin Next.js proxy to the FastAPI `/api/v1/recommend` endpoint.
10. Results panel for the eventual retrieval/coverage response.

## Run

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000.

## Environment

Set the Groq and Bhashini values in `.env.local`. Set `FASTAPI_BASE_URL` when the Python retrieval backend is available.

### Important implementation detail

PDF parsing is intentionally performed in the Next.js Node runtime with `pdf-parse`, not `pdfplumber`, because `pdfplumber` is Python-only.
