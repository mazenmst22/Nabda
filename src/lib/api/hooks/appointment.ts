"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { appointmentListSchema, appointmentSchema } from "@/lib/schemas";
import type { Appointment } from "@/lib/schemas";
import { createApiAction } from "../client";
import { useApiClient } from "../provider";
import { staleTime, withQuery } from "../query";

export function useAppointments(
  params: {
    patientId?: string;
    doctorId?: string;
    from?: string;
    to?: string;
    status?: Appointment["status"];
  } = {},
) {
  const api = useApiClient();
  return useQuery({
    queryKey: ["appointments", params],
    queryFn: ({ signal }) =>
      api.get(withQuery("/v1/appointments", params), appointmentListSchema, {
        signal,
        degrade: () => ({ items: [], page: 1, pageSize: 0, total: 0 }),
      }),
    staleTime: staleTime.operational,
  });
}

export function useAppointment(id: string) {
  const api = useApiClient();
  return useQuery({
    queryKey: ["appointment", id],
    queryFn: ({ signal }) => api.get(`/v1/appointments/${id}`, appointmentSchema, { signal }),
    staleTime: staleTime.operational,
  });
}

export function useCommitAppointment() {
  const api = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    // A booking only enters cache after the scheduling service commits it.
    mutationFn: (input: { holdId: string; patientId: string; source: Appointment["source"] }) =>
      api.post("/v1/appointments", appointmentSchema, input, { action: createApiAction() }),
    onSuccess: (appointment) => {
      queryClient.setQueryData(["appointment", appointment.id], appointment);
      void queryClient.invalidateQueries({ queryKey: ["appointments"] });
      void queryClient.invalidateQueries({ queryKey: ["availability"] });
    },
  });
}

export function useUpdateAppointment() {
  const api = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      version,
      ...body
    }: {
      id: string;
      version: number;
      status?: Appointment["status"];
      slotStart?: string;
    }) =>
      api.patch(`/v1/appointments/${id}`, appointmentSchema, body, {
        version,
        action: createApiAction(),
      }),
    onSuccess: (appointment) => {
      queryClient.setQueryData(["appointment", appointment.id], appointment);
      void queryClient.invalidateQueries({ queryKey: ["appointments"] });
      void queryClient.invalidateQueries({ queryKey: ["availability"] });
    },
  });
}
