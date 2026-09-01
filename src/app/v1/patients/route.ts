import { NextResponse } from "next/server";
import { patientSchema } from "@/lib/schemas";

export async function POST(request: Request) {
  const input = (await request.json()) as Record<string, unknown>;
  const patient = patientSchema.parse({
    ...input,
    id: `patient-${crypto.randomUUID()}`,
    clinicId: request.headers.get("X-Clinic-Id") ?? "clinic-public",
    createdAt: new Date().toISOString(),
    version: 1,
  });
  return NextResponse.json(patient, { status: 201 });
}
