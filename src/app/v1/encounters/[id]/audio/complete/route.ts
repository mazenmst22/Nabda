import { NextResponse } from "next/server";
import { clinicalError } from "@/lib/doctor/http";
import {
  completeAudio,
  consentForEncounter,
  hasAudioUpload,
  hasServerAudioConsent,
} from "@/lib/doctor/mock-clinical-store";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const input = (await request.json()) as { audioKey?: string };
  if (!hasServerAudioConsent(id)) {
    const consent = consentForEncounter(id);
    return clinicalError(
      request,
      consent?.status === "revoked" ? "CONSENT_REVOKED" : "CONSENT_REQUIRED",
      409,
    );
  }
  if (!input.audioKey || !hasAudioUpload(input.audioKey))
    return NextResponse.json({ detail: "The uploaded audio was not confirmed." }, { status: 422 });
  return NextResponse.json(completeAudio(input.audioKey), { status: 202 });
}
