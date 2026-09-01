import type { z } from "zod";
import type { AppLocale } from "@/i18n/routing";
import { ApiRequestError, ApiValidationError, parseApiError } from "./errors";

type Awaitable<T> = T | Promise<T>;
type HttpMethod = "GET" | "POST" | "PATCH" | "PUT" | "DELETE";

export type ApiAction = {
  correlationId: string;
  idempotencyKey: string;
};

export function createApiAction(): ApiAction {
  return { correlationId: crypto.randomUUID(), idempotencyKey: crypto.randomUUID() };
}

export type ApiClientConfig = {
  baseUrl?: string;
  getAccessToken: () => Awaitable<string>;
  getClinicId: () => Awaitable<string>;
  getLocale: () => AppLocale;
  fetch?: typeof fetch;
  onValidationError?: (error: ApiValidationError) => void;
};

export type RequestOptions<T> = {
  method?: HttpMethod;
  body?: unknown;
  action?: ApiAction;
  version?: string | number;
  retries?: number;
  signal?: AbortSignal;
  headers?: HeadersInit;
  degrade?: () => T;
};

function isMutation(method: HttpMethod) {
  return method === "POST" || method === "PATCH" || method === "DELETE";
}

function isUpdate(method: HttpMethod) {
  return method === "PATCH" || method === "PUT";
}

function isRetryableStatus(status: number) {
  return status === 429 || status >= 500;
}

export class ApiClient {
  private readonly baseUrl: string;

  constructor(private readonly config: ApiClientConfig) {
    this.baseUrl = config.baseUrl?.replace(/\/$/u, "") ?? "";
  }

  async request<T>(
    path: string,
    schema: z.ZodType<T>,
    options: RequestOptions<T> = {},
  ): Promise<T> {
    const method = options.method ?? "GET";
    if (isUpdate(method) && options.version === undefined) {
      throw new TypeError(`If-Match version is required for ${method} ${path}`);
    }

    const action = options.action ?? createApiAction();
    const [accessToken, clinicId] = await Promise.all([
      this.config.getAccessToken(),
      this.config.getClinicId(),
    ]);
    const headers = new Headers(options.headers);
    headers.set("Authorization", `Bearer ${accessToken}`);
    headers.set("X-Clinic-Id", clinicId);
    headers.set("X-Correlation-Id", action.correlationId);
    headers.set("Accept-Language", this.config.getLocale());
    if (process.env.NODE_ENV === "development" && typeof window !== "undefined") {
      const previewScenario = new URLSearchParams(window.location.search).get("mswScenario");
      if (previewScenario) headers.set("X-Nabda-MSW-Scenario", previewScenario);
    }
    if (options.body !== undefined) headers.set("Content-Type", "application/json");
    if (isMutation(method)) headers.set("Idempotency-Key", action.idempotencyKey);
    if (isUpdate(method)) headers.set("If-Match", String(options.version));

    const retries = options.retries ?? 1;
    let response: Response | undefined;
    let networkError: unknown;

    for (let attempt = 0; attempt <= retries; attempt += 1) {
      try {
        const fetcher = this.config.fetch ?? fetch;
        response = await fetcher(`${this.baseUrl}${path}`, {
          method,
          headers,
          body: options.body === undefined ? undefined : JSON.stringify(options.body),
          signal: options.signal,
        });
        if (!isRetryableStatus(response.status) || attempt === retries) break;
      } catch (error) {
        networkError = error;
        if (attempt === retries) throw error;
      }
    }

    if (!response) throw networkError instanceof Error ? networkError : new Error("Network error");
    const payload: unknown = await response.json();
    if (!response.ok) {
      throw new ApiRequestError(parseApiError(payload, response.status, action.correlationId));
    }

    const parsed = schema.safeParse(payload);
    if (parsed.success) return parsed.data;

    const validationError = new ApiValidationError(path, parsed.error.issues);
    if (process.env.NODE_ENV !== "production") throw validationError;
    this.config.onValidationError?.(validationError);
    if (options.degrade) return options.degrade();
    throw validationError;
  }

  get<T>(path: string, schema: z.ZodType<T>, options?: Omit<RequestOptions<T>, "method" | "body">) {
    return this.request(path, schema, { ...options, method: "GET" });
  }

  post<T>(
    path: string,
    schema: z.ZodType<T>,
    body?: unknown,
    options?: Omit<RequestOptions<T>, "method" | "body">,
  ) {
    return this.request(path, schema, { ...options, method: "POST", body });
  }

  patch<T>(
    path: string,
    schema: z.ZodType<T>,
    body: unknown,
    options: Omit<RequestOptions<T>, "method" | "body"> & { version: string | number },
  ) {
    return this.request(path, schema, { ...options, method: "PATCH", body });
  }

  put<T>(
    path: string,
    schema: z.ZodType<T>,
    body: unknown,
    options: Omit<RequestOptions<T>, "method" | "body"> & { version: string | number },
  ) {
    return this.request(path, schema, { ...options, method: "PUT", body });
  }

  delete<T>(
    path: string,
    schema: z.ZodType<T>,
    options?: Omit<RequestOptions<T>, "method" | "body">,
  ) {
    return this.request(path, schema, { ...options, method: "DELETE" });
  }
}
