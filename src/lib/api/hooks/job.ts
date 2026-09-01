"use client";

import { useQuery } from "@tanstack/react-query";
import { jobSchema } from "@/lib/schemas";
import { useApiClient } from "../provider";

export function useJob(jobId: string) {
  const api = useApiClient();
  return useQuery({
    queryKey: ["job", jobId],
    queryFn: ({ signal }) => api.get(`/v1/jobs/${jobId}`, jobSchema, { signal }),
    staleTime: 0,
    refetchInterval: (query) => {
      const state = query.state.data?.state;
      return state === "succeeded" || state === "failed_terminal" || state === "cancelled"
        ? false
        : 2_000;
    },
  });
}
