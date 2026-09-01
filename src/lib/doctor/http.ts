import { NextResponse } from "next/server";

export function clinicalError(
  request: Request,
  code:
    | "CONSENT_REQUIRED"
    | "CONSENT_REVOKED"
    | "PROVIDER_UNAVAILABLE"
    | "EXTRACTION_INVALID_JSON"
    | "VERSION_CONFLICT",
  status: number,
) {
  const details = {
    CONSENT_REVOKED: "The patient revoked audio consent. Capture must stop immediately.",
    CONSENT_REQUIRED: "A current consent record is required before audio capture.",
    PROVIDER_UNAVAILABLE: "The configured provider is temporarily unavailable.",
    EXTRACTION_INVALID_JSON:
      "The extraction provider returned invalid JSON. No partial medication data was stored.",
    VERSION_CONFLICT: "The clinical record changed. Load the latest version before saving.",
  } as const;
  return NextResponse.json(
    {
      type: `https://nabda.health/errors/${code.toLowerCase().replaceAll("_", "-")}`,
      title:
        code === "EXTRACTION_INVALID_JSON"
          ? "Extraction could not be validated"
          : code === "VERSION_CONFLICT"
            ? "Clinical record changed"
            : code === "CONSENT_REVOKED"
              ? "Consent revoked"
              : "Clinical service unavailable",
      status,
      code,
      detail: details[code],
      correlationId: request.headers.get("X-Correlation-Id") ?? crypto.randomUUID(),
    },
    { status },
  );
}
