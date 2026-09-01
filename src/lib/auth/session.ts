export const SESSION_COOKIE_NAME = "nabda_mock_session";
export const SESSION_DURATION_SECONDS = 60 * 60;
export const SESSION_WARNING_SECONDS = 5 * 60;
export const STEP_UP_DURATION_SECONDS = 5 * 60;

export const roles = [
  "patient",
  "receptionist",
  "doctor",
  "clinic_admin",
  "developer",
  "platform_admin",
] as const;

export type Role = (typeof roles)[number];

export type SessionUser = {
  id: string;
  name: string;
  email: string;
};

export type AuthSession = {
  user: SessionUser;
  roles: Role[];
  clinicId: string | null;
  patientId?: string;
  doctorId?: string;
  exp: number;
  stepUpExp?: number;
};

function isRole(value: unknown): value is Role {
  return typeof value === "string" && roles.includes(value as Role);
}

function isSession(value: unknown): value is AuthSession {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<AuthSession>;
  return Boolean(
    candidate.user &&
    typeof candidate.user.id === "string" &&
    typeof candidate.user.name === "string" &&
    typeof candidate.user.email === "string" &&
    Array.isArray(candidate.roles) &&
    candidate.roles.length > 0 &&
    candidate.roles.every(isRole) &&
    (typeof candidate.clinicId === "string" || candidate.clinicId === null) &&
    typeof candidate.exp === "number",
  );
}

function toBase64Url(value: string) {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/u, "");
}

function fromBase64Url(value: string) {
  const base64 = value.replaceAll("-", "+").replaceAll("_", "/");
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export function encodeSessionToken(session: AuthSession) {
  return toBase64Url(JSON.stringify(session));
}

export function decodeSessionToken(token: string | undefined): AuthSession | null {
  if (!token) return null;
  try {
    const parsed: unknown = JSON.parse(fromBase64Url(token));
    return isSession(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function createMockSession(
  role: Role,
  overrides: Partial<Omit<AuthSession, "user" | "roles">> & {
    user?: Partial<SessionUser>;
    roles?: Role[];
  } = {},
): AuthSession {
  const identities: Record<Role, { id: string; name: string; email: string }> = {
    patient: { id: "usr-amal", name: "Amal Hassan", email: "amal@example.test" },
    receptionist: { id: "usr-dina", name: "Dina Adel", email: "dina@maadi.example.test" },
    doctor: { id: "usr-mariam", name: "Dr Mariam Fouad", email: "mariam@maadi.example.test" },
    clinic_admin: { id: "usr-salma", name: "Salma Nabil", email: "salma@maadi.example.test" },
    developer: { id: "usr-youssef", name: "Youssef Kamal", email: "youssef@nabda.example.test" },
    platform_admin: { id: "usr-nour", name: "Nour Samir", email: "nour@nabda.example.test" },
  };
  const identity = identities[role];
  return {
    user: { ...identity, ...overrides.user },
    roles: overrides.roles ?? [role],
    clinicId:
      overrides.clinicId === undefined
        ? role === "patient"
          ? null
          : "clinic-maadi"
        : overrides.clinicId,
    patientId: role === "patient" ? "patient-amal" : overrides.patientId,
    doctorId: role === "doctor" ? "doctor-mariam" : overrides.doctorId,
    exp: overrides.exp ?? Math.floor(Date.now() / 1000) + SESSION_DURATION_SECONDS,
    stepUpExp: overrides.stepUpExp,
  };
}

export function getDevelopmentSession() {
  return createMockSession("developer");
}

export function isSessionActive(session: AuthSession | null, now = Math.floor(Date.now() / 1000)) {
  return Boolean(session && session.exp > now);
}

export function renewSession(
  session: AuthSession,
  now = Math.floor(Date.now() / 1000),
): AuthSession | null {
  if (!isSessionActive(session, now)) return null;
  return { ...session, exp: now + SESSION_DURATION_SECONDS, stepUpExp: undefined };
}

export function stepUpSession(
  session: AuthSession,
  now = Math.floor(Date.now() / 1000),
): AuthSession | null {
  if (!isSessionActive(session, now)) return null;
  return { ...session, stepUpExp: now + STEP_UP_DURATION_SECONDS };
}

export function hasFreshStepUp(session: AuthSession, now = Math.floor(Date.now() / 1000)) {
  return typeof session.stepUpExp === "number" && session.stepUpExp > now;
}

export async function getSession(): Promise<AuthSession | null> {
  const { cookies } = await import("next/headers");
  const store = await cookies();
  const session = decodeSessionToken(store.get(SESSION_COOKIE_NAME)?.value);
  if (isSessionActive(session)) return session;
  return process.env.NODE_ENV === "production" ? null : getDevelopmentSession();
}
