"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { holdReleasedSchema, holdSchema } from "@/lib/schemas";
import { createApiAction } from "../client";
import { useApiClient } from "../provider";

export function useCreateHold() {
  const api = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { doctorId: string; slotStart: string; patientId?: string }) =>
      api.post("/v1/appointments/holds", holdSchema, input, { action: createApiAction() }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["availability"] }),
  });
}

export function useReleaseHold() {
  const api = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (holdId: string) =>
      api.delete(`/v1/appointments/holds/${holdId}`, holdReleasedSchema, {
        action: createApiAction(),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["availability"] }),
  });
}
