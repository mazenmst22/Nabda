import type { Appointment, Patient, QueueEntry } from "@/lib/schemas";

export type ReceptionDoctor = {
  id: string;
  nameAr: string;
  nameEn: string;
  specialtyAr: string;
  specialtyEn: string;
  fee: number;
};

export type ReceptionPatient = Pick<Patient, "id" | "fullName" | "phone" | "preferredLanguage">;

export type ReceptionAppointment = Appointment & {
  patientName: string;
};

export type ReceptionQueueEntry = QueueEntry & {
  patientName: string;
  doctorNameAr: string;
  doctorNameEn: string;
  version: number;
};

type ReceptionStore = {
  appointments: Map<string, ReceptionAppointment>;
  queue: Map<string, ReceptionQueueEntry>;
};

declare global {
  var __nabdaReceptionStore: ReceptionStore | undefined;
}

export const receptionDoctors: ReceptionDoctor[] = [
  {
    id: "dr-mariam-fouad",
    nameAr: "د. مريم فؤاد",
    nameEn: "Dr Mariam Fouad",
    specialtyAr: "قلب وأوعية",
    specialtyEn: "Cardiology",
    fee: 450,
  },
  {
    id: "dr-farida-hassan",
    nameAr: "د. فريدة حسن",
    nameEn: "Dr Farida Hassan",
    specialtyAr: "أطفال",
    specialtyEn: "Paediatrics",
    fee: 400,
  },
  {
    id: "dr-karim-mansour",
    nameAr: "د. كريم منصور",
    nameEn: "Dr Karim Mansour",
    specialtyAr: "عظام",
    specialtyEn: "Orthopaedics",
    fee: 650,
  },
];

export const receptionPatients: ReceptionPatient[] = [
  { id: "patient-amal", fullName: "أمل حسن", phone: "+201001234567", preferredLanguage: "ar" },
  { id: "patient-nour", fullName: "نور محمود", phone: "+201111223344", preferredLanguage: "ar" },
  { id: "patient-salma", fullName: "Salma Adel", phone: "+201222334455", preferredLanguage: "en" },
  {
    id: "patient-hassan",
    fullName: "حسن إبراهيم",
    phone: "+201099887766",
    preferredLanguage: "ar",
  },
];

function at(hour: number, minute = 0) {
  return new Date(Date.UTC(2026, 7, 29, hour - 3, minute)).toISOString();
}

function seedAppointments(): ReceptionAppointment[] {
  return [
    {
      id: "reception-appointment-amal",
      patientId: "patient-amal",
      patientName: "أمل حسن",
      doctorId: "dr-mariam-fouad",
      clinicId: "clinic-maadi",
      locationId: "clinic-maadi-main",
      start: at(9, 30),
      end: at(10),
      status: "booked",
      price: { amount: 450, currency: "EGP" },
      source: "reception",
      version: 3,
    },
    {
      id: "reception-appointment-nour",
      patientId: "patient-nour",
      patientName: "نور محمود",
      doctorId: "dr-farida-hassan",
      clinicId: "clinic-maadi",
      locationId: "clinic-maadi-main",
      start: at(10),
      end: at(10, 30),
      status: "checked_in",
      price: { amount: 400, currency: "EGP" },
      source: "patient_web",
      version: 2,
    },
    {
      id: "reception-appointment-salma",
      patientId: "patient-salma",
      patientName: "Salma Adel",
      doctorId: "dr-karim-mansour",
      clinicId: "clinic-maadi",
      locationId: "clinic-maadi-main",
      start: at(11),
      end: at(11, 30),
      status: "in_progress",
      price: { amount: 650, currency: "EGP" },
      source: "reception",
      version: 4,
    },
    {
      id: "reception-appointment-hassan",
      patientId: "patient-hassan",
      patientName: "حسن إبراهيم",
      doctorId: "dr-mariam-fouad",
      clinicId: "clinic-maadi",
      locationId: "clinic-maadi-main",
      start: at(12),
      end: at(12, 30),
      status: "completed",
      price: { amount: 450, currency: "EGP" },
      source: "reception",
      version: 2,
    },
  ];
}

