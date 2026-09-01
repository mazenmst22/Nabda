import { NextResponse } from "next/server";
import { z } from "zod";
import { clinicalError } from "@/lib/doctor/http";
import {
  clinicalStore,
  getPrescriptionHistory,
  saveReviewedPrescription,
} from "@/lib/doctor/mock-clinical-store";
import { prescriptionExtractionSchema } from "@/lib/schemas";
import { forbidUnless } from "@/lib/rbac/http";
import { previewScenarioFromRequest } from "@/lib/preview/scenario";

const saveSchema = z
  .object({
    payload: prescriptionExtractionSchema,
    acknowledgedFieldIds: z.array(z.string()).default([]),
  })
  .strict();

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const forbidden = await forbidUnless("clinical_record", "read", { clinicId: "clinic-maadi" });
  if (forbidden) return forbidden;
  const { id } = await params;
  if (
    clinicalStore().extractionMode === "invalid" ||
    previewScenarioFromRequest(request) === "invalid-json"
  ) {
    return clinicalError(request, "EXTRACTION_INVALID_JSON", 422);
  }
  return NextResponse.json(getPrescriptionHistory(id));
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const forbidden = await forbidUnless("clinical_record", "create", { clinicId: "clinic-maadi" });
  if (forbidden) return forbidden;
  const { id } = await params;
  const parsed = saveSchema.safeParse(await request.json());
  if (!parsed.success) return clinicalError(request, "EXTRACTION_INVALID_JSON", 422);
  const prescription = saveReviewedPrescription(
    id,
    parsed.data.payload,
    new Set(parsed.data.acknowledgedFieldIds),
  );
  if (!prescription) return clinicalError(request, "VERSION_CONFLICT", 409);
  return NextResponse.json(prescription, { status: 201 });
}
