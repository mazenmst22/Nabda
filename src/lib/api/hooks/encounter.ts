"use client";

import { useMutation } from "@tanstack/react-query";
import { audioUploadSchema, encounterSchema, jobSchema } from "@/lib/schemas";
import { createApiAction } from "../client";
import { useApiClient } from "../provider";

export function useCreateEncounter() {
  const api = useApiClient();
  return useMutation({
    mutationFn: (input: { patientId: string; appointmentId?: string; doctorId: string }) =>
      api.post("/v1/encounters", encounterSchema, input, { action: createApiAction() }),
  });
}

export function useCreateAudioUploadUrl() {
  const api = useApiClient();
  return useMutation({
    mutationFn: ({
      encounterId,
      ...input
    }: {
      encounterId: string;
      contentType: string;
      bytes: number;
    }) =>
      api.post(`/v1/encounters/${encounterId}/audio/upload-url`, audioUploadSchema, input, {
        action: createApiAction(),
      }),
  });
}

export function useCompleteAudioUpload() {
  const api = useApiClient();
  return useMutation({
    mutationFn: ({
      encounterId,
      ...input
    }: {
      encounterId: string;
      audioKey: string;
      sha256: string;
      durationMs: number;
    }) =>
      api.post(`/v1/encounters/${encounterId}/audio/complete`, jobSchema, input, {
        action: createApiAction(),
      }),
  });
}

export function useStartExtraction() {
  const api = useApiClient();
  return useMutation({
    mutationFn: (encounterId: string) =>
      api.post(`/v1/encounters/${encounterId}/extraction`, jobSchema, undefined, {
        action: createApiAction(),
      }),
  });
}
