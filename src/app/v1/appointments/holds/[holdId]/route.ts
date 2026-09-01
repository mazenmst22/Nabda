import { NextResponse } from "next/server";
import { releaseStoredHold } from "@/lib/booking/mock-scheduling-store";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ holdId: string }> },
) {
  const { holdId } = await params;
  releaseStoredHold(holdId);
  return NextResponse.json({ released: true });
}
