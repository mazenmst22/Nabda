import { NextResponse } from "next/server";
import { revokeConsent } from "@/lib/doctor/mock-clinical-store";

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const consent = revokeConsent(id);
  if (!consent) return NextResponse.json({ detail: "Consent record not found." }, { status: 404 });
  return NextResponse.json(consent);
}
