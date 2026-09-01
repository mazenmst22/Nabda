import { z } from "zod";
import { isoDateTimeSchema } from "./common";

export const encounterSchema = z
  .object({
    id: z.string().min(1),
    patientId: z.string().min(1),
    appointmentId: z.string().min(1).optional(),
    doctorId: z.string().min(1),
    clinicId: z.string().min(1),
    status: z.enum(["created", "recording", "processing", "review", "completed"]),
    startedAt: isoDateTimeSchema,
    endedAt: isoDateTimeSchema.optional(),
    version: z.number().int().positive(),
  })
  .strict();

export const audioUploadSchema = z
  .object({ uploadUrl: z.url(), audioKey: z.string().min(1) })
  .strict();

export type Encounter = z.infer<typeof encounterSchema>;
