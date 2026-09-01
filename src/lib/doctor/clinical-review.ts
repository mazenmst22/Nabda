import type {
  MedicationFieldReview,
  MedicationReviewField,
  Prescription,
  PrescriptionExtraction,
  Transcript,
} from "@/lib/schemas";

export const REVIEW_ENCOUNTER_ID = "encounter-review-amal";
export const REVIEW_PRESCRIPTION_ID = "prescription-review-amal";
export const CLINICIAN_ACTOR_ID = "usr-mariam";
export const CLINICIAN_ACTOR_NAME = "Dr Mariam Fouad";
export const REVIEW_CONFIDENCE_THRESHOLD = 0.85;

export const medicationReviewFields: MedicationReviewField[] = [
  "rawText",
  "normalizedName",
  "dose",
  "unit",
  "frequency",
  "route",
  "duration",
  "notes",
];

export const initialTranscriptHistory: Transcript[] = [
  {
    encounterId: REVIEW_ENCOUNTER_ID,
    version: 1,
    language: "mixed",
    status: "draft",
    segments: [
      {
        speaker: "patient",
        start: 0,
        end: 5.8,
        text: "الضغط كان 150/95 امبارح، والصداع بدأ الساعة 8:30.",
        confidence: 0.78,
        edited: false,
      },
      {
        speaker: "doctor",
        start: 5.9,
        end: 11.4,
        text: "حضرتك بتاخدي Concor 5 mg مرة يوميًا؟",
        confidence: 0.91,
        edited: false,
      },
      {
        speaker: "patient",
        start: 11.5,
        end: 16.1,
        text: "Yes, بس نسيت الجرعة يومين الأسبوع ده.",
        confidence: 0.87,
        edited: false,
      },
    ],
  },
  {
    encounterId: REVIEW_ENCOUNTER_ID,
    version: 2,
    language: "mixed",
    status: "draft",
    segments: [
      {
        speaker: "patient",
        start: 0,
        end: 5.8,
        text: "الضغط كان 150/95 امبارح، والصداع بدأ الساعة 8:30 مساءً.",
        confidence: 0.78,
        edited: true,
      },
      {
        speaker: "doctor",
        start: 5.9,
        end: 11.4,
        text: "حضرتك بتاخدي Concor 5 mg مرة يوميًا؟",
        confidence: 0.91,
        edited: false,
      },
      {
        speaker: "patient",
        start: 11.5,
        end: 16.1,
        text: "Yes, بس نسيت الجرعة يومين الأسبوع ده.",
        confidence: 0.87,
        edited: false,
      },
    ],
  },
];

const initialExtraction: PrescriptionExtraction = {
  patientId: "patient-amal",
  encounterId: REVIEW_ENCOUNTER_ID,
  extractedAt: "2026-08-30T08:22:00Z",
  medications: [
    {
      rawText: "كونكور خمسة مليجرام مرة يوميًا بعد الفطار لمدة 30 يوم",
      normalizedName: "Bisoprolol",
      dose: 5,
      unit: "mg",
      frequency: "Once daily",
      route: "Oral",
      duration: "30 days",
      notes: "After breakfast",
      confidence: 0.81,
    },
    {
      rawText: "بانادول خمسمية عند اللزوم بحد أقصى 3 مرات يوميًا",
      normalizedName: "Paracetamol",
      dose: 500,
      unit: "mg",
      frequency: "As needed",
      route: "Oral",
      duration: "5 days",
      notes: "Maximum three doses daily",
      confidence: 0.92,
    },
  ],
  modelInfo: { provider: "mock-llm", model: "nabda-extractor", version: "1.0" },
};

const fieldConfidences: Array<Record<MedicationReviewField, number>> = [
  {
    rawText: 0.96,
    normalizedName: 0.94,
    dose: 0.79,
    unit: 0.97,
    frequency: 0.9,
    route: 0.88,
    duration: 0.73,
    notes: 0.86,
  },
  {
    rawText: 0.97,
    normalizedName: 0.96,
    dose: 0.95,
    unit: 0.98,
    frequency: 0.9,
    route: 0.91,
    duration: 0.89,
    notes: 0.88,
  },
];

export function medicationFieldValue(
  medication: PrescriptionExtraction["medications"][number],
  field: MedicationReviewField,
) {
  return medication[field];
}

