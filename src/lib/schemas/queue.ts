import { z } from "zod";

export const queueStateSchema = z.enum(["waiting", "called", "in_room", "done", "skipped"]);

export const queueSchema = z
  .object({
    id: z.string().min(1),
    appointmentId: z.string().min(1),
    patientId: z.string().min(1),
    position: z.number().int().nonnegative(),
    state: queueStateSchema,
    estimatedWaitMin: z.number().int().nonnegative(),
  })
  .strict();

export const queueListSchema = z.array(queueSchema);

export type QueueEntry = z.infer<typeof queueSchema>;
