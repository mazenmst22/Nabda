import { NextResponse } from "next/server";
import { forbidUnless } from "@/lib/rbac/http";

export async function developerGuard(action: "read" | "manage" = "read", requiresStepUp = false) {
  return forbidUnless("developer_tool", action, { requiresStepUp });
}

export function adminVersionConflict(request: Request) {
  return NextResponse.json(
    {
      type: "https://nabda.health/errors/version-conflict",
      title: "Configuration changed",
      status: 409,
      code: "VERSION_CONFLICT",
      detail: "This configuration changed. Load the latest version before saving.",
      correlationId: request.headers.get("X-Correlation-Id") ?? crypto.randomUUID(),
    },
    { status: 409 },
  );
}

export function adminValidationError(request: Request, detail: string) {
  return NextResponse.json(
    {
      type: "https://nabda.health/errors/validation",
      title: "Configuration is invalid",
      status: 422,
      code: "UNKNOWN_ERROR",
      detail,
      correlationId: request.headers.get("X-Correlation-Id") ?? crypto.randomUUID(),
    },
    { status: 422 },
  );
}
