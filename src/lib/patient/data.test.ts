import { describe, expect, it } from "vitest";
import type { Prescription } from "@/lib/schemas";
import { approvedPatientPrescriptions } from "./data";

const payload: Prescription["payload"] = {
  patientId: "patient-amal",
  encounterId: "encounter-one",
  extractedAt: "2026-08-29T10:00:00Z",
  medications: [],
  modelInfo: { provider: "test", model: "test", version: "1" },
};

describe("patient prescription boundary", () => {
  it("makes only clinician-approved, signed versions reachable", () => {
    const visible = approvedPatientPrescriptions(
      [
        {
          id: "draft",
          patientId: "patient-amal",
          encounterId: "encounter-one",
          status: "draft",
          payload,
          version: 1,
        },
        {
          id: "unsigned",
          patientId: "patient-amal",
          encounterId: "encounter-one",
          status: "approved",
          payload,
          approvedAt: "2026-08-29T10:10:00Z",
          version: 1,
        },
        {
          id: "other-patient",
          patientId: "patient-nour",
          encounterId: "encounter-one",
          status: "approved",
          payload: { ...payload, patientId: "patient-nour" },
          signature: "signed",
          approvedAt: "2026-08-29T10:10:00Z",
          version: 1,
          doctorNameAr: "د. فريدة حسن",
          doctorNameEn: "Dr Farida Hassan",
        },
        {
          id: "approved",
          patientId: "patient-amal",
          encounterId: "encounter-one",
          status: "approved",
          payload,
          signature: "signed",
          approvedAt: "2026-08-29T10:10:00Z",
          version: 2,
          doctorNameAr: "د. فريدة حسن",
          doctorNameEn: "Dr Farida Hassan",
        },
      ],
      "patient-amal",
    );

    expect(visible.map((record) => record.id)).toEqual(["approved"]);
    expect(visible.some((record) => record.status !== "approved")).toBe(false);
  });
});
