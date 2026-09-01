import type { Appointment, Hold } from "@/lib/schemas";
import { clinicForDoctor, getDirectoryDoctors } from "@/lib/data/directory";

type StoredHold = Hold & { clinicId: string; locationId: string };

type BookingStore = {
  holds: Map<string, StoredHold>;
  appointmentsByKey: Map<string, Appointment>;
  retryAttemptsByKey: Map<string, number>;
  appointmentCount: number;
};

declare global {
  var __nabdaBookingStore: BookingStore | undefined;
}

function makeStore(): BookingStore {
  return {
    holds: new Map(),
    appointmentsByKey: new Map(),
    retryAttemptsByKey: new Map(),
    appointmentCount: 0,
  };
}

export function bookingStore() {
  globalThis.__nabdaBookingStore ??= makeStore();
  return globalThis.__nabdaBookingStore;
}

export function resetBookingStore() {
  globalThis.__nabdaBookingStore = makeStore();
}

export function createStoredHold({
  doctorId,
  slotStart,
  expiresInMs = 5 * 60 * 1000,
}: {
  doctorId: string;
  slotStart: string;
  expiresInMs?: number;
}) {
  const doctor = getDirectoryDoctors().find((candidate) => candidate.id === doctorId);
  if (!doctor) return null;
  const clinic = clinicForDoctor(doctor);
  if (!clinic) return null;
  const hold: StoredHold = {
    holdId: `hold-${crypto.randomUUID()}`,
    doctorId,
    slotStart,
    expiresAt: new Date(Date.now() + expiresInMs).toISOString(),
    price: doctor.fee,
    clinicId: clinic.id,
    locationId: `${clinic.id}-main`,
  };
  bookingStore().holds.set(hold.holdId, hold);
  return hold;
}

export function releaseStoredHold(holdId: string) {
  bookingStore().holds.delete(holdId);
}

export function hasActiveHold(doctorId: string, slotStart: string) {
  return [...bookingStore().holds.values()].some(
    (hold) =>
      hold.doctorId === doctorId &&
      hold.slotStart === slotStart &&
      Date.parse(hold.expiresAt) > Date.now(),
  );
}

export function commitStoredAppointment({
  holdId,
  patientId,
  idempotencyKey,
  source = "patient_web",
}: {
  holdId: string;
  patientId: string;
  idempotencyKey: string;
  source?: Appointment["source"];
}) {
  const store = bookingStore();
  const existing = store.appointmentsByKey.get(idempotencyKey);
  if (existing) return { kind: "appointment" as const, appointment: existing, replayed: true };
  const hold = store.holds.get(holdId);
  if (!hold || Date.parse(hold.expiresAt) <= Date.now()) return { kind: "expired" as const };

  const appointment: Appointment = {
    id: `appointment-${crypto.randomUUID()}`,
    patientId,
    doctorId: hold.doctorId,
    clinicId: hold.clinicId,
    locationId: hold.locationId,
    start: hold.slotStart,
    end: new Date(Date.parse(hold.slotStart) + 30 * 60 * 1000).toISOString(),
    status: "booked",
    price: hold.price,
    source,
    version: 1,
  };
  store.appointmentsByKey.set(idempotencyKey, appointment);
  store.holds.delete(holdId);
  store.appointmentCount += 1;
  return { kind: "appointment" as const, appointment, replayed: false };
}

export function consumeNetworkRetry(idempotencyKey: string) {
  const store = bookingStore();
  const attempt = (store.retryAttemptsByKey.get(idempotencyKey) ?? 0) + 1;
  store.retryAttemptsByKey.set(idempotencyKey, attempt);
  return attempt === 1;
}
