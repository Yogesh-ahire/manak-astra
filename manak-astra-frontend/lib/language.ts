// E:\projects\standards-ingestion-frontend\lib\language.ts

import { francAll } from "franc-min";
import type { DetectedLanguage } from "./types";

const LANGUAGE_NAMES: Record<string, string> = {
  eng: "English",
  asm: "Assamese",
  ben: "Bengali",
  bod: "Bodo",
  doi: "Dogri",
  guj: "Gujarati",
  hin: "Hindi",
  kan: "Kannada",
  kas: "Kashmiri",
  kok: "Konkani",
  mai: "Maithili",
  mal: "Malayalam",
  mni: "Manipuri",
  mar: "Marathi",
  nep: "Nepali",
  ori: "Odia",
  pan: "Punjabi",
  san: "Sanskrit",
  sat: "Santali",
  snd: "Sindhi",
  tam: "Tamil",
  tel: "Telugu",
  urd: "Urdu",
};

const CODE_2: Record<string, string> = {
  eng: "en",
  asm: "as",
  ben: "bn",
  bod: "brx",
  doi: "doi",
  guj: "gu",
  hin: "hi",
  kan: "kn",
  kas: "ks",
  kok: "kok",
  mai: "mai",
  mal: "ml",
  mni: "mni",
  mar: "mr",
  nep: "ne",
  ori: "or",
  pan: "pa",
  san: "sa",
  sat: "sat",
  snd: "sd",
  tam: "ta",
  tel: "te",
  urd: "ur",
};

export function detectLanguage(text: string): DetectedLanguage {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (!normalized) {
    return {
      code3: "und",
      code2: "",
      name: "Unknown",
      confidence: 0,
      isEnglish: false,
    };
  }

  // `franc-min` is intentionally local and lightweight. For very short
  // snippets, a confident decision is not possible, so we conservatively
  // treat the input as English and allow Groq to handle it unchanged.
  if (normalized.length < 24) {
    return {
      code3: "eng",
      code2: "en",
      name: "English",
      confidence: 0.5,
      isEnglish: true,
    };
  }

  const ranked = francAll(normalized.slice(0, 5000));
  const top = ranked[0];
  const code3 = top?.[0] ?? "eng";
  const score = typeof top?.[1] === "number" ? Number(top[1]) : 0;
  const name = LANGUAGE_NAMES[code3] ?? "Other language";
  const confidence = Math.max(0, Math.min(1, score));

  if (code3 === "eng") {
    return {
      code3,
      code2: "en",
      name,
      confidence,
      isEnglish: true,
    };
  }

  return {
    code3,
    code2: CODE_2[code3] ?? code3,
    name,
    confidence,
    isEnglish: false,
  };
}

export function languageName(code3: string): string {
  return LANGUAGE_NAMES[code3] ?? code3;
}

export function languageCode2(code3: string): string {
  return CODE_2[code3] ?? code3;
}

export const SUPPORTED_INDIAN_LANGUAGES = Object.keys(CODE_2).filter(
  (code) => code !== "eng",
);
