import { NextResponse } from "next/server";
import { developerAdminStore, publishPromptVersion } from "@/lib/developer/admin-store";
import { adminValidationError, developerGuard } from "@/lib/developer/http";

export async function GET() {
  const forbidden = await developerGuard();
  if (forbidden) return forbidden;
  return NextResponse.json(developerAdminStore().prompts);
}

export async function POST(request: Request) {
  const forbidden = await developerGuard("manage");
  if (forbidden) return forbidden;
  const input = (await request.json()) as { key?: unknown; template?: unknown };
  if (
    typeof input.key !== "string" ||
    typeof input.template !== "string" ||
    input.template.trim().length < 20
  ) {
    return adminValidationError(
      request,
      "Prompt templates require a key and at least twenty characters.",
    );
  }
  return NextResponse.json(publishPromptVersion(input.key, input.template.trim()), { status: 201 });
}
