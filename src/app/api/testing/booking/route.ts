import { NextResponse } from "next/server";
import { bookingStore, resetBookingStore } from "@/lib/booking/mock-scheduling-store";
import { resetPatientAppointments } from "@/lib/patient/data";

export function GET() {
  if (process.env.NODE_ENV === "production")
    return NextResponse.json({ code: "NOT_FOUND" }, { status: 404 });
  const store = bookingStore();
  return NextResponse.json({
    appointmentCount: store.appointmentCount,
    idempotencyKeys: [...store.appointmentsByKey.keys()],
  });
}

export function DELETE() {
  if (process.env.NODE_ENV === "production")
    return NextResponse.json({ code: "NOT_FOUND" }, { status: 404 });
  resetBookingStore();
  resetPatientAppointments();
  return NextResponse.json({ reset: true });
}
