import { NextResponse } from "next/server";
import { hasActiveHold } from "@/lib/booking/mock-scheduling-store";
import { getPatientAppointment, updatePatientAppointment } from "@/lib/patient/data";
import {
  appointmentResponse,
  getReceptionAppointment,
  moveReceptionAppointment,
  simulateReceptionConflict,
} from "@/lib/reception/data";

function versionConflict(request: Request) {
  return NextResponse.json(
    {
      type: "https://nabda.health/errors/version-conflict",
      title: "Appointment changed",
      status: 409,
      code: "VERSION_CONFLICT",
      detail: "This appointment changed. The latest schedule has been loaded before you retry.",
      correlationId: request.headers.get("X-Correlation-Id") ?? crypto.randomUUID(),
    },
    { status: 409 },
  );
}

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const appointment = getReceptionAppointment(id) ?? getPatientAppointment(id);
  if (!appointment)
    return NextResponse.json({ code: "NOT_AUTHORIZED", detail: "Access denied" }, { status: 403 });
  return NextResponse.json(appointmentResponse(appointment));
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const receptionAppointment = getReceptionAppointment(id);
  if (receptionAppointment) {
    if (request.headers.get("X-Nabda-Test-Scenario") === "version-conflict") {
      simulateReceptionConflict(id);
      return versionConflict(request);
    }
    const input = (await request.json()) as { slotStart?: string };
    if (!input.slotStart)
      return NextResponse.json({ detail: "slotStart is required" }, { status: 422 });
    const result = moveReceptionAppointment(
      id,
      input.slotStart,
      Number(request.headers.get("If-Match")),
    );
    if (result.kind === "conflict") return versionConflict(request);
    if (result.kind === "missing")
      return NextResponse.json(
        { code: "NOT_AUTHORIZED", detail: "Access denied" },
        { status: 403 },
      );
    return NextResponse.json(appointmentResponse(result.appointment));
  }

  const appointment = getPatientAppointment(id);
  if (!appointment)
    return NextResponse.json({ code: "NOT_AUTHORIZED", detail: "Access denied" }, { status: 403 });
  if (request.headers.get("If-Match") !== String(appointment.version))
    return versionConflict(request);
  const input = (await request.json()) as { status?: string; slotStart?: string };
  if (input.slotStart && !hasActiveHold(appointment.doctorId, input.slotStart))
    return NextResponse.json(
      {
        type: "https://nabda.health/errors/hold-expired",
        title: "Hold expired",
        status: 409,
        code: "HOLD_EXPIRED",
        detail: "The new appointment time is no longer held.",
        correlationId: request.headers.get("X-Correlation-Id") ?? crypto.randomUUID(),
      },
      { status: 409 },
    );
  const updated = updatePatientAppointment(id, {
    ...(input.slotStart ? { slotStart: input.slotStart } : {}),
    ...(input.status ? { status: input.status as typeof appointment.status } : {}),
  });
  return NextResponse.json(updated ? appointmentResponse(updated) : updated);
}
