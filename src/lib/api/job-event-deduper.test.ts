import { describe, expect, it } from "vitest";
import { jobFixture } from "@/mocks/fixtures";
import { JobEventDeduper } from "./job-event-deduper";

describe("JobEventDeduper", () => {
  it("drops replayed hub events by job and sequence while keeping REST authoritative", () => {
    const deduper = new JobEventDeduper();

    expect(deduper.shouldApply("job-one", 4)).toBe(true);
    expect(deduper.shouldApply("job-one", 4)).toBe(false);
    expect(deduper.shouldApply("job-one", 3)).toBe(false);
    expect(deduper.shouldApply("job-one", 5)).toBe(true);
    expect(deduper.shouldApply("job-two", 1)).toBe(true);
    expect(deduper.acceptRestSnapshot(jobFixture)).toBe(jobFixture);
  });
});
