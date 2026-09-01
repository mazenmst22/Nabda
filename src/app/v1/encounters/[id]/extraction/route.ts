import { NextResponse } from "next/server";
import { startReExtraction } from "@/lib/doctor/mock-clinical-store";

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return NextResponse.json(startReExtraction(id), { status: 202 });
}
