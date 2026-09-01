import type { AuthSession, Role } from "@/lib/auth/session";
import { getSession } from "@/lib/auth/session";
import type { Action, PermissionContext, Resource } from "./permissions";
import { can } from "./permissions";

export class AuthorizationDeniedError extends Error {
  readonly status = 403;

  constructor() {
    super("Access denied");
    this.name = "AuthorizationDeniedError";
  }
}

export async function requireRole(
  allowedRoles: readonly Role[],
  providedSession?: AuthSession | null,
) {
  const session = providedSession === undefined ? await getSession() : providedSession;
  if (
    !session ||
    session.exp <= Math.floor(Date.now() / 1000) ||
    !session.roles.some((role) => allowedRoles.includes(role))
  ) {
    throw new AuthorizationDeniedError();
  }
  return session;
}

export async function requirePermission(
  resource: Resource,
  action: Action,
  context: PermissionContext = {},
  providedSession?: AuthSession | null,
) {
  const session = providedSession === undefined ? await getSession() : providedSession;
  if (!can(session, resource, action, context)) throw new AuthorizationDeniedError();
  return session;
}
