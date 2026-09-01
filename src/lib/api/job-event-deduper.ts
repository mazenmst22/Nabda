import type { Job } from "@/lib/schemas";

export class JobEventDeduper {
  private readonly latestSequence = new Map<string, number>();

  shouldApply(jobId: string, sequence: number) {
    const latest = this.latestSequence.get(jobId) ?? -1;
    if (sequence <= latest) return false;
    this.latestSequence.set(jobId, sequence);
    return true;
  }

  acceptRestSnapshot(job: Job) {
    return job;
  }

  reset(jobId?: string) {
    if (jobId) this.latestSequence.delete(jobId);
    else this.latestSequence.clear();
  }
}
