// E:\projects\standards-ingestion-frontend\app\api\extract-specs\route.ts

import { NextResponse } from "next/server";
import { cleanRawText } from "@/lib/validation";
import { extractWithGroq } from "@/lib/groq";
import { detectLanguage } from "@/lib/language";
import { translateToEnglish } from "@/lib/bhashini";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { text?: string };
    const originalText = cleanRawText(body.text ?? "");

    if (!originalText) {
      return NextResponse.json(
        { error: "No procurement specification text was provided." },
        { status: 400 }
      );
    }

    // 1. Language Detection
    // Safely cast to 'any' to bypass the strict DetectedLanguage interface mismatch
    const langInfo = detectLanguage(originalText) as any;
    let textForExtraction = originalText;
    let translationApplied = false;

    // Safely resolve the language code and status based on what franc-min actually returns
    const isEnglish = langInfo.isEnglish ?? (langInfo.name === "English");
    const langCode = langInfo.code3 ?? langInfo.code ?? "und";

    // 2. Pre-Translation (if non-English)
    if (!isEnglish && langCode !== "eng" && langCode !== "und") {
      try {
        const transResult = await translateToEnglish(originalText, langCode);
        textForExtraction = transResult.text;
        translationApplied = true;
      } catch (error) {
        console.error("Bhashini translation failed:", error);
        return NextResponse.json(
          { error: "Translation failed. Please try again or provide text in English." },
          { status: 502 }
        );
      }
    }

    // 3. Groq Extraction (Always runs on English text now)
    const { specification, usedFallback } = await extractWithGroq(textForExtraction);

    return NextResponse.json({
      ...specification,
      source_text: originalText,
      translated_text: translationApplied ? textForExtraction : null,
      source_language: langInfo.name || "Unknown",
      translation_applied: translationApplied,
      extraction_method: usedFallback ? "raw-fallback" : "groq",
    });
  } catch (error) {
    console.error("Specification extraction error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Specification extraction failed." },
      { status: 500 }
    );
  }
}