"use client";

import type { ReactNode } from "react";
import { useSession } from "@/lib/auth/session-provider";
import type { Action, PermissionContext, Resource } from "./permissions";
import { can } from "./permissions";

export function Can({
  resource,
  action,
  context,
  children,
  fallback = null,
}: {
  resource: Resource;
  action: Action;
  context?: PermissionContext;
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const { session } = useSession();
  return can(session, resource, action, context) ? children : fallback;
}
