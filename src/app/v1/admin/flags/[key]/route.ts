import { NextResponse } from "next/server";
import { updateAdminFlag } from "@/lib/developer/admin-store";
import { adminValidationError, adminVersionConflict, developerGuard } from "@/lib/developer/http";

export async function PATCH(request: Request, { params }: { params: Promise<{ key: string }> }) {
  const forbidden = await developerGuard("manage");
  if (forbidden) return forbidden;
  const { key } = await params;
  const input = (await request.json()) as { enabled?: unknown };
  if (typeof input.enabled !== "boolean")
    return adminValidationError(request, "enabled must be a boolean.");
  const updated = updateAdminFlag(key, Number(request.headers.get("If-Match")), input.enabled);
  return updated ? NextResponse.json(updated) : adminVersionConflict(request);
}
