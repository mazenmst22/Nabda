import { NextResponse } from "next/server";
import { confirmAudioUpload } from "@/lib/doctor/mock-clinical-store";

export async function PUT(request: Request) {
  const audioKey = new URL(request.url).searchParams.get("audioKey");
  const idempotencyKey = request.headers.get("Idempotency-Key");
  if (!audioKey || !idempotencyKey)
    return NextResponse.json(
      { detail: "audioKey and Idempotency-Key are required." },
      { status: 400 },
    );
  const bytes = (await request.arrayBuffer()).byteLength;
  confirmAudioUpload(audioKey, bytes, idempotencyKey);
  return new NextResponse(null, { status: 204 });
}
