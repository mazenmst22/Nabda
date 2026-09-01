import { NextResponse } from "next/server";
import { AUDIO_CONSENT_TEXT_VERSION, doctorPatient } from "@/lib/doctor/data";
import { grantConsent } from "@/lib/doctor/mock-clinical-store";

export async function POST(request: Request) {
  const input = (await request.json()) as {
    patientId?: string;
    encounterId?: string;
    purpose?: string;
    textVersion?: string;
  };
  if (
    input.patientId !== doctorPatient.id ||
    !input.encounterId ||
    input.purpose !== "encounter_audio" ||
    input.textVersion !== AUDIO_CONSENT_TEXT_VERSION
  ) {
    return NextResponse.json(
      { detail: "The current audio consent text is required." },
      { status: 422 },
    );
  }
  return NextResponse.json(grantConsent(input.encounterId), { status: 201 });
}