function seedQueue(): ReceptionQueueEntry[] {
  return [
    {
      id: "queue-amal",
      appointmentId: "reception-appointment-amal",
      patientId: "patient-amal",
      patientName: "أمل حسن",
      doctorNameAr: "د. مريم فؤاد",
      doctorNameEn: "Dr Mariam Fouad",
      position: 1,
      state: "waiting",
      estimatedWaitMin: 12,
      version: 1,
    },
    {
      id: "queue-nour",
      appointmentId: "reception-appointment-nour",
      patientId: "patient-nour",
      patientName: "نور محمود",
      doctorNameAr: "د. فريدة حسن",
      doctorNameEn: "Dr Farida Hassan",
      position: 2,
      state: "called",
      estimatedWaitMin: 4,
      version: 2,
    },
    {
      id: "queue-salma",
      appointmentId: "reception-appointment-salma",
      patientId: "patient-salma",
      patientName: "Salma Adel",
      doctorNameAr: "د. كريم منصور",
      doctorNameEn: "Dr Karim Mansour",
      position: 3,
      state: "in_room",
      estimatedWaitMin: 0,
      version: 3,
    },
    {
      id: "queue-hassan",
      appointmentId: "reception-appointment-hassan",
      patientId: "patient-hassan",
      patientName: "حسن إبراهيم",
      doctorNameAr: "د. مريم فؤاد",
      doctorNameEn: "Dr Mariam Fouad",
      position: 4,
      state: "done",
      estimatedWaitMin: 0,
      version: 2,
    },
  ];
}

function makeStore(): ReceptionStore {
  return {
    appointments: new Map(seedAppointments().map((appointment) => [appointment.id, appointment])),
    queue: new Map(seedQueue().map((entry) => [entry.id, entry])),
  };
}

export function receptionStore() {
  globalThis.__nabdaReceptionStore ??= makeStore();
  return globalThis.__nabdaReceptionStore;
}

export function resetReceptionStore() {
  globalThis.__nabdaReceptionStore = makeStore();
}

export function getReceptionAppointments() {
  return [...receptionStore().appointments.values()];
}

export function appointmentResponse(appointment: Appointment): Appointment {
  return {
    id: appointment.id,
    patientId: appointment.patientId,
    doctorId: appointment.doctorId,
    clinicId: appointment.clinicId,
    locationId: appointment.locationId,
    start: appointment.start,
    end: appointment.end,
    status: appointment.status,
    price: appointment.price,
    source: appointment.source,
    ...(appointment.holdExpiresAt ? { holdExpiresAt: appointment.holdExpiresAt } : {}),
    version: appointment.version,
  };
}

export function getReceptionAppointment(id: string) {
  return receptionStore().appointments.get(id);
}

export function addReceptionAppointment(appointment: Appointment) {
  const patientName =
    receptionPatients.find((patient) => patient.id === appointment.patientId)?.fullName ??
    appointment.patientId;
  const display = { ...appointment, patientName };
  receptionStore().appointments.set(display.id, display);
  return display;
}

export function moveReceptionAppointment(id: string, start: string, expectedVersion: number) {
  const current = getReceptionAppointment(id);
  if (!current) return { kind: "missing" as const };
  if (current.version !== expectedVersion)
    return { kind: "conflict" as const, appointment: current };
  const updated: ReceptionAppointment = {
    ...current,
    start,
    end: new Date(Date.parse(start) + 30 * 60 * 1000).toISOString(),
    version: current.version + 1,
  };
  receptionStore().appointments.set(id, updated);
  return { kind: "updated" as const, appointment: updated };
}

export function simulateReceptionConflict(id: string) {
  const current = getReceptionAppointment(id);
  if (!current) return undefined;
  const start = new Date(Date.parse(current.start) + 60 * 60 * 1000).toISOString();
  const changed = {
    ...current,
    start,
    end: new Date(Date.parse(start) + 30 * 60 * 1000).toISOString(),
    version: current.version + 1,
  };
  receptionStore().appointments.set(id, changed);
  return changed;
}

export function getReceptionQueue() {
  return [...receptionStore().queue.values()];
}

export function queueResponse(entry: ReceptionQueueEntry): QueueEntry {
  return {
    id: entry.id,
    appointmentId: entry.appointmentId,
    patientId: entry.patientId,
    position: entry.position,
    state: entry.state,
    estimatedWaitMin: entry.estimatedWaitMin,
  };
}

export function updateReceptionQueue(
  id: string,
  state: QueueEntry["state"],
  expectedVersion: number,
) {
  const current = receptionStore().queue.get(id);
  if (!current) return { kind: "missing" as const };
  if (current.version !== expectedVersion) return { kind: "conflict" as const, entry: current };
  const updated = { ...current, state, version: current.version + 1 };
  receptionStore().queue.set(id, updated);
  return { kind: "updated" as const, entry: updated };
}
