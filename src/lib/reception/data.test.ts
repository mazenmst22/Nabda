import { beforeEach, describe, expect, it } from "vitest";
import {
  getReceptionAppointment,
  moveReceptionAppointment,
  resetReceptionStore,
  simulateReceptionConflict,
} from "./data";

describe("reception schedule concurrency", () => {
  beforeEach(resetReceptionStore);

  it("rejects a stale move without overwriting the concurrent edit", () => {
    const id = "reception-appointment-amal";
    const original = getReceptionAppointment(id);
    expect(original).toBeDefined();
    const concurrentlyEdited = simulateReceptionConflict(id);
    const result = moveReceptionAppointment(id, "2026-08-29T09:30:00.000Z", original?.version ?? 0);

    expect(result.kind).toBe("conflict");
    expect(getReceptionAppointment(id)).toEqual(concurrentlyEdited);
  });
});
