import { NextResponse } from "next/server";
import { approveCurrentPrescription } from "@/lib/doctor/mock-clinical-store";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = (await request.json()) as { signature?: string };
  if (!body.signature)
    return NextResponse.json({ detail: "Signature is required" }, { status: 422 });
  try {
    const prescription = approveCurrentPrescription(id);
    if (!prescription) return new NextResponse(null, { status: 404 });
    return NextResponse.json(prescription);
  } catch {
    return NextResponse.json(
      {
        type: "https://nabda.health/errors/review-incomplete",
        title: "Review incomplete",
        status: 422,
        code: "UNKNOWN_ERROR",
        detail: "Every low-confidence field requires explicit acknowledgement.",
        correlationId: request.headers.get("X-Correlation-Id") ?? crypto.randomUUID(),
      },
      { status: 422 },
    );
  }
}
