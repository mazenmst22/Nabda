"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { prescriptionListSchema, prescriptionSchema } from "@/lib/schemas";
import type { PrescriptionExtraction } from "@/lib/schemas";
import { createApiAction } from "../client";
import { useApiClient } from "../provider";
import { staleTime } from "../query";

export function usePrescriptions(encounterId: string) {
  const api = useApiClient();
  return useQuery({
    queryKey: ["prescriptions", encounterId],
    queryFn: ({ signal }) =>
      api.get(`/v1/encounters/${encounterId}/prescriptions`, prescriptionListSchema, {
        signal,
        degrade: () => [],
      }),
    staleTime: staleTime.patientRecord,
  });
}

export function useCreatePrescription() {
  const api = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      encounterId,
      payload,
    }: {
      encounterId: string;
      payload: PrescriptionExtraction;
    }) =>
      api.post(
        `/v1/encounters/${encounterId}/prescriptions`,
        prescriptionSchema,
        { payload },
        {
          action: createApiAction(),
        },
      ),
    onSuccess: (prescription) =>
      queryClient.invalidateQueries({ queryKey: ["prescriptions", prescription.encounterId] }),
  });
}

export function useApprovePrescription() {
  const api = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, signature }: { id: string; signature: string }) =>
      api.post(
        `/v1/prescriptions/${id}/approve`,
        prescriptionSchema,
        { signature },
        {
          action: createApiAction(),
        },
      ),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["prescriptions"] }),
  });
}
