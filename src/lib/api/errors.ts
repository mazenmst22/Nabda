import { z } from "zod";

const errorFields = {
  type: z.url(),
  title: z.string(),
  status: z.number().int(),
  detail: z.string(),
  correlationId: z.string(),
  errors: z.record(z.string(), z.array(z.string())).optional(),
};

function errorVariant<const T extends string>(code: T) {
  return z.object({ ...errorFields, code: z.literal(code) }).strict();
}

export const apiErrorSchema = z.discriminatedUnion("code", [
  errorVariant("SLOT_TAKEN"),
  errorVariant("HOLD_EXPIRED"),
  errorVariant("VERSION_CONFLICT"),
  errorVariant("CONSENT_REQUIRED"),
  errorVariant("CONSENT_REVOKED"),
  errorVariant("NOT_AUTHORIZED"),
  errorVariant("CLINIC_SCOPE_VIOLATION"),
  errorVariant("EXTRACTION_INVALID_JSON"),
  errorVariant("PROVIDER_UNAVAILABLE"),
  errorVariant("RATE_LIMITED"),
  errorVariant("UNKNOWN_ERROR"),
]);

export type ApiError = z.infer<typeof apiErrorSchema>;
export type ApiErrorCode = ApiError["code"];

const looseErrorSchema = z
  .object({
    type: z.string().optional(),
    title: z.string().optional(),
    status: z.number().int().optional(),
    code: z.string().optional(),
    detail: z.string().optional(),
    correlationId: z.string().optional(),
    errors: z.record(z.string(), z.array(z.string())).optional(),
  })
  .passthrough();

export function parseApiError(input: unknown, status: number, correlationId: string): ApiError {
  const known = apiErrorSchema.safeParse(input);
  if (known.success) return known.data;
  const loose = looseErrorSchema.safeParse(input);
  const data = loose.success ? loose.data : {};
  return {
    type: "https://nabda.health/errors/unknown",
    title: data.title ?? "Request failed",
    status: data.status ?? status,
    code: "UNKNOWN_ERROR",
    detail: data.detail ?? "The request could not be completed.",
    correlationId: data.correlationId ?? correlationId,
    ...(data.errors ? { errors: data.errors } : {}),
  };
}

export class ApiRequestError extends Error {
  readonly envelope: ApiError;

  constructor(envelope: ApiError) {
    super(envelope.detail);
    this.name = "ApiRequestError";
    this.envelope = envelope;
  }
}

export class ApiValidationError extends Error {
  constructor(
    readonly path: string,
    readonly issues: z.core.$ZodIssue[],
  ) {
    super(`Invalid API response for ${path}`);
    this.name = "ApiValidationError";
  }
}
