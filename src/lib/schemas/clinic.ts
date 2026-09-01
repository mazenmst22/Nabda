import { z } from "zod";
import { pagedSchema } from "./common";

export const clinicHourSchema = z
  .object({
    day: z.enum(["saturday", "sunday", "monday", "tuesday", "wednesday", "thursday", "friday"]),
    periods: z.array(
      z
        .object({
          open: z.string().regex(/^\d{2}:\d{2}$/u),
          close: z.string().regex(/^\d{2}:\d{2}$/u),
        })
        .strict(),
    ),
  })
  .strict();

export const clinicSchema = z
  .object({
    id: z.string().min(1),
    slug: z.string().min(1),
    nameAr: z.string().min(1),
    nameEn: z.string().min(1),
    city: z.string().min(1),
    district: z.string().min(1),
    address: z.string().min(1),
    phone: z.string().min(1),
    hours: z.array(clinicHourSchema).length(7),
    logoUrl: z.url().optional(),
    theme: z.object({ accent: z.string().optional() }).strict().optional(),
  })
  .strict();

export const clinicListSchema = pagedSchema(clinicSchema);

export type Clinic = z.infer<typeof clinicSchema>;