function initialFieldReviews(): MedicationFieldReview[] {
  return initialExtraction.medications.flatMap((medication, medicationIndex) =>
    medicationReviewFields.map((field) => ({
      medicationIndex,
      field,
      confidence: fieldConfidences[medicationIndex]?.[field] ?? medication.confidence,
      acknowledged: false,
      edited: false,
      originalValue: medicationFieldValue(medication, field),
    })),
  );
}

export const initialReviewPrescription: Prescription = {
  id: REVIEW_PRESCRIPTION_ID,
  patientId: initialExtraction.patientId,
  encounterId: initialExtraction.encounterId,
  status: "draft",
  payload: initialExtraction,
  review: { fields: initialFieldReviews() },
  version: 1,
};

export function reviewFieldId(medicationIndex: number, field: MedicationReviewField) {
  return `${medicationIndex}:${field}`;
}

export function unresolvedLowConfidenceFields(prescription: Prescription) {
  return (prescription.review?.fields ?? []).filter(
    (field) => field.confidence < REVIEW_CONFIDENCE_THRESHOLD && !field.acknowledged,
  );
}

export function canApprovePrescription(prescription: Prescription) {
  return (
    prescription.status === "draft" && unresolvedLowConfidenceFields(prescription).length === 0
  );
}

export function createTranscriptVersion(
  current: Transcript,
  segments: Transcript["segments"],
): Transcript {
  return {
    ...current,
    version: current.version + 1,
    status: "draft",
    segments: segments.map((segment, index) => ({
      ...segment,
      edited: segment.text !== current.segments[index]?.text || segment.edited,
    })),
  };
}

export function createReviewedDraft(
  current: Prescription,
  payload: PrescriptionExtraction,
  acknowledgedIds: Set<string>,
  occurredAt: string,
): Prescription {
  const currentReviews = current.review?.fields ?? [];
  const fields = currentReviews.map((field) => {
    const value = medicationFieldValue(payload.medications[field.medicationIndex]!, field.field);
    const edited = value !== field.originalValue;
    const acknowledged = acknowledgedIds.has(reviewFieldId(field.medicationIndex, field.field));
    return {
      ...field,
      acknowledged,
      ...(acknowledged
        ? { acknowledgedBy: CLINICIAN_ACTOR_NAME, acknowledgedAt: occurredAt }
        : { acknowledgedBy: undefined, acknowledgedAt: undefined }),
      edited,
      ...(edited
        ? { editedBy: CLINICIAN_ACTOR_NAME, editedAt: occurredAt }
        : { editedBy: undefined, editedAt: undefined }),
    };
  });
  return {
    ...current,
    status: "draft",
    payload,
    review: { fields },
    version: current.version + 1,
  };
}

export function approvePrescription(current: Prescription, occurredAt: string): Prescription {
  if (!canApprovePrescription(current)) {
    throw new Error("LOW_CONFIDENCE_ACKNOWLEDGEMENT_REQUIRED");
  }
  return {
    ...current,
    status: "approved",
    signature: `${CLINICIAN_ACTOR_ID}:clinical-approval`,
    approvedAt: occurredAt,
    review: { fields: current.review?.fields ?? [], approvedBy: CLINICIAN_ACTOR_NAME },
    version: current.version + 1,
  };
}

export type ReviewDiff = { label: string; before: string; after: string };

export function transcriptDiff(before: Transcript, after: Transcript): ReviewDiff[] {
  return after.segments.flatMap((segment, index) => {
    const previous = before.segments[index];
    if (previous?.text === segment.text) return [];
    return [
      {
        label: `segment-${index + 1}`,
        before: previous?.text ?? "",
        after: segment.text,
      },
    ];
  });
}

export function prescriptionDiff(before: Prescription, after: Prescription): ReviewDiff[] {
  return after.payload.medications.flatMap((medication, medicationIndex) =>
    medicationReviewFields.flatMap((field) => {
      const oldValue = before.payload.medications[medicationIndex]
        ? medicationFieldValue(before.payload.medications[medicationIndex]!, field)
        : "";
      const newValue = medicationFieldValue(medication, field);
      if (oldValue === newValue) return [];
      return [
        {
          label: `${medicationIndex + 1}:${field}`,
          before: String(oldValue),
          after: String(newValue),
        },
      ];
    }),
  );
}
