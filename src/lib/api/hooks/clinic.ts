"use client";

import { useQuery } from "@tanstack/react-query";
import { clinicListSchema, clinicSchema } from "@/lib/schemas";
import { useApiClient } from "../provider";
import { staleTime, withQuery } from "../query";

export function useClinics(
  params: { q?: string; city?: string; district?: string; page?: number } = {},
) {
  const api = useApiClient();
  return useQuery({
    queryKey: ["directory", "clinics", params],
    queryFn: ({ signal }) =>
      api.get(withQuery("/v1/public/clinics", params), clinicListSchema, {
        signal,
        degrade: () => ({ items: [], page: params.page ?? 1, pageSize: 0, total: 0 }),
      }),
    staleTime: staleTime.directory,
  });
}

export function useClinic(slug: string) {
  const api = useApiClient();
  return useQuery({
    queryKey: ["directory", "clinic", slug],
    queryFn: ({ signal }) => api.get(`/v1/public/clinics/${slug}`, clinicSchema, { signal }),
    staleTime: staleTime.directory,
  });
}
