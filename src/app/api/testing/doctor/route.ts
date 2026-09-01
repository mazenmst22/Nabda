import { NextResponse } from "next/server";
import {
  clinicalStore,
  resetClinicalStore,
  setExtractionMode,
} from "@/lib/doctor/mock-clinical-store";

export async function GET() {
  if (process.env.NODE_ENV === "production") return new NextResponse(null, { status: 404 });
  const store = clinicalStore();
  return NextResponse.json({
    consentCount: store.consents.size,
    encounterCount: store.encounters.size,
    uploadCount: store.uploads.size,
    jobCount: store.jobsByAudioKey.size,
    transcriptVersions: [...store.transcriptHistory.values()].at(0)?.length ?? 0,
    prescriptionVersions: [...store.prescriptionHistory.values()].at(0)?.length ?? 0,
    extractionMode: store.extractionMode,
  });
}

export async function POST(request: Request) {
  if (process.env.NODE_ENV === "production") return new NextResponse(null, { status: 404 });
  const input = (await request.json()) as { extractionMode?: "valid" | "invalid" };
  if (input.extractionMode) setExtractionMode(input.extractionMode);
  return NextResponse.json({ extractionMode: clinicalStore().extractionMode });
}

export async function DELETE() {
  if (process.env.NODE_ENV === "production") return new NextResponse(null, { status: 404 });
  resetClinicalStore();
  return new NextResponse(null, { status: 204 });
}
