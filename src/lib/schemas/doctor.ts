import { z } from "zod";
import { isoDateTimeSchema, moneySchema, pagedSchema } from "./common";

export const specialtySchema = z
  .object({
    key: z.string().min(1),
    nameAr: z.string().min(1),
    nameEn: z.string().min(1),
  })
  .strict();

export const doctorSchema = z
  .object({
    id: z.string().min(1),
    slug: z.string().min(1),
    nameAr: z.string().min(1),
    nameEn: z.string().min(1),
    title: z.string().min(1),
    specialties: z.array(z.string().min(1)),
    subSpecialties: z.array(z.string().min(1)),
    gender: z.enum(["female", "male"]),
    clinicId: z.string().min(1),
    photoUrl: z.url().optional(),
    rating: z
      .object({ average: z.number().min(0).max(5), count: z.number().int().nonnegative() })
      .strict(),
    fee: moneySchema,
    nextAvailable: isoDateTimeSchema.optional(),
    acceptsOnlinePayment: z.boolean(),
    bio: z.string(),
  })
  .strict();

export const doctorListSchema = pagedSchema(doctorSchema);
export const specialtyListSchema = z.array(specialtySchema);

export type Doctor = z.infer<typeof doctorSchema>;
export type Specialty = z.infer<typeof specialtySchema>;
