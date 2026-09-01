import { z } from "zod";

export const isoDateTimeSchema = z.string().datetime({ offset: true });
export const isoDateSchema = z.iso.date();
export const moneySchema = z
  .object({
    amount: z.number().nonnegative(),
    currency: z.literal("EGP"),
  })
  .strict();

export type Money = z.infer<typeof moneySchema>;

export function pagedSchema<T extends z.ZodType>(item: T) {
  return z
    .object({
      items: z.array(item),
      page: z.number().int().positive(),
      pageSize: z.number().int().positive(),
      total: z.number().int().nonnegative(),
    })
    .strict();
}
