"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queueListSchema, queueSchema } from "@/lib/schemas";
import type { QueueEntry } from "@/lib/schemas";
import { createApiAction } from "../client";
import { useApiClient } from "../provider";
import { staleTime, withQuery } from "../query";

export function useQueue(doctorId: string, date: string) {
  const api = useApiClient();
  return useQuery({
    queryKey: ["queue", doctorId, date],
    queryFn: ({ signal }) =>
      api.get(withQuery("/v1/queue", { doctorId, date }), queueListSchema, {
        signal,
        degrade: () => [],
      }),
    staleTime: staleTime.operational,
  });
}

export function useUpdateQueueEntry() {
  const api = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      entryId,
      state,
      version,
    }: {
      entryId: string;
      state: QueueEntry["state"];
      version: number;
    }) =>
      api.patch(
        `/v1/queue/${entryId}`,
        queueSchema,
        { state },
        { version, action: createApiAction() },
      ),
    onMutate: async ({ entryId, state }) => {
      await queryClient.cancelQueries({ queryKey: ["queue"] });
      const snapshots = queryClient.getQueriesData<QueueEntry[]>({ queryKey: ["queue"] });
      queryClient.setQueriesData<QueueEntry[]>({ queryKey: ["queue"] }, (current) =>
        current?.map((entry) => (entry.id === entryId ? { ...entry, state } : entry)),
      );
      return { snapshots };
    },
    onError: (_error, _variables, context) => {
      for (const [key, value] of context?.snapshots ?? []) queryClient.setQueryData(key, value);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["queue"] }),
  });
}
