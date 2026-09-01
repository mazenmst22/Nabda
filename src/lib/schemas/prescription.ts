import { z } from "zod";
import { isoDateTimeSchema } from "./common";

export const prescriptionExtractionSchema = z
  .object({
    patientId: z.string(),
    encounterId: z.string(),
    extractedAt: isoDateTimeSchema,
    medications: z.array(
      z
        .object({
          rawText: z.string(),
          normalizedName: z.string(),
          dose: z.number(),
          unit: z.string(),
          frequency: z.string(),
          route: z.string(),
          duration: z.string(),
          notes: z.string(),
          confidence: z.number(),
        })
        .strict(),
    ),
    modelInfo: z
      .object({
        provider: z.string(),
        model: z.string(),
        version: z.string(),
      })
      .strict(),
  })
  .strict();

export const medicationReviewFieldSchema = z.enum([
  "rawText",
  "normalizedName",
  "dose",
  "unit",
  "frequency",
  "route",
  "duration",
  "notes",
]);

export const medicationFieldReviewSchema = z
  .object({
    medicationIndex: z.number().int().nonnegative(),
    field: medicationReviewFieldSchema,
    confidence: z.number().min(0).max(1),
    acknowledged: z.boolean(),
    acknowledgedBy: z.string().min(1).optional(),
    acknowledgedAt: isoDateTimeSchema.optional(),
    edited: z.boolean(),
    editedBy: z.string().min(1).optional(),
    editedAt: isoDateTimeSchema.optional(),
    originalValue: z.union([z.string(), z.number()]),
  })
  .strict();

export const prescriptionReviewSchema = z
  .object({
    fields: z.array(medicationFieldReviewSchema),
    approvedBy: z.string().min(1).optional(),
  })
  .strict();

export const prescriptionSchema = z
  .object({
    id: z.string().min(1),
    patientId: z.string().min(1),
    encounterId: z.string().min(1),
    status: z.enum(["draft", "approved", "voided"]),
    payload: prescriptionExtractionSchema,
    signature: z.string().min(1).optional(),
    approvedAt: isoDateTimeSchema.optional(),
    review: prescriptionReviewSchema.optional(),
    version: z.number().int().positive(),
  })
  .strict();

export const prescriptionListSchema = z.array(prescriptionSchema);

export type PrescriptionExtraction = z.infer<typeof prescriptionExtractionSchema>;
export type Prescription = z.infer<typeof prescriptionSchema>;
export type MedicationReviewField = z.infer<typeof medicationReviewFieldSchema>;
export type MedicationFieldReview = z.infer<typeof medicationFieldReviewSchema>;
