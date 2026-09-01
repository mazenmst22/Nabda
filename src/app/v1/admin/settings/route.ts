import { NextResponse } from "next/server";
import { developerAdminStore, updateAdminSettings } from "@/lib/developer/admin-store";
import { adminValidationError, adminVersionConflict, developerGuard } from "@/lib/developer/http";
import { adminSettingsSchema } from "@/lib/schemas";

export async function GET() {
  const forbidden = await developerGuard();
  if (forbidden) return forbidden;
  return NextResponse.json(developerAdminStore().settings);
}

export async function PATCH(request: Request) {
  const forbidden = await developerGuard("manage");
  if (forbidden) return forbidden;
  const current = developerAdminStore().settings;
  const input = (await request.json()) as Partial<typeof current>;
  const candidate = adminSettingsSchema.safeParse({
    ...current,
    ...input,
    version: current.version + 1,
  });
  if (!candidate.success)
    return adminValidationError(request, "Review locale, timezone, and retention values.");
  const updated = updateAdminSettings(Number(request.headers.get("If-Match")), input);
  return updated ? NextResponse.json(updated) : adminVersionConflict(request);
}
