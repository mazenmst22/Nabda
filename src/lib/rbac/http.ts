import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import type { Action, PermissionContext, Resource } from "./permissions";
import { can } from "./permissions";

export function nonDisclosingForbidden() {
  return NextResponse.json(
    {
      code: "NOT_AUTHORIZED",
      detail: "Access denied",
    },
    { status: 403, headers: { "Cache-Control": "no-store" } },
  );
}

export async function forbidUnless(
  resource: Resource,
  action: Action,
  context: PermissionContext = {},
) {
  const session = await getSession();
  return can(session, resource, action, context) ? null : nonDisclosingForbidden();
}
