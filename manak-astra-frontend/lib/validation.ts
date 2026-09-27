// lib/validation.ts

export const MAX_FILE_BYTES = 2 * 1024 * 1024;
export const MAX_PDF_PAGES = 5;
export const MAX_TEXT_LENGTH = 5000;

export function cleanRawText(text: string): string {
  return text.replace(/\u0000/g, "").replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
}

export function extractCitedISNumbers(text: string): string[] {
  const matches = text.match(/\bIS\s*[-:]?\s*\d{3,6}(?:\s*\([^)]+\))?(?:\s*:\s*\d{4})?\b/gi) ?? [];
  return Array.from(new Set(matches.map((item) => item.replace(/\s+/g, " ").trim())));
}

export function validateText(text: string): string | null {
  if (!text.trim()) return "Paste or type the procurement specification first.";
  
  // FIXED: Allow queries as short as 3 characters so "helmet" does not lock the UI
  if (text.trim().length < 3) return "Please provide at least 3 characters.";
  
  if (text.trim().length > MAX_TEXT_LENGTH) return `Text exceeds the ${MAX_TEXT_LENGTH} character limit. Please isolate the technical parameters.`;
  return null;
}