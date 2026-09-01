import type {
  Appointment,
  ConsentRecord,
  Encounter,
  Patient,
  PatientTimelineItem,
  Prescription,
} from "@/lib/schemas";

export const doctorPatient: Patient = {
  id: "patient-amal",
  clinicId: "clinic-maadi",
  fullName: "أمل محمود عبد الرحمن",
  phone: "+201001234567",
  email: "amal@example.com",
  dateOfBirth: "1989-04-17",
  gender: "female",
  preferredLanguage: "ar",
  numeralPreference: "western",
  createdAt: "2026-07-01T08:00:00Z",
  version: 3,
};

export const doctorAppointments: Appointment[] = [
  {
    id: "appointment-doctor-amal",
    patientId: doctorPatient.id,
    doctorId: "dr-mariam-fouad",
    clinicId: "clinic-maadi",
    locationId: "clinic-maadi-main",
    start: "2026-08-29T06:30:00Z",
    end: "2026-08-29T07:00:00Z",
    status: "checked_in",
    price: { amount: 450, currency: "EGP" },
    source: "patient_web",
    version: 2,
  },
  {
    id: "appointment-doctor-nour",
    patientId: "patient-nour",
    doctorId: "dr-mariam-fouad",
    clinicId: "clinic-maadi",
    locationId: "clinic-maadi-main",
    start: "2026-08-29T07:30:00Z",
    end: "2026-08-29T08:00:00Z",
    status: "booked",
    price: { amount: 450, currency: "EGP" },
    source: "reception",
    version: 1,
  },
  {
    id: "appointment-doctor-hassan",
    patientId: "patient-hassan",
    doctorId: "dr-mariam-fouad",
    clinicId: "clinic-maadi",
    locationId: "clinic-maadi-main",
    start: "2026-08-30T09:00:00Z",
    end: "2026-08-30T09:30:00Z",
    status: "booked",
    price: { amount: 450, currency: "EGP" },
    source: "reception",
    version: 1,
  },
];

export const doctorPatientNames: Record<string, string> = {
  "patient-amal": doctorPatient.fullName,
  "patient-nour": "نور محمود",
  "patient-hassan": "حسن إبراهيم",
};

export const doctorTimeline: PatientTimelineItem[] = [
  {
    id: "timeline-visit",
    type: "encounter",
    entityId: "encounter-previous",
    occurredAt: "2026-07-19T08:15:00Z",
    titleAr: "متابعة ضغط الدم",
    titleEn: "Blood-pressure follow-up",
    status: "completed",
  },
  {
    id: "timeline-prescription",
    type: "prescription",
    entityId: "prescription-approved",
    occurredAt: "2026-07-19T08:42:00Z",
    titleAr: "وصفة معتمدة",
    titleEn: "Approved prescription",
    status: "approved",
  },
  {
    id: "timeline-appointment",
    type: "appointment",
    entityId: "appointment-doctor-amal",
    occurredAt: "2026-08-29T06:30:00Z",
    titleAr: "موعد قلب",
    titleEn: "Cardiology appointment",
    status: "checked_in",
  },
];

export const doctorEncounters: Encounter[] = [
  {
    id: "encounter-previous",
    patientId: doctorPatient.id,
    appointmentId: "appointment-previous",
    doctorId: "dr-mariam-fouad",
    clinicId: "clinic-maadi",
    status: "completed",
    startedAt: "2026-07-19T08:15:00Z",
    endedAt: "2026-07-19T08:45:00Z",
    version: 3,
  },
];

export const doctorPrescriptions: Prescription[] = [
  {
    id: "prescription-approved",
    patientId: doctorPatient.id,
    encounterId: "encounter-previous",
    status: "approved",
    payload: {
      patientId: doctorPatient.id,
      encounterId: "encounter-previous",
      extractedAt: "2026-07-19T08:38:00Z",
      medications: [
        {
          rawText: "كونكور خمسة مليجرام مرة يوميًا",
          normalizedName: "Bisoprolol",
          dose: 5,
          unit: "mg",
          frequency: "Once daily",
          route: "Oral",
          duration: "30 days",
          notes: "After breakfast",
          confidence: 1,
        },
      ],
      modelInfo: { provider: "clinician-entry", model: "approved-record", version: "1" },
    },
    signature: "dr-mariam-signature",
    approvedAt: "2026-07-19T08:42:00Z",
    version: 2,
  },
];

export const AUDIO_CONSENT_TEXT_VERSION = "encounter-audio-v3";

export const consentCopy = {
  ar: "أوافق على تسجيل صوت جلسة الكشف بغرض إعداد مسودة للملاحظات السريرية فقط. سيُرفع التسجيل إلى مساحة التخزين المعتمدة، ولا تُعد المسودة سجلاً سريرياً حتى يراجعها الطبيب. يمكن سحب الموافقة في أي وقت، وعندها يتوقف التسجيل فوراً.",
  en: "I consent to audio recording of this encounter solely to prepare a draft clinical note. The recording will be uploaded to approved storage, and the draft is not a clinical record until reviewed by the clinician. Consent may be withdrawn at any time, which stops recording immediately.",
};

export function makeConsent(encounterId: string): ConsentRecord {
  return {
    id: `consent-${crypto.randomUUID()}`,
    patientId: doctorPatient.id,
    encounterId,
    purpose: "encounter_audio",
    textVersion: AUDIO_CONSENT_TEXT_VERSION,
    status: "granted",
    grantedAt: new Date().toISOString(),
    version: 1,
  };
}
