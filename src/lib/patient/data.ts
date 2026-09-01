import type { Appointment, Prescription } from "@/lib/schemas";

export type PatientAppointment = Appointment & {
  doctorNameAr: string;
  doctorNameEn: string;
  specialtyAr: string;
  specialtyEn: string;
  clinicNameAr: string;
  clinicNameEn: string;
  clinicAddressAr: string;
  clinicAddressEn: string;
  cancellationPolicyAr: string;
  cancellationPolicyEn: string;
};

export type ApprovedPatientPrescription = Prescription & {
  status: "approved";
  signature: string;
  approvedAt: string;
  doctorNameAr: string;
  doctorNameEn: string;
};

export type PatientEncounterSummary = {
  id: string;
  patientId: string;
  occurredAt: string;
  doctorNameAr: string;
  doctorNameEn: string;
  specialtyAr: string;
  specialtyEn: string;
  summaryAr: string;
  summaryEn: string;
  followUpAr: string;
  followUpEn: string;
  visibleByClinicPolicy: boolean;
};

const hour = 60 * 60 * 1000;

declare global {
  var __nabdaPatientAppointments: PatientAppointment[] | undefined;
}

function timestamp(offsetHours: number) {
  return new Date(Date.now() + offsetHours * hour).toISOString();
}

function makePatientAppointments(): PatientAppointment[] {
  return [
    {
      id: "appointment-upcoming-mariam",
      patientId: "patient-amal",
      doctorId: "dr-mariam-fouad",
      clinicId: "clinic-maadi",
      locationId: "clinic-maadi-main",
      start: timestamp(28),
      end: timestamp(28.5),
      status: "booked",
      price: { amount: 450, currency: "EGP" },
      source: "patient_web",
      version: 2,
      doctorNameAr: "د. مريم فؤاد",
      doctorNameEn: "Dr Mariam Fouad",
      specialtyAr: "قلب وأوعية",
      specialtyEn: "Cardiology",
      clinicNameAr: "عيادات أندلسية",
      clinicNameEn: "Andalusia Clinics",
      clinicAddressAr: "شارع النصر، المعادي الجديدة",
      clinicAddressEn: "Al Nasr Street, New Maadi",
      cancellationPolicyAr:
        "يكون الإلغاء مجانياً حتى ست ساعات قبل الموعد. بعد ذلك، قد تطلب العيادة التواصل المباشر مع مكتب الاستقبال.",
      cancellationPolicyEn:
        "Cancellation is free until six hours before the appointment. After that, the clinic may ask you to contact reception.",
    },
    {
      id: "appointment-past-farida",
      patientId: "patient-amal",
      doctorId: "dr-farida-hassan",
      clinicId: "clinic-dokki",
      locationId: "clinic-dokki-main",
      start: timestamp(-24 * 34),
      end: timestamp(-24 * 34 + 0.5),
      status: "completed",
      price: { amount: 400, currency: "EGP" },
      source: "patient_web",
      version: 3,
      doctorNameAr: "د. فريدة حسن",
      doctorNameEn: "Dr Farida Hassan",
      specialtyAr: "أطفال",
      specialtyEn: "Paediatrics",
      clinicNameAr: "عيادات النيل",
      clinicNameEn: "Nile Clinics",
      clinicAddressAr: "شارع التحرير، الدقي",
      clinicAddressEn: "Tahrir Street, Dokki",
      cancellationPolicyAr: "المعاد انتهى.",
      cancellationPolicyEn: "This appointment has ended.",
    },
  ];
}

function patientAppointmentStore() {
  globalThis.__nabdaPatientAppointments ??= makePatientAppointments();
  return globalThis.__nabdaPatientAppointments;
}

export function resetPatientAppointments() {
  globalThis.__nabdaPatientAppointments = makePatientAppointments();
}

export function getPatientAppointments(): PatientAppointment[] {
  return structuredClone(patientAppointmentStore());
}

