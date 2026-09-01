import { NextResponse } from "next/server";
import { bookingError } from "@/lib/booking/mock-http";
import { commitStoredAppointment, consumeNetworkRetry } from "@/lib/booking/mock-scheduling-store";
import { addReceptionAppointment } from "@/lib/reception/data";

export async function POST(request: Request) {
  const idempotencyKey = request.headers.get("Idempotency-Key");
  if (!idempotencyKey)
    return NextResponse.json({ detail: "Idempotency-Key is required" }, { status: 400 });
  const input = (await request.json()) as {
    holdId?: string;
    patientId?: string;
    source?: "patient_web" | "reception" | "pulse";
  };
  if (!input.holdId || !input.patientId)
    return NextResponse.json({ detail: "holdId and patientId are required" }, { status: 422 });

  if (
    process.env.NODE_ENV !== "production" &&
    request.headers.get("X-Nabda-Test-Scenario") === "network-retry" &&
    consumeNetworkRetry(idempotencyKey)
  ) {
    return bookingError(request, "PROVIDER_UNAVAILABLE", 503);
  }

  const result = commitStoredAppointment({
    holdId: input.holdId,
    patientId: input.patientId,
    idempotencyKey,
    source: input.source,
  });
  if (result.kind === "expired") return bookingError(request, "HOLD_EXPIRED", 409);
  if (input.source === "reception") addReceptionAppointment(result.appointment);
  return NextResponse.json(result.appointment, {
    status: result.replayed ? 200 : 201,
    headers: { "X-Idempotent-Replay": result.replayed ? "true" : "false" },
  });
}
