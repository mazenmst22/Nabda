import { NextResponse } from "next/server";
import { developerAdminStore, updateAdminProvider } from "@/lib/developer/admin-store";
import { adminValidationError, adminVersionConflict, developerGuard } from "@/lib/developer/http";
import { adminProviderSchema } from "@/lib/schemas";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const forbidden = await developerGuard("manage");
  if (forbidden) return forbidden;
  const { id } = await params;
  const current = developerAdminStore().providers.find((provider) => provider.id === id);
  if (!current) return adminVersionConflict(request);
  const input = (await request.json()) as Partial<typeof current>;
  const candidate = adminProviderSchema.safeParse({
    ...current,
    ...input,
    id: current.id,
    kind: current.kind,
    version: current.version + 1,
  });
  if (!candidate.success)
    return adminValidationError(
      request,
      "Review provider, model, region, timeout, confidence, and retention values.",
    );
  const updated = updateAdminProvider(id, Number(request.headers.get("If-Match")), input);
  return updated ? NextResponse.json(updated) : adminVersionConflict(request);
}
