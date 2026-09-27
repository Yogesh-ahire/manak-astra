// E:\projects\standards-ingestion-frontend\lib\bhashini.ts

import { languageCode2, languageName } from "./language";

const BHASHINI_TIMEOUT_MS = 7000;

function extractTranslatedText(payload: unknown): string | null {
  const data = payload as any;
  const candidates = [
    data?.pipelineResponse?.[0]?.output?.[0]?.target,
    data?.pipelineResponse?.[0]?.output?.[0]?.targetText,
    data?.pipelineResponse?.[0]?.output?.[0]?.text,
    data?.data?.[0]?.translation,
    data?.translation,
    data?.translated_text,
    data?.output,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim()) return candidate.trim();
  }
  return null;
}

export async function translateToEnglish(text: string, sourceCode3: string): Promise<{ text: string; language: string }> {
  const endpoint = process.env.BHASHINI_API_URL;
  const apiKey = process.env.BHASHINI_API_KEY;
  const userId = process.env.BHASHINI_USER_ID;
  const serviceId = process.env.BHASHINI_SERVICE_ID;
  const sourceLanguage = languageCode2(sourceCode3);

  if (!endpoint || !apiKey || !sourceLanguage) {
    throw new Error("Bhashini is not fully configured. Set BHASHINI_API_URL, BHASHINI_API_KEY, and language credentials.");
  }

  const body = {
    pipelineTasks: [
      {
        taskType: "translation",
        config: {
          language: {
            sourceLanguage,
            targetLanguage: "en",
          },
          ...(serviceId ? { serviceId } : {}),
          ...(process.env.BHASHINI_PIPELINE_ID ? { pipelineId: process.env.BHASHINI_PIPELINE_ID } : {}),
        },
      },
    ],
    inputData: {
      input: [{ source: text }],
    },
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), BHASHINI_TIMEOUT_MS);

  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Authorization: apiKey,
    };
    if (userId) headers.userID = userId;
    if (apiKey) headers["ulca-api-key"] = apiKey;

    const response = await fetch(endpoint, {
      method: "POST",
      signal: controller.signal,
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const message = await response.text().catch(() => "");
      console.error("Bhashini API Error Payload:", message);
      throw new Error(`Bhashini ${response.status}: ${message.slice(0, 240)}`);
    }

    const payload = await response.json();
    const translated = extractTranslatedText(payload);
    
    if (!translated) {
      console.error("Bhashini payload structure mismatch. Received:", JSON.stringify(payload));
      throw new Error("Bhashini response did not contain translated text in the expected schema.");
    }

    return { text: translated, language: languageName(sourceCode3) };
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("Bhashini translation timed out.");
    }
    throw error instanceof Error ? error : new Error("Bhashini translation failed.");
  } finally {
    clearTimeout(timeout);
  }
}