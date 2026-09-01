"use client";

import { useMutation } from "@tanstack/react-query";
import { consentSchema } from "@/lib/schemas";
import { createApiAction } from "../client";
import { useApiClient } from "../provider";

export function useCreateConsent() {
  const api = useApiClient();
  return useMutation({
    mutationFn: (input: {
      patientId: string;
      encounterId?: string;
      purpose: string;
      textVersion: string;
    }) => api.post("/v1/consents", consentSchema, input, { action: createApiAction() }),
  });
}

export function useRevokeConsent() {
  const api = useApiClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.delete(`/v1/consents/${id}`, consentSchema, { action: createApiAction() }),
  });
}
