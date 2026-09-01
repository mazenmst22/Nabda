import type {
  AdminAudit,
  AdminFlag,
  AdminHealth,
  AdminPrompt,
  AdminProvider,
  AdminSettings,
  Appointment,
  Clinic,
  ConsentRecord,
  DaySlots,
  Doctor,
  Encounter,
  Hold,
  Job,
  Patient,
  PatientTimelineItem,
  Prescription,
  PrescriptionExtraction,
  PulseConversation,
  QueueEntry,
  Specialty,
  Transcript,
} from "@/lib/schemas";

const weeklyHours: Clinic["hours"] = [
  { day: "saturday", periods: [{ open: "09:00", close: "21:00" }] },
  { day: "sunday", periods: [{ open: "09:00", close: "21:00" }] },
  { day: "monday", periods: [{ open: "09:00", close: "21:00" }] },
  { day: "tuesday", periods: [{ open: "09:00", close: "21:00" }] },
  { day: "wednesday", periods: [{ open: "09:00", close: "21:00" }] },
  { day: "thursday", periods: [{ open: "09:00", close: "18:00" }] },
  { day: "friday", periods: [] },
];

const clinicRows: Array<[string, string, string, string, string, string, string, string]> = [
  [
    "clinic-maadi",
    "andalusia-maadi",
    "عيادات أندلسية",
    "Andalusia Clinics",
    "Cairo",
    "المعادي",
    "شارع النصر، المعادي الجديدة",
    "+20225200001",
  ],
  [
    "clinic-heliopolis",
    "meridian-heliopolis",
    "عيادات ميريديان",
    "Meridian Clinics",
    "Cairo",
    "مصر الجديدة",
    "شارع بيروت، مصر الجديدة",
    "+20224100002",
  ],
  [
    "clinic-dokki",
    "nile-dokki",
    "عيادات النيل",
    "Nile Clinics",
    "Giza",
    "الدقي",
    "شارع التحرير، الدقي",
    "+20233300003",
  ],
  [
    "clinic-mohandessin",
    "safwa-mohandessin",
    "عيادات الصفوة",
    "Al Safwa Clinics",
    "Giza",
    "المهندسين",
    "شارع شهاب، المهندسين",
    "+20233400004",
  ],
  [
    "clinic-nasr-city",
    "cairo-medical",
    "مركز كايرو الطبي",
    "Cairo Medical Centre",
    "Cairo",
    "مدينة نصر",
    "شارع عباس العقاد، مدينة نصر",
    "+20222700005",
  ],
  [
    "clinic-sheikh-zayed",
    "zayed-specialty",
    "عيادات زايد التخصصية",
    "Zayed Specialty Clinics",
    "Giza",
    "الشيخ زايد",
    "المحور المركزي، الشيخ زايد",
    "+20238500006",
  ],
];

export const clinicFixtures: Clinic[] = clinicRows.map(
  ([id, slug, nameAr, nameEn, city, district, address, phone]) => ({
    id,
    slug,
    nameAr,
    nameEn,
    city,
    district,
    address,
    phone,
    hours: weeklyHours,
  }),
);

export const specialtyFixtures: Specialty[] = [
  { key: "cardiology", nameAr: "قلب وأوعية", nameEn: "Cardiology" },
  { key: "paediatrics", nameAr: "أطفال", nameEn: "Paediatrics" },
  { key: "dermatology", nameAr: "جلدية", nameEn: "Dermatology" },
  { key: "orthopaedics", nameAr: "عظام", nameEn: "Orthopaedics" },
  { key: "dentistry", nameAr: "أسنان", nameEn: "Dentistry" },
  { key: "ent", nameAr: "أنف وأذن", nameEn: "ENT" },
  { key: "ophthalmology", nameAr: "عيون", nameEn: "Ophthalmology" },
  { key: "internal", nameAr: "باطنة", nameEn: "Internal medicine" },
];

type DoctorRow = [
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  "female" | "male",
  number,
  number,
  number,
  boolean,
  string,
];

