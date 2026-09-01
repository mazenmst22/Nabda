import { NextResponse } from "next/server";
import { clinicalError } from "@/lib/doctor/http";
import { consentForEncounter, hasServerAudioConsent } from "@/lib/doctor/mock-clinical-store";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!hasServerAudioConsent(id)) {
    const consent = consentForEncounter(id);
    return clinicalError(
      request,
      consent?.status === "revoked" ? "CONSENT_REVOKED" : "CONSENT_REQUIRED",
      409,
    );
  }
  const audioKey = `audio/${id}.webm`;
  const uploadUrl = new URL("/api/uploads/audio", request.url);
  uploadUrl.searchParams.set("audioKey", audioKey);
  return NextResponse.json({ uploadUrl: uploadUrl.toString(), audioKey });
}
