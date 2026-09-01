"use client";

import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ApiClient } from "./client";

const ApiClientContext = createContext<ApiClient | null>(null);

export function NabdaApiProvider({ client, children }: { client: ApiClient; children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { retry: false, refetchOnWindowFocus: false },
          mutations: { retry: false },
        },
      }),
  );
  return (
    <ApiClientContext.Provider value={client}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </ApiClientContext.Provider>
  );
}

export function useApiClient() {
  const client = useContext(ApiClientContext);
  if (!client) throw new Error("NabdaApiProvider is required");
  return client;
}
