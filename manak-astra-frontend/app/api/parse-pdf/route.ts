// E:\projects\standards-ingestion-frontend new\app\api\parse-pdf\route.ts

import { NextResponse } from "next/server";
import pdf from "pdf-parse";
import { MAX_FILE_BYTES, MAX_PDF_PAGES } from "@/lib/validation";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No PDF file was provided." }, { status: 400 });
    }

    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      return NextResponse.json({ error: "Only PDF documents are supported." }, { status: 400 });
    }

    if (file.size > MAX_FILE_BYTES) {
      return NextResponse.json({ error: `File exceeds limit. Upload technical specification section only.` }, { status: 413 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const parsed = await pdf(buffer);
    const pages = parsed.numpages ?? 0;

    if (pages > MAX_PDF_PAGES) {
      return NextResponse.json({
        error: `PDF contains ${pages} pages. Maximum allowed is ${MAX_PDF_PAGES}.`,
      }, { status: 413 });
    }

    const rawText = parsed.text?.replace(/\r\n/g, "\n").trim() ?? "";

    if (!rawText) {
      return NextResponse.json({
        error: "Scanned document detected. Please paste the plain technical specification text directly.",
        code: "SCANNED_PDF",
      }, { status: 422 });
    }

    return NextResponse.json({ raw_text: rawText, pages });
  } catch (error) {
    console.error("PDF extraction error:", error);
    return NextResponse.json({ error: "Unable to parse this PDF. Please verify the file and try again." }, { status: 500 });
  }
}