import { NextResponse } from "next/server";
import { z } from "zod";
import { clinicalError } from "@/lib/doctor/http";
import { getCurrentTranscript, saveTranscriptVersion } from "@/lib/doctor/mock-clinical-store";
import { transcriptSegmentSchema } from "@/lib/schemas";
import { forbidUnless } from "@/lib/rbac/http";

const updateSchema = z.object({ segments: z.array(transcriptSegmentSchema) }).strict();

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const forbidden = await forbidUnless("clinical_record", "read", { clinicId: "clinic-maadi" });
  if (forbidden) return forbidden;
  const { id } = await params;
  const transcript = getCurrentTranscript(id);
  if (!transcript) return new NextResponse(null, { status: 404 });
  return NextResponse.json(transcript);
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const forbidden = await forbidUnless("clinical_record", "update", { clinicId: "clinic-maadi" });
  if (forbidden) return forbidden;
  const { id } = await params;
  const parsed = updateSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ detail: "Invalid segments" }, { status: 422 });
  const transcript = saveTranscriptVersion(
    id,
    Number(request.headers.get("If-Match")),
    parsed.data.segments,
  );
  if (!transcript) return clinicalError(request, "VERSION_CONFLICT", 409);
  return NextResponse.json(transcript);
}
