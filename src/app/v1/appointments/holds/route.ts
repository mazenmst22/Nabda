import { NextResponse } from "next/server";
import { createStoredHold } from "@/lib/booking/mock-scheduling-store";
import { bookingError } from "@/lib/booking/mock-http";

export async function POST(request: Request) {
  const input = (await request.json()) as { doctorId?: string; slotStart?: string };
  const scenario =
    process.env.NODE_ENV === "production" ? null : request.headers.get("X-Nabda-Test-Scenario");
  if (scenario === "slot-taken") return bookingError(request, "SLOT_TAKEN", 409);
  if (!input.doctorId || !input.slotStart)
    return NextResponse.json({ detail: "doctorId and slotStart are required" }, { status: 422 });

  const hold = createStoredHold({
    doctorId: input.doctorId,
    slotStart: input.slotStart,
    expiresInMs: scenario === "hold-expired" ? 4_000 : undefined,
  });
  if (!hold) return bookingError(request, "PROVIDER_UNAVAILABLE", 503);
  const response = {
    holdId: hold.holdId,
    doctorId: hold.doctorId,
    slotStart: hold.slotStart,
    expiresAt: hold.expiresAt,
    price: hold.price,
  };
  return NextResponse.json(response, { status: 201 });
}
