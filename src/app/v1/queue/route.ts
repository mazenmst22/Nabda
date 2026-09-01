import { NextResponse } from "next/server";
import { getReceptionQueue, queueResponse } from "@/lib/reception/data";

export async function GET() {
  return NextResponse.json(getReceptionQueue().map(queueResponse));
}