const doctorRows: DoctorRow[] = [
  [
    "dr-mariam-fouad",
    "mariam-fouad",
    "د. مريم فؤاد",
    "Dr Mariam Fouad",
    "استشاري",
    "cardiology",
    "clinic-maadi",
    "female",
    450,
    4.9,
    128,
    true,
    "2026-08-29T09:30:00Z",
  ],
  [
    "dr-omar-el-shazly",
    "omar-el-shazly",
    "د. عمر الشاذلي",
    "Dr Omar El Shazly",
    "استشاري",
    "internal",
    "clinic-heliopolis",
    "male",
    520,
    4.8,
    94,
    false,
    "2026-08-29T11:00:00Z",
  ],
  [
    "dr-farida-hassan",
    "farida-hassan",
    "د. فريدة حسن",
    "Dr Farida Hassan",
    "استشاري",
    "paediatrics",
    "clinic-dokki",
    "female",
    400,
    4.9,
    211,
    true,
    "2026-08-29T13:15:00Z",
  ],
  [
    "dr-youssef-adly",
    "youssef-adly",
    "د. يوسف عدلي",
    "Dr Youssef Adly",
    "مدرس",
    "ent",
    "clinic-mohandessin",
    "male",
    350,
    4.6,
    58,
    false,
    "2026-08-30T16:45:00Z",
  ],
  [
    "dr-karim-mansour",
    "karim-mansour",
    "د. كريم منصور",
    "Dr Karim Mansour",
    "أستاذ",
    "orthopaedics",
    "clinic-nasr-city",
    "male",
    650,
    4.7,
    76,
    false,
    "2026-08-30T10:30:00Z",
  ],
  [
    "dr-salma-nassar",
    "salma-nassar",
    "د. سلمى نصار",
    "Dr Salma Nassar",
    "استشاري",
    "dermatology",
    "clinic-sheikh-zayed",
    "female",
    700,
    4.8,
    163,
    true,
    "2026-08-30T13:00:00Z",
  ],
  [
    "dr-laila-hamdy",
    "laila-hamdy",
    "د. ليلى حمدي",
    "Dr Laila Hamdy",
    "استشاري",
    "ophthalmology",
    "clinic-maadi",
    "female",
    900,
    4.9,
    241,
    true,
    "2026-08-31T08:30:00Z",
  ],
  [
    "dr-ahmed-tarek",
    "ahmed-tarek",
    "د. أحمد طارق",
    "Dr Ahmed Tarek",
    "أخصائي",
    "dentistry",
    "clinic-dokki",
    "male",
    250,
    4.5,
    47,
    false,
    "2026-08-31T12:00:00Z",
  ],
];

export const doctorFixtures: Doctor[] = doctorRows.map(
  ([
    id,
    slug,
    nameAr,
    nameEn,
    title,
    specialty,
    clinicId,
    gender,
    amount,
    average,
    count,
    acceptsOnlinePayment,
    nextAvailable,
  ]) => ({
    id,
    slug,
    nameAr,
    nameEn,
    title,
    specialties: [specialty],
    subSpecialties: [],
    gender,
    clinicId,
    rating: { average, count },
    fee: { amount, currency: "EGP" },
    nextAvailable,
    acceptsOnlinePayment,
    bio: `${nameEn} provides evidence-based care with clear follow-up plans.`,
  }),
);

export const availabilityFixtures: DaySlots[] = [
  {
    date: "2026-08-29",
    slots: [
      { start: "2026-08-29T09:30:00Z", end: "2026-08-29T10:00:00Z", available: true },
      { start: "2026-08-29T10:00:00Z", end: "2026-08-29T10:30:00Z", available: false },
      { start: "2026-08-29T10:30:00Z", end: "2026-08-29T11:00:00Z", available: true },
    ],
  },
  {
    date: "2026-08-30",
    slots: [
      { start: "2026-08-30T09:30:00Z", end: "2026-08-30T10:00:00Z", available: false },
      { start: "2026-08-30T10:00:00Z", end: "2026-08-30T10:30:00Z", available: true },
    ],
  },
];

