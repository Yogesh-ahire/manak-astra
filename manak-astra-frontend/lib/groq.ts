// E:\projects\standards-ingestion-frontend\lib\groq.ts

import { extractCitedISNumbers, cleanRawText } from "./validation";
import type { ExtractedSpecification } from "./types";

const GROQ_TIMEOUT_MS = 12000;
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const DEFAULT_MODEL = "openai/gpt-oss-20b";

/* -------------------------------------------------------------------------- */
/* SYSTEM PROMPT                                                              */
/* -------------------------------------------------------------------------- */

const SYSTEM_PROMPT = `
You are MANAKAI's procurement specification extraction engine.

Your job is ONLY to extract structured information from the supplied procurement specification.
The text provided will be in English (either originally or pre-translated).

Extract these fields:
1. product - The main product/material/equipment being procured.
2. application - The stated or clearly described intended use/application.
3. attributes - Important technical characteristics explicitly present in the text.
4. cited_is_numbers - Indian Standard identifiers explicitly cited.

If information is missing:
- product -> empty string
- application -> empty string
- attributes -> empty array
- cited_is_numbers -> empty array

Return ONLY the JSON object. No markdown, no explanations.
`;

/* -------------------------------------------------------------------------- */
/* STRUCTURED OUTPUT SCHEMA                                                   */
/* -------------------------------------------------------------------------- */

const RESPONSE_SCHEMA = {
  type: "json_schema",
  json_schema: {
    name: "manakai_specification",
    strict: true,
    schema: {
      type: "object",
      additionalProperties: false,
      properties: {
        product: { type: "string" },
        application: { type: "string" },
        attributes: {
          type: "array",
          items: { type: "string" },
        },
        cited_is_numbers: {
          type: "array",
          items: { type: "string" },
        },
      },
      required: ["product", "application", "attributes", "cited_is_numbers"],
    },
  },
} as const;

/* -------------------------------------------------------------------------- */
/* NORMALIZE GROQ OUTPUT                                                      */
/* -------------------------------------------------------------------------- */

function normalizeOutput(value: unknown, originalText: string): ExtractedSpecification {
  const raw = value && typeof value === "object" ? (value as Record<string, unknown>) : {};

  const product = typeof raw.product === "string" ? raw.product.trim() : "";
  const application = typeof raw.application === "string" ? raw.application.trim() : "";
  const attributes = Array.isArray(raw.attributes)
    ? raw.attributes.filter((item): item is string => typeof item === "string").map((item) => item.trim()).filter(Boolean)
    : [];

  const modelCitations = Array.isArray(raw.cited_is_numbers)
    ? raw.cited_is_numbers.filter((item): item is string => typeof item === "string").map((item) => item.trim()).filter(Boolean)
    : [];

  const regexCitations = extractCitedISNumbers(originalText);
  const cited = Array.from(new Set([...modelCitations, ...regexCitations]));

  return {
    product,
    application,
    attributes: Array.from(new Set(attributes)),
    cited_is_numbers: cited,
  };
}

/* -------------------------------------------------------------------------- */
/* FALLBACK                                                                   */
/* -------------------------------------------------------------------------- */

function buildFallback(originalText: string, reason: string): ExtractedSpecification {
  const clean = cleanRawText(originalText);
  const firstLine = clean.split(/\n|[.!?]/).map((item) => item.trim()).find(Boolean) || "Raw procurement specification";

  return {
    product: firstLine.slice(0, 160),
    application: "",
    attributes: [],
    cited_is_numbers: extractCitedISNumbers(originalText),
    extraction_method: "raw-fallback",
    fallback_reason: reason,
  };
}

/* -------------------------------------------------------------------------- */
/* MAIN EXTRACTION FUNCTION                                                   */
/* -------------------------------------------------------------------------- */

export async function extractWithGroq(englishText: string): Promise<{ specification: ExtractedSpecification; usedFallback: boolean }> {
  const apiKey = process.env.GROQ_API_KEY;
  const model = process.env.GROQ_MODEL || DEFAULT_MODEL;

  if (!apiKey) {
    return {
      specification: buildFallback(englishText, "GROQ_API_KEY is not configured."),
      usedFallback: true,
    };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), GROQ_TIMEOUT_MS);

  try {
    const response = await fetch(GROQ_URL, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        reasoning_effort: "low",
        temperature: 0,
        max_tokens: 1200,
        response_format: RESPONSE_SCHEMA,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: `TECHNICAL PROCUREMENT SPECIFICATION:\n\n${englishText}` },
        ],
      }),
    });

    const raw = await response.text();
    let json: any = {};
    try {
      json = raw ? JSON.parse(raw) : {};
    } catch {
      throw new Error(`Groq returned invalid HTTP JSON: ${raw.slice(0, 500)}`);
    }

    if (!response.ok) {
      throw new Error(`Groq ${response.status}: ${json?.error?.message || "Unknown API error"}`);
    }

    const content = json?.choices?.[0]?.message?.content;
    if (!content) throw new Error("Groq returned an empty extraction response.");

    let parsed: unknown;
    try {
      parsed = typeof content === "string" ? JSON.parse(content) : content;
    } catch {
      throw new Error(`Groq returned invalid extraction JSON: ${String(content).slice(0, 500)}`);
    }

    const specification = normalizeOutput(parsed, englishText);

    return { specification, usedFallback: false };
  } catch (error) {
    const reason = error instanceof DOMException && error.name === "AbortError"
      ? "Groq extraction timed out."
      : error instanceof Error ? error.message : "Groq extraction failed.";
    
    console.error("Groq extraction fallback:", reason);

    return {
      specification: buildFallback(englishText, reason),
      usedFallback: true,
    };
  } finally {
    clearTimeout(timeout);
  }
}