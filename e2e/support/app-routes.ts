import type { BrowserContext } from "@playwright/test";

export type Locale = "ar" | "en";
export type TestRole = "public" | "patient" | "receptionist" | "doctor" | "developer";

export type AppRoute = {
  name: string;
  path: string;
  role: TestRole;
};

export const appRoutes: readonly AppRoute[] = [
  { name: "home", path: "", role: "public" },
  { name: "about", path: "/about", role: "public" },
  { name: "clinic", path: "/clinic/andalusia-maadi", role: "public" },
  { name: "doctor-profile", path: "/doctor/mariam-fouad", role: "public" },
  { name: "for-clinics", path: "/for-clinics", role: "public" },
  { name: "help", path: "/help", role: "public" },
  { name: "privacy", path: "/privacy", role: "public" },
  { name: "pulse", path: "/pulse", role: "public" },
  { name: "search", path: "/search", role: "public" },
  { name: "sign-in", path: "/sign-in", role: "public" },
  { name: "specialties", path: "/specialties", role: "public" },
  { name: "specialty", path: "/specialty/cardiology", role: "public" },
  { name: "terms", path: "/terms", role: "public" },
  { name: "patient", path: "/patient", role: "patient" },
  {
    name: "patient-appointment",
    path: "/patient/appointments/appointment-upcoming-mariam",
    role: "patient",
  },
  { name: "patient-encounters", path: "/patient/encounters", role: "patient" },
  { name: "patient-notifications", path: "/patient/notifications", role: "patient" },
  { name: "patient-prescriptions", path: "/patient/prescriptions", role: "patient" },
  { name: "patient-profile", path: "/patient/profile", role: "patient" },
  { name: "reception", path: "/reception", role: "receptionist" },
  { name: "doctor-workspace", path: "/doctor", role: "doctor" },
  { name: "developer", path: "/developer", role: "developer" },
  { name: "developer-notifications", path: "/developer/notifications", role: "developer" },
  { name: "dev-i18n", path: "/dev/i18n", role: "developer" },
  { name: "dev-tokens", path: "/dev/tokens", role: "developer" },
  { name: "dev-ui", path: "/dev/ui", role: "developer" },
] as const;

const sessions = {
  patient: {
    user: { id: "usr-amal", name: "Amal Hassan", email: "amal@example.test" },
    roles: ["patient"],
    clinicId: null,
    patientId: "patient-amal",
  },
  receptionist: {
    user: { id: "usr-dina", name: "Dina Adel", email: "dina@maadi.example.test" },
    roles: ["receptionist"],
    clinicId: "clinic-maadi",
  },
  doctor: {
    user: { id: "usr-mariam", name: "Dr Mariam Fouad", email: "mariam@maadi.example.test" },
    roles: ["doctor"],
    clinicId: "clinic-maadi",
    doctorId: "dr-mariam-fouad",
  },
  developer: {
    user: { id: "usr-salma", name: "Salma Nabil", email: "salma@nabda.example.test" },
    roles: ["developer"],
    clinicId: "clinic-maadi",
  },
} as const;

export async function useRole(context: BrowserContext, role: TestRole) {
  await context.clearCookies();
  if (role === "public") return;
  const session = { ...sessions[role], exp: Math.floor(Date.now() / 1000) + 3600 };
  await context.addCookies([
    {
      name: "nabda_mock_session",
      value: Buffer.from(JSON.stringify(session)).toString("base64url"),
      url: "http://localhost:3000",
    },
  ]);
}

export function localizedPath(locale: Locale, path: string) {
  return `/${locale}${path}`;
}
