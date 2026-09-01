import { describe, expect, it } from "vitest";
import { prescriptionExtractionFixture } from "@/mocks/fixtures";
import { prescriptionExtractionSchema } from "./prescription";

describe("prescription extraction contract", () => {
  it("accepts the exact payload and rejects additional fields", () => {
    expect(prescriptionExtractionSchema.parse(prescriptionExtractionFixture)).toEqual(
      prescriptionExtractionFixture,
    );
    expect(
      prescriptionExtractionSchema.safeParse({
        ...prescriptionExtractionFixture,
        clinicalTruth: true,
      }).success,
    ).toBe(false);
    expect(
      prescriptionExtractionSchema.safeParse({
        ...prescriptionExtractionFixture,
        medications: [{ ...prescriptionExtractionFixture.medications[0], acknowledged: true }],
      }).success,
    ).toBe(false);
  });
});