export function updatePatientAppointment(
  id: string,
  input: { status?: Appointment["status"]; slotStart?: string },
) {
  const appointments = patientAppointmentStore();
  const index = appointments.findIndex((appointment) => appointment.id === id);
  const appointment = appointments[index];
  if (!appointment) return undefined;
  const start = input.slotStart ?? appointment.start;
  const updated: PatientAppointment = {
    ...appointment,
    start,
    end: input.slotStart
      ? new Date(Date.parse(input.slotStart) + 30 * 60 * 1000).toISOString()
      : appointment.end,
    status: input.status ?? appointment.status,
    version: appointment.version + 1,
  };
  appointments[index] = updated;
  return structuredClone(updated);
}

const prescriptionRecords: Array<Prescription & { doctorNameAr?: string; doctorNameEn?: string }> =
  [
    {
      id: "prescription-approved-one",
      patientId: "patient-amal",
      encounterId: "encounter-completed-one",
      status: "approved",
      payload: {
        patientId: "patient-amal",
        encounterId: "encounter-completed-one",
        extractedAt: timestamp(-24 * 34 + 1),
        medications: [
          {
            rawText: "Paracetamol five hundred milligrams when needed",
            normalizedName: "Paracetamol",
            dose: 500,
            unit: "mg",
            frequency: "When needed",
            route: "Oral",
            duration: "3 days",
            notes: "Maximum three doses daily",
            confidence: 1,
          },
        ],
        modelInfo: { provider: "clinician-entry", model: "approved-record", version: "1" },
      },
      signature: "dr-farida-clinical-signature",
      approvedAt: timestamp(-24 * 34 + 1.2),
      version: 2,
      doctorNameAr: "د. فريدة حسن",
      doctorNameEn: "Dr Farida Hassan",
    },
    {
      id: "prescription-draft-hidden",
      patientId: "patient-amal",
      encounterId: "encounter-processing-hidden",
      status: "draft",
      payload: {
        patientId: "patient-amal",
        encounterId: "encounter-processing-hidden",
        extractedAt: timestamp(-2),
        medications: [],
        modelInfo: { provider: "mock-llm", model: "draft-extraction", version: "1" },
      },
      version: 1,
    },
  ];

export function approvedPatientPrescriptions(
  records: Array<Prescription & { doctorNameAr?: string; doctorNameEn?: string }>,
  patientId: string,
): ApprovedPatientPrescription[] {
  return records.filter(
    (record): record is ApprovedPatientPrescription =>
      record.patientId === patientId &&
      record.status === "approved" &&
      typeof record.signature === "string" &&
      typeof record.approvedAt === "string" &&
      typeof record.doctorNameAr === "string" &&
      typeof record.doctorNameEn === "string",
  );
}

export function getApprovedPatientPrescriptions(patientId = "patient-amal") {
  return approvedPatientPrescriptions(prescriptionRecords, patientId);
}

export function getPatientEncounterSummaries(
  patientId = "patient-amal",
): PatientEncounterSummary[] {
  const records: PatientEncounterSummary[] = [
    {
      id: "encounter-completed-one",
      patientId,
      occurredAt: timestamp(-24 * 34),
      doctorNameAr: "د. فريدة حسن",
      doctorNameEn: "Dr Farida Hassan",
      specialtyAr: "أطفال",
      specialtyEn: "Paediatrics",
      summaryAr: "تمت مراجعة الأعراض والفحص. الحالة مستقرة وخطة المتابعة واضحة.",
      summaryEn:
        "Symptoms and examination were reviewed. The condition is stable and the follow-up plan is clear.",
      followUpAr: "متابعة بعد أسبوعين لو الأعراض مستمرة.",
      followUpEn: "Follow up in two weeks if symptoms continue.",
      visibleByClinicPolicy: true,
    },
    {
      id: "encounter-policy-hidden",
      patientId,
      occurredAt: timestamp(-24 * 10),
      doctorNameAr: "د. مريم فؤاد",
      doctorNameEn: "Dr Mariam Fouad",
      specialtyAr: "قلب وأوعية",
      specialtyEn: "Cardiology",
      summaryAr: "ملخص غير متاح للمريض حسب سياسة العيادة.",
      summaryEn: "Summary unavailable to the patient under clinic policy.",
      followUpAr: "",
      followUpEn: "",
      visibleByClinicPolicy: false,
    },
  ];
  return records.filter((record) => record.patientId === patientId && record.visibleByClinicPolicy);
}

export function getPatientAppointment(id: string) {
  return getPatientAppointments().find((appointment) => appointment.id === id);
}
