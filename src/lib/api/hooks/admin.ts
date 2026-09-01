"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  adminAuditListSchema,
  adminFlagListSchema,
  adminFlagSchema,
  adminHealthSchema,
  adminPromptListSchema,
  adminPromptSchema,
  adminProviderListSchema,
  adminProviderSchema,
  adminSettingsSchema,
} from "@/lib/schemas";
import type { AdminFlag, AdminPrompt, AdminProvider, AdminSettings } from "@/lib/schemas";
import { createApiAction } from "../client";
import { useApiClient } from "../provider";
import { staleTime, withQuery } from "../query";

export function useAdminSettings() {
  const api = useApiClient();
  return useQuery({
    queryKey: ["admin", "settings"],
    queryFn: ({ signal }) => api.get("/v1/admin/settings", adminSettingsSchema, { signal }),
    staleTime: staleTime.configuration,
  });
}

export function useUpdateAdminSettings() {
  const api = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ version, ...body }: Partial<AdminSettings> & { version: number }) =>
      api.patch("/v1/admin/settings", adminSettingsSchema, body, {
        version,
        action: createApiAction(),
      }),
    onSuccess: (settings) => queryClient.setQueryData(["admin", "settings"], settings),
  });
}

export function useAdminProviders() {
  const api = useApiClient();
  return useQuery({
    queryKey: ["admin", "providers"],
    queryFn: ({ signal }) => api.get("/v1/admin/providers", adminProviderListSchema, { signal }),
    staleTime: staleTime.configuration,
  });
}

export function useUpdateAdminProvider() {
  const api = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      version,
      ...body
    }: Partial<AdminProvider> & { id: string; version: number }) =>
      api.patch(`/v1/admin/providers/${id}`, adminProviderSchema, body, {
        version,
        action: createApiAction(),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "providers"] }),
  });
}

export function useAdminFlags() {
  const api = useApiClient();
  return useQuery({
    queryKey: ["admin", "flags"],
    queryFn: ({ signal }) => api.get("/v1/admin/flags", adminFlagListSchema, { signal }),
    staleTime: staleTime.configuration,
  });
}

export function useUpdateAdminFlag() {
  const api = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      key,
      version,
      ...body
    }: Partial<AdminFlag> & { key: string; version: number }) =>
      api.patch(`/v1/admin/flags/${key}`, adminFlagSchema, body, {
        version,
        action: createApiAction(),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "flags"] }),
  });
}

export function useAdminPrompts() {
  const api = useApiClient();
  return useQuery({
    queryKey: ["admin", "prompts"],
    queryFn: ({ signal }) => api.get("/v1/admin/prompts", adminPromptListSchema, { signal }),
    staleTime: staleTime.configuration,
  });
}

export function useCreateAdminPromptVersion() {
  const api = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Pick<AdminPrompt, "key" | "template">) =>
      api.post("/v1/admin/prompts", adminPromptSchema, input, { action: createApiAction() }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "prompts"] }),
  });
}

export function useAdminAudit(
  params: { actor?: string; entity?: string; from?: string; to?: string; page?: number } = {},
) {
  const api = useApiClient();
  return useQuery({
    queryKey: ["admin", "audit", params],
    queryFn: ({ signal }) =>
      api.get(withQuery("/v1/admin/audit", params), adminAuditListSchema, { signal }),
    staleTime: staleTime.operational,
  });
}

export function useAdminHealth() {
  const api = useApiClient();
  return useQuery({
    queryKey: ["admin", "health"],
    queryFn: ({ signal }) => api.get("/v1/admin/health", adminHealthSchema, { signal }),
    staleTime: staleTime.operational,
    refetchInterval: 30_000,
  });
}
