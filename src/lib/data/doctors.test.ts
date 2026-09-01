import { describe, expect, it } from "vitest";
import { doctors } from "./doctors";

describe("doctor fixtures", () => {
  it("keeps fees and live slots explicit for every doctor", () => {
    expect(doctors.length).toBeGreaterThanOrEqual(3);
    for (const doctor of doctors) {
      expect(doctor.fee).toBeGreaterThanOrEqual(250);
      expect(doctor.fee).toBeLessThanOrEqual(900);
      expect(doctor.nextSlot).toMatch(/^\d{2}:\d{2}$/);
    }
  });
});
