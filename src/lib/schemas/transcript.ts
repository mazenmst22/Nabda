import { z } from "zod";

export const transcriptSegmentSchema = z
  .object({
    speaker: z.enum(["doctor", "patient", "unknown"]),
    start: z.number().nonnegative(),
    end: z.number().nonnegative(),
    text: z.string(),
    confidence: z.number().min(0).max(1),
    edited: z.boolean(),
  })
  .strict();

export const transcriptSchema = z
  .object({
    encounterId: z.string().min(1),
    version: z.number().int().positive(),
    language: z.enum(["ar", "en", "mixed"]),
    status: z.enum(["processing", "draft", "reviewed", "locked"]),
    segments: z.array(transcriptSegmentSchema),
  })
  .strict();

export type Transcript = z.infer<typeof transcriptSchema>;
