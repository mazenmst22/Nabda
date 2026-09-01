import { NextResponse } from "next/server";
import { createEncounter } from "@/lib/doctor/mock-clinical-store";

export async function POST() {
  return NextResponse.json(createEncounter(), { status: 201 });
}
