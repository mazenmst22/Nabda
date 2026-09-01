import { describe, expect, it } from "vitest";
import { createMockSession } from "@/lib/auth/session";
import { AuthorizationDeniedError, requireRole } from "./guard";
import { can } from "./permissions";

describe("Nabda authorization boundaries", () => {
  it("prevents a receptionist from reaching doctor routes", async () => {
    const receptionist = createMockSession("receptionist");
    await expect(requireRole(["doctor", "clinic_admin"], receptionist)).rejects.toBeInstanceOf(
      AuthorizationDeniedError,
    );
  });

  it("prevents a developer from reading a clinical record", () => {
    const developer = createMockSession("developer");
    expect(
      can(developer, "clinical_record", "read", {
        ownerPatientId: "patient-amal",
        clinicId: "clinic-maadi",
      }),
    ).toBe(false);
  });

  it("prevents a patient from reading another patient's appointment", () => {
    const patient = createMockSession("patient", { patientId: "patient-amal" });
    expect(can(patient, "appointment", "read", { ownerPatientId: "patient-nour" })).toBe(false);
    expect(can(patient, "appointment", "read", { ownerPatientId: "patient-amal" })).toBe(true);
  });
});
