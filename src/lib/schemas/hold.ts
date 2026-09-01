import { z } from "zod";
import { isoDateTimeSchema, moneySchema } from "./common";

export const holdSchema = z
  .object({
    holdId: z.string().min(1),
    doctorId: z.string().min(1),
    slotStart: isoDateTimeSchema,
    expiresAt: isoDateTimeSchema,
    price: moneySchema,
  })
  .strict();

export const holdReleasedSchema = z.object({ released: z.literal(true) }).strict();

export type Hold = z.infer<typeof holdSchema>;
