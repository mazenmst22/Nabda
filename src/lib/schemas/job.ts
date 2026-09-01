import { z } from "zod";

export const jobSchema = z
  .object({
    jobId: z.string().min(1),
    kind: z.enum(["transcription", "extraction"]),
    state: z.enum([
      "queued",
      "running",
      "succeeded",
      "failed_retryable",
      "failed_terminal",
      "cancelled",
    ]),
    progress: z.number().min(0).max(100),
    error: z.string().optional(),
    attempts: z.number().int().nonnegative(),
  })
  .strict();

export type Job = z.infer<typeof jobSchema>;
