"use client";

import { useQuery } from "@tanstack/react-query";
import { useApiClient } from "../provider";
import { staleTime, withQuery } from "../query";
import {
  daySlotsListSchema,
  doctorListSchema,
  doctorSchema,
  specialtyListSchema,
} from "@/lib/schemas";

export type DoctorSearch = {
  specialty?: string;
  subSpecialty?: string;
  city?: string;
  district?: string;
  clinicId?: string;
  gender?: "female" | "male";
  title?: string;
  feeMin?: number;
  feeMax?: number;
  availability?: "any" | "today" | "tomorrow";
  sort?: "best" | "rating" | "feeAsc" | "feeDesc" | "soonest";
  page?: number;
};

export function useDoctors(params: DoctorSearch = {}) {
  const api = useApiClient();
  return useQuery({
    queryKey: ["directory", "doctors", params],
    queryFn: ({ signal }) =>
      api.get(withQuery("/v1/public/doctors", params), doctorListSchema, {
        signal,
        degrade: () => ({ items: [], page: params.page ?? 1, pageSize: 0, total: 0 }),
      }),
    staleTime: staleTime.directory,
  });
}

export function useDoctor(slug: string) {
  const api = useApiClient();
  return useQuery({
    queryKey: ["directory", "doctor", slug],
    queryFn: ({ signal }) => api.get(`/v1/public/doctors/${slug}`, doctorSchema, { signal }),
    staleTime: staleTime.directory,
  });
}

export function useSpecialties() {
  const api = useApiClient();
  return useQuery({
    queryKey: ["directory", "specialties"],
    queryFn: ({ signal }) =>
      api.get("/v1/public/specialties", specialtyListSchema, { signal, degrade: () => [] }),
    staleTime: staleTime.directory,
  });
}

export function useDoctorAvailability(doctorId: string, from: string, to: string) {
  const api = useApiClient();
  return useQuery({
    queryKey: ["availability", doctorId, from, to],
    queryFn: ({ signal }) =>
      api.get(
        withQuery(`/v1/public/doctors/${doctorId}/availability`, { from, to }),
        daySlotsListSchema,
        { signal, degrade: () => [] },
      ),
    staleTime: staleTime.availability,
  });
}
