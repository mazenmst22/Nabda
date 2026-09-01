import { describe, expect, it } from "vitest";
import type { Job } from "@/lib/schemas";
import { JobProgressStore } from "./job-progress";

function job(progress: number): Job {
  return {
    jobId: "job-one",
    kind: "transcription",
    state: progress === 100 ? "succeeded" : "running",
    progress,
    attempts: 1,
  };
}

describe("doctor job progress", () => {
  it("does not double-count replayed progress after reconnect and keeps REST authoritative", () => {
    const store = new JobProgressStore();
    expect(store.applyHub({ job: job(18), sequence: 1 })).toBe(true);
    expect(store.applyHub({ job: job(54), sequence: 2 })).toBe(true);
    expect(store.applyHub({ job: job(18), sequence: 1 })).toBe(false);
    expect(store.applyHub({ job: job(54), sequence: 2 })).toBe(false);
    expect(store.applyHub({ job: job(82), sequence: 3 })).toBe(true);
    expect(store.acceptedCount("job-one")).toBe(3);

    store.applyRest(job(100));
    expect(store.snapshot("job-one")).toMatchObject({ progress: 100, state: "succeeded" });
  });
});
