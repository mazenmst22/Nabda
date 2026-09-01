import { z } from "zod";
import { isoDateTimeSchema } from "./common";

export const consentSchema = z
  .object({
    id: z.string().min(1),
    patientId: z.string().min(1),
    encounterId: z.string().min(1).optional(),
    purpose: z.string().min(1),
    textVersion: z.string().min(1),
    status: z.enum(["granted", "revoked"]),
    grantedAt: isoDateTimeSchema,
    revokedAt: isoDateTimeSchema.optional(),
    version: z.number().int().positive(),
  })
  .strict();

export type ConsentRecord = z.infer<typeof consentSchema>;
