// E:\projects\Python\ManakAstra frontend\app\api\v1\recommend\route.ts

import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    
    // Fallback to localhost if env var is missing
    const fastApiUrl = process.env.FASTAPI_BASE_URL || "http://127.0.0.1:8000";

    const response = await fetch(`${fastApiUrl}/api/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("FastAPI Error:", errorText);
      return NextResponse.json(
        { status: "error", detail: "Backend recommendation engine failed." },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("FastAPI Proxy Route Error:", error);
    return NextResponse.json(
      { status: "error", detail: "Unable to connect to Manak Astra backend." },
      { status: 500 }
    );
  }
}