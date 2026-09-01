"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { patientListSchema, patientSchema, patientTimelineSchema } from "@/lib/schemas";
import type { Patient } from "@/lib/schemas";
import { createApiAction } from "../client";
import { useApiClient } from "../provider";
import { staleTime, withQuery } from "../query";

export function usePatients(params: { q?: string; page?: number } = {}) {
  const api = useApiClient();
  return useQuery({
    queryKey: ["patients", params],
    queryFn: ({ signal }) =>
      api.get(withQuery("/v1/patients", params), patientListSchema, {
        signal,
        degrade: () => ({ items: [], page: params.page ?? 1, pageSize: 0, total: 0 }),
      }),
    staleTime: staleTime.patientRecord,
  });
}

export function usePatient(id: string) {
  const api = useApiClient();
  return useQuery({
    queryKey: ["patient", id],
    queryFn: ({ signal }) => api.get(`/v1/patients/${id}`, patientSchema, { signal }),
    staleTime: staleTime.patientRecord,
  });
}

export function usePatientTimeline(id: string) {
  const api = useApiClient();
  return useQuery({
    queryKey: ["patient", id, "timeline"],
    queryFn: ({ signal }) =>
      api.get(`/v1/patients/${id}/timeline`, patientTimelineSchema, {
        signal,
        degrade: () => [],
      }),
    staleTime: staleTime.patientRecord,
  });
}

export function useCreatePatient() {
  const api = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Omit<Patient, "id" | "clinicId" | "createdAt" | "version">) =>
      api.post("/v1/patients", patientSchema, input, { action: createApiAction() }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["patients"] }),
  });
}

export function useUpdatePatient() {
  const api = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, version, ...body }: Partial<Patient> & { id: string; version: number }) =>
      api.patch(`/v1/patients/${id}`, patientSchema, body, {
        version,
        action: createApiAction(),
      }),
    onSuccess: (patient) => {
      queryClient.setQueryData(["patient", patient.id], patient);
      void queryClient.invalidateQueries({ queryKey: ["patients"] });
    },
  });
}