export const patientFixture: Patient = {
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

export const holdFixture: Hold = {
  holdId: "hold-active",
  doctorId: "dr-mariam-fouad",
  slotStart: "2026-08-29T09:30:00Z",
  expiresAt: "2026-08-29T09:35:00Z",
  price: { amount: 450, currency: "EGP" },
};

export const appointmentFixture: Appointment = {
  id: "appointment-one",
  patientId: patientFixture.id,
  doctorId: "dr-mariam-fouad",
  clinicId: "clinic-maadi",
  locationId: "location-maadi-main",
  start: "2026-08-29T09:30:00Z",
  end: "2026-08-29T10:00:00Z",
  status: "booked",
  price: { amount: 450, currency: "EGP" },
  source: "patient_web",
  version: 2,
};

export const queueFixture: QueueEntry = {
  id: "queue-one",
  appointmentId: appointmentFixture.id,
  patientId: patientFixture.id,
  position: 1,
  state: "waiting",
  estimatedWaitMin: 12,
};

export const consentFixture: ConsentRecord = {
  id: "consent-one",
  patientId: patientFixture.id,
  encounterId: "encounter-one",
  purpose: "encounter_audio",
  textVersion: "audio-consent-v2",
  status: "granted",
  grantedAt: "2026-08-29T09:40:00Z",
  version: 1,
};

export const encounterFixture: Encounter = {
  id: "encounter-one",
  patientId: patientFixture.id,
  appointmentId: appointmentFixture.id,
  doctorId: appointmentFixture.doctorId,
  clinicId: appointmentFixture.clinicId,
  status: "review",
  startedAt: "2026-08-29T09:35:00Z",
  version: 2,
};

export const jobFixture: Job = {
  jobId: "job-transcription-one",
  kind: "transcription",
  state: "succeeded",
  progress: 100,
  attempts: 1,
};

export const transcriptFixture: Transcript = {
  encounterId: encounterFixture.id,
  version: 2,
  language: "ar",
  status: "draft",
  segments: [
    {
      speaker: "patient",
      start: 0,
      end: 4.2,
      text: "عندي صداع من امبارح.",
      confidence: 0.96,
      edited: false,
    },
    {
      speaker: "doctor",
      start: 4.3,
      end: 8.8,
      text: "هنراجع الضغط والأعراض الأول.",
      confidence: 0.94,
      edited: false,
    },
  ],
};

export const prescriptionExtractionFixture: PrescriptionExtraction = {
  patientId: patientFixture.id,
  encounterId: encounterFixture.id,
  extractedAt: "2026-08-29T10:05:00Z",
  medications: [
    {
      rawText: "بانادول ٥٠٠ عند اللزوم",
      normalizedName: "Paracetamol",
      dose: 500,
      unit: "mg",
      frequency: "as needed",
      route: "oral",
      duration: "3 days",
      notes: "Maximum three doses daily",
      confidence: 0.82,
    },
  ],
  modelInfo: { provider: "mock-llm", model: "nabda-extractor", version: "1.0" },
};

export const prescriptionFixture: Prescription = {
  id: "prescription-one",
  patientId: patientFixture.id,
  encounterId: encounterFixture.id,
  status: "draft",
  payload: prescriptionExtractionFixture,
  version: 1,
};

export const timelineFixtures: PatientTimelineItem[] = [
  {
    id: "timeline-appointment",
    type: "appointment",
    entityId: appointmentFixture.id,
    occurredAt: appointmentFixture.start,
    titleAr: "موعد قلب",
    titleEn: "Cardiology appointment",
    status: "booked",
  },
  {
    id: "timeline-encounter",
    type: "encounter",
    entityId: encounterFixture.id,
    occurredAt: encounterFixture.startedAt,
    titleAr: "كشف بالعيادة",
    titleEn: "Clinic encounter",
    status: "review",
  },
  {
    id: "timeline-prescription",
    type: "prescription",
    entityId: prescriptionFixture.id,
    occurredAt: prescriptionExtractionFixture.extractedAt,
    titleAr: "روشتة تحت المراجعة",
    titleEn: "Prescription under review",
    status: "draft",
  },
];

export const pulseFixture: PulseConversation = {
  id: "pulse-conversation-one",
  status: "active",
  messages: [],
};

export const adminSettingsFixture: AdminSettings = {
  clinicId: "clinic-maadi",
  locale: "ar",
  timezone: "Africa/Cairo",
  retentionDays: 30,
  version: 4,
};
export const adminProviderFixtures: AdminProvider[] = [
  {
    id: "provider-stt",
    kind: "stt",
    provider: "mock-stt",
    model: "arabic-medical",
    region: "egypt",
    timeoutMs: 30000,
    confidenceThreshold: 0.85,
    retentionDays: 0,
    enabled: true,
    version: 2,
  },
  {
    id: "provider-llm",
    kind: "llm",
    provider: "mock-llm",
    model: "nabda-extractor",
    region: "egypt",
    timeoutMs: 45000,
    confidenceThreshold: 0.85,
    retentionDays: 0,
    enabled: true,
    version: 3,
  },
];
export const adminFlagFixtures: AdminFlag[] = [
  { key: "pulse-booking", enabled: true, version: 2 },
  { key: "audio-capture", enabled: true, version: 1 },
];
export const adminPromptFixtures: AdminPrompt[] = [
  {
    id: "prompt-one",
    key: "prescription-extraction",
    version: 3,
    template: "Extract only clinician-stated medications.",
    createdAt: "2026-08-20T08:00:00Z",
    createdBy: "developer-nadia",
  },
];
export const adminAuditFixtures: AdminAudit[] = [
  {
    id: "audit-one",
    actor: "reception-salma",
    action: "appointment.updated",
    entity: "appointment",
    entityId: appointmentFixture.id,
    occurredAt: "2026-08-29T08:55:00Z",
    correlationId: "9bf7282e-1a0c-4a78-b990-9cf0f36af77b",
    reversible: true,
  },
];
export const adminHealthFixture: AdminHealth = {
  api: "healthy",
  db: "healthy",
  queue: "healthy",
  storage: "healthy",
  providers: [
    { id: "provider-stt", status: "healthy" },
    { id: "provider-llm", status: "degraded" },
  ],
  metrics: {
    queueDepth: 18,
    jobLatencyMs: { p50: 1280, p95: 6400 },
    failureRate: 0.027,
    sampledAt: "2026-08-30T10:00:00Z",
  },
};
