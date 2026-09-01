import { z } from "zod";
import { isoDateSchema, isoDateTimeSchema, moneySchema, pagedSchema } from "./common";

export const appointmentStatusSchema = z.enum([
  "held",
  "booked",
  "checked_in",
  "in_progress",
  "completed",
  "cancelled",
  "no_show",
]);

export const appointmentSchema = z
  .object({
    id: z.string().min(1),
    patientId: z.string().min(1),
    doctorId: z.string().min(1),
    clinicId: z.string().min(1),
    locationId: z.string().min(1),
    start: isoDateTimeSchema,
    end: isoDateTimeSchema,
    status: appointmentStatusSchema,
    price: moneySchema,
    source: z.enum(["patient_web", "reception", "pulse"]),
    holdExpiresAt: isoDateTimeSchema.optional(),
    version: z.number().int().positive(),
  })
  .strict();

export const appointmentListSchema = pagedSchema(appointmentSchema);

export const daySlotsSchema = z
  .object({
    date: isoDateSchema,
    slots: z.array(
      z
        .object({
          start: isoDateTimeSchema,
          end: isoDateTimeSchema,
          available: z.boolean(),
        })
        .strict(),
    ),
  })
  .strict();

export const daySlotsListSchema = z.array(daySlotsSchema);

export type Appointment = z.infer<typeof appointmentSchema>;
export type AppointmentList = z.infer<typeof appointmentListSchema>;
export type DaySlots = z.infer<typeof daySlotsSchema>;
