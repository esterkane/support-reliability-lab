import { NextRequest, NextResponse } from "next/server";
import { checkPayloadSize, PAYLOAD_LIMIT_BYTES } from "@/lib/upload";

/**
 * Upload endpoint that enforces a body-size limit (the payload-too-large incident).
 * Bodies over PAYLOAD_LIMIT_BYTES get a deterministic 413; the remediation for real
 * large files is a client-side upload to Blob storage rather than the request body.
 */
export async function POST(req: NextRequest) {
  const body = await req.arrayBuffer();
  const result = checkPayloadSize(body.byteLength);

  if (!result.ok) {
    return NextResponse.json(
      {
        error: "Payload Too Large",
        size: result.size,
        limit: result.limit,
        hint: "Upload large files directly to Blob storage instead of the request body.",
      },
      { status: 413 },
    );
  }

  return NextResponse.json({ ok: true, size: result.size, limit: PAYLOAD_LIMIT_BYTES });
}
