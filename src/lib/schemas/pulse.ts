import { z } from "zod";
import { isoDateTimeSchema, moneySchema } from "./common";

export const pulseToolCallSchema = z
  .object({
    id: z.string().min(1),
    kind: z.enum(["book_appointment", "reschedule_appointment", "cancel_appointment"]),
    doctorId: z.string().min(1),
    doctorName: z.string().min(1),
    slotStart: isoDateTimeSchema,
    price: moneySchema,
    status: z.enum(["proposed", "confirmed", "cancelled", "committed"]),
  })
  .strict();

export const pulseMessageSchema = z
  .object({
    id: z.string().min(1),
    role: z.enum(["patient", "pulse", "human"]),
    text: z.string(),
    createdAt: isoDateTimeSchema,
    toolCall: pulseToolCallSchema.optional(),
  })
  .strict();

export const pulseSchema = z
  .object({
    id: z.string().min(1),
    status: z.enum(["active", "human", "closed"]),
    messages: z.array(pulseMessageSchema),
  })
  .strict();

export const pulseMessageAcceptedSchema = z
  .object({
    conversationId: z.string().min(1),
    accepted: z.literal(true),
    transport: z.enum(["sse", "signalr"]),
  })
  .strict();
export const pulseConfirmationSchema = z
  .object({
    conversationId: z.string().min(1),
    toolCallId: z.string().min(1),
    confirmed: z.boolean(),
    status: z.enum(["confirmed", "cancelled"]),
  })
  .strict();
export const pulseHandoffSchema = z
  .object({ assignedTo: z.string().min(1), status: z.literal("human") })
  .strict();

export type PulseConversation = z.infer<typeof pulseSchema>;
