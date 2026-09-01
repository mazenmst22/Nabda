import { NextResponse } from "next/server";
import {
  getReceptionAppointments,
  getReceptionQueue,
  resetReceptionStore,
} from "@/lib/reception/data";

export async function GET() {
  if (process.env.NODE_ENV === "production") return new NextResponse(null, { status: 404 });
  return NextResponse.json({
    appointments: getReceptionAppointments(),
    queue: getReceptionQueue(),
  });
}

export async function DELETE() {
  if (process.env.NODE_ENV === "production") return new NextResponse(null, { status: 404 });
  resetReceptionStore();
  return new NextResponse(null, { status: 204 });
}
