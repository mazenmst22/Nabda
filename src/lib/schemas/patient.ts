import { z } from "zod";
import { isoDateSchema, isoDateTimeSchema, pagedSchema } from "./common";

export const patientSchema = z
  .object({
    id: z.string().min(1),
    clinicId: z.string().min(1),
    fullName: z.string().min(1),
    phone: z.string().min(1),
    email: z.email().optional(),
    dateOfBirth: isoDateSchema.optional(),
    gender: z.enum(["female", "male", "unspecified"]),
    preferredLanguage: z.enum(["ar", "en"]),
    numeralPreference: z.enum(["western", "eastern"]),
    createdAt: isoDateTimeSchema,
    version: z.number().int().positive(),
  })
  .strict();

export const patientListSchema = pagedSchema(patientSchema);
export const patientTimelineItemSchema = z
  .object({
    id: z.string().min(1),
    type: z.enum(["appointment", "encounter", "prescription"]),
    entityId: z.string().min(1),
    occurredAt: isoDateTimeSchema,
    titleAr: z.string().min(1),
    titleEn: z.string().min(1),
    status: z.string().min(1),
  })
  .strict();
export const patientTimelineSchema = z.array(patientTimelineItemSchema);

export type Patient = z.infer<typeof patientSchema>;
export type PatientTimelineItem = z.infer<typeof patientTimelineItemSchema>;
