import type { AuthSession, Role } from "@/lib/auth/session";

export const resources = [
  "appointment",
  "patient",
  "clinical_record",
  "schedule",
  "queue",
  "clinic_configuration",
  "billing",
  "audit_log",
  "developer_tool",
  "pulse",
] as const;

export const actions = ["create", "read", "update", "delete", "manage"] as const;

export type Resource = (typeof resources)[number];
export type Action = (typeof actions)[number];

type PermissionMap = Record<Resource, Partial<Record<Action, readonly Role[]>>>;

export const permissionMap: PermissionMap = {
  appointment: {
    create: ["patient", "receptionist", "clinic_admin"],
    read: ["patient", "receptionist", "doctor", "clinic_admin"],
    update: ["patient", "receptionist", "doctor", "clinic_admin"],
    delete: ["patient", "receptionist", "clinic_admin"],
  },
  patient: {
    read: ["patient", "receptionist", "doctor", "clinic_admin"],
    update: ["patient", "receptionist", "clinic_admin"],
  },
  clinical_record: {
    create: ["doctor"],
    read: ["patient", "doctor", "clinic_admin"],
    update: ["doctor"],
  },
  schedule: {
    create: ["receptionist", "doctor", "clinic_admin"],
    read: ["receptionist", "doctor", "clinic_admin"],
    update: ["receptionist", "doctor", "clinic_admin"],
    delete: ["clinic_admin"],
  },
  queue: {
    read: ["receptionist", "doctor", "clinic_admin"],
    update: ["receptionist", "doctor", "clinic_admin"],
  },
  clinic_configuration: { read: ["clinic_admin"], manage: ["clinic_admin"] },
  billing: { read: ["clinic_admin", "platform_admin"], manage: ["clinic_admin", "platform_admin"] },
  audit_log: { read: ["clinic_admin", "platform_admin"] },
  developer_tool: {
    read: ["developer", "platform_admin"],
    manage: ["developer", "platform_admin"],
  },
  pulse: { create: ["patient"], read: ["patient", "receptionist", "clinic_admin"] },
};

export type PermissionContext = {
  ownerPatientId?: string;
  clinicId?: string;
  requiresStepUp?: boolean;
  now?: number;
};

function hasResourceScope(session: AuthSession, resource: Resource, context: PermissionContext) {
  if (
    context.clinicId &&
    session.clinicId !== context.clinicId &&
    !session.roles.includes("platform_admin")
  ) {
    return false;
  }
  if (
    session.roles.includes("patient") &&
    ["appointment", "patient", "clinical_record"].includes(resource)
  ) {
    return Boolean(session.patientId && context.ownerPatientId === session.patientId);
  }
  return true;
}

export function can(
  session: AuthSession | null,
  resource: Resource,
  action: Action,
  context: PermissionContext = {},
) {
  const now = context.now ?? Math.floor(Date.now() / 1000);
  if (!session || session.exp <= now) return false;
  const allowedRoles = permissionMap[resource][action] ?? [];
  if (!session.roles.some((role) => allowedRoles.includes(role))) return false;
  if (!hasResourceScope(session, resource, context)) return false;
  if (context.requiresStepUp && (!session.stepUpExp || session.stepUpExp <= now)) return false;
  return true;
}
