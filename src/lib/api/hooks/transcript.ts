"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { transcriptSchema } from "@/lib/schemas";
import type { Transcript } from "@/lib/schemas";
import { createApiAction } from "../client";
import { useApiClient } from "../provider";
import { staleTime } from "../query";

export function useTranscript(encounterId: string) {
  const api = useApiClient();
  return useQuery({
    queryKey: ["transcript", encounterId],
    queryFn: ({ signal }) =>
      api.get(`/v1/encounters/${encounterId}/transcript`, transcriptSchema, { signal }),
    staleTime: staleTime.patientRecord,
  });
}

export function useUpdateTranscript() {
  const api = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      encounterId,
      version,
      segments,
    }: {
      encounterId: string;
      version: number;
      segments: Transcript["segments"];
    }) =>
      api.patch(
        `/v1/encounters/${encounterId}/transcript`,
        transcriptSchema,
        { segments },
        {
          version,
          action: createApiAction(),
        },
      ),
    onSuccess: (transcript) =>
      queryClient.setQueryData(["transcript", transcript.encounterId], transcript),
  });
}
