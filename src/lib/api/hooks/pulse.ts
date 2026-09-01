"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  pulseConfirmationSchema,
  pulseHandoffSchema,
  pulseMessageAcceptedSchema,
  pulseSchema,
} from "@/lib/schemas";
import { createApiAction } from "../client";
import { useApiClient } from "../provider";

export function useCreatePulseConversation() {
  const api = useApiClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () =>
      api.post("/v1/pulse/conversations", pulseSchema, undefined, { action: createApiAction() }),
    onSuccess: (conversation) => queryClient.setQueryData(["pulse", conversation.id], conversation),
  });
}

export function useSendPulseMessage() {
  const api = useApiClient();
  return useMutation({
    mutationFn: ({ conversationId, text }: { conversationId: string; text: string }) =>
      api.post(
        `/v1/pulse/conversations/${conversationId}/messages`,
        pulseMessageAcceptedSchema,
        { text },
        {
          action: createApiAction(),
        },
      ),
  });
}

export function useConfirmPulseToolCall() {
  const api = useApiClient();
  return useMutation({
    mutationFn: ({
      conversationId,
      toolCallId,
      confirmed,
    }: {
      conversationId: string;
      toolCallId: string;
      confirmed: boolean;
    }) =>
      api.post(
        `/v1/pulse/conversations/${conversationId}/confirm`,
        pulseConfirmationSchema,
        { toolCallId, confirmed },
        {
          action: createApiAction(),
        },
      ),
  });
}

export function usePulseHandoff() {
  const api = useApiClient();
  return useMutation({
    mutationFn: (conversationId: string) =>
      api.post(`/v1/pulse/conversations/${conversationId}/handoff`, pulseHandoffSchema, undefined, {
        action: createApiAction(),
      }),
  });
}
