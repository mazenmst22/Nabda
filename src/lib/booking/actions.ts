import type { ApiAction, ApiClient } from "@/lib/api/client";
import { appointmentSchema, holdReleasedSchema, holdSchema } from "@/lib/schemas";

export function holdAppointmentSlot({
  api,
  doctorId,
  slotStart,
  patientId,
  action,
  retries = 0,
  headers,
}: {
  api: ApiClient;
  doctorId: string;
  slotStart: string;
  patientId?: string;
  action: ApiAction;
  retries?: number;
  headers?: HeadersInit;
}) {
  return api.post(
    "/v1/appointments/holds",
    holdSchema,
    { doctorId, slotStart, ...(patientId ? { patientId } : {}) },
    { action, retries, headers },
  );
}

export function releaseAppointmentHold({
  api,
  holdId,
  action,
}: {
  api: ApiClient;
  holdId: string;
  action: ApiAction;
}) {
  return api.delete(`/v1/appointments/holds/${holdId}`, holdReleasedSchema, {
    action,
    retries: 0,
  });
}

export function commitHeldAppointment({
  api,
  holdId,
  patientId,
  source,
  action,
  retries = 1,
  headers,
}: {
  api: ApiClient;
  holdId: string;
  patientId: string;
  source: "patient_web" | "reception" | "pulse";
  action: ApiAction;
  retries?: number;
  headers?: HeadersInit;
}) {
  return api.post(
    "/v1/appointments",
    appointmentSchema,
    { holdId, patientId, source },
    { action, retries, headers },
  );
}
