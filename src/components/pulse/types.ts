import type { Appointment, Hold } from "@/lib/schemas";

export type PulseToolStatus = "pending" | "committing" | "cancelled" | "committed" | "failed";

export type PulseBookingProposal = {
  id: string;
  doctorId: string;
  doctorName: string;
  clinicId: string;
  clinicName: string;
  slotStart: string;
  price: { amount: number; currency: "EGP" };
  hold: Hold;
  status: PulseToolStatus;
  appointment?: Appointment;
};

export type PulseChatMessage = {
  id: string;
  role: "patient" | "pulse" | "human";
  text: string;
  createdAt: string;
  streaming?: boolean;
  proposal?: PulseBookingProposal;
};
