// E:\projects\Completed Projects\ManakAstra\manak-astra-frontend\lib\api.ts

import type {
  AnalysisPayload,
  AnalysisResponse,
} from "./types";
import { getDemoData } from "./demo-data"; // We will create this file next

/**
 * Send the verified procurement specification
 * to the MANAKAI recommendation engine.
 */
export async function analyzeProcurement(
  payload: AnalysisPayload,
): Promise<AnalysisResponse> {
  try {
    const response = await fetch(
      "/api/v1/recommend",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      },
    );

    // If backend is down or returns error, trigger the demo fallback
    if (!response.ok) {
      console.warn(`Backend returned HTTP ${response.status}. Falling back to offline demo data.`);
      return getDemoData(payload);
    }

    const data = await response.json();
    
    if (data?.status === "error") {
      console.warn(`Backend returned application error. Falling back to offline demo data.`);
      return getDemoData(payload);
    }

    return data as AnalysisResponse;
  } catch (error) {
    // Network failure (server down, CORS, timeout)
    console.error("Network error reaching backend. Falling back to offline demo data:", error);
    return getDemoData(payload);
  }
}

/**
 * Backward-compatible alias.
 */
export async function requestAnalysis(
  payload: AnalysisPayload,
): Promise<AnalysisResponse> {
  return analyzeProcurement(payload);
}