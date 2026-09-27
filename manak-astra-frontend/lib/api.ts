// E:\projects\standards-ingestion-frontend\lib\api.ts

import type {
  AnalysisPayload,
  AnalysisResponse,
} from "./types";

/**
 * Send the verified procurement specification
 * to the MANAKAI recommendation engine.
 */
export async function analyzeProcurement(
  payload: AnalysisPayload,
): Promise<AnalysisResponse> {
  const response = await fetch(
    "/api/v1/recommend",
    {
      method: "POST",

      headers: {
        "Content-Type":
          "application/json",
      },

      body: JSON.stringify(payload),
    },
  );

  let data: any = null;

  try {
    data = await response.json();
  } catch {
    throw new Error(
      `Recommendation API returned an invalid response. HTTP ${response.status}.`,
    );
  }

  if (!response.ok) {
    throw new Error(
      data?.detail ||
        data?.error ||
        `Recommendation request failed with HTTP ${response.status}.`,
    );
  }

  if (data?.status === "error") {
    throw new Error(
      data?.detail ||
        "Recommendation analysis failed.",
    );
  }

  return data as AnalysisResponse;
}

/**
 * Backward-compatible alias.
 *
 * IngestionWorkspace currently imports requestAnalysis,
 * while other parts of the application may use analyzeProcurement.
 *
 * Keeping both prevents unnecessary import breakage.
 */
export async function requestAnalysis(
  payload: AnalysisPayload,
): Promise<AnalysisResponse> {
  return analyzeProcurement(payload);
}