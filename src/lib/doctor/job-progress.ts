import type { Job } from "@/lib/schemas";
import { JobEventDeduper } from "@/lib/api/job-event-deduper";

export type JobHubEvent = { job: Job; sequence: number };

export class JobProgressStore {
  private readonly deduper = new JobEventDeduper();
  private snapshots = new Map<string, Job>();
  private acceptedHubEvents = new Map<string, number>();

  applyHub(event: JobHubEvent) {
    if (!this.deduper.shouldApply(event.job.jobId, event.sequence)) return false;
    this.snapshots.set(event.job.jobId, event.job);
    this.acceptedHubEvents.set(
      event.job.jobId,
      (this.acceptedHubEvents.get(event.job.jobId) ?? 0) + 1,
    );
    return true;
  }

  applyRest(job: Job) {
    this.snapshots.set(job.jobId, this.deduper.acceptRestSnapshot(job));
    return job;
  }

  snapshot(jobId: string) {
    return this.snapshots.get(jobId);
  }

  acceptedCount(jobId: string) {
    return this.acceptedHubEvents.get(jobId) ?? 0;
  }
}

export class MockSignalRJobConnection {
  private timers: number[] = [];

  constructor(
    private readonly job: Job,
    private readonly onEvent: (event: JobHubEvent) => void,
    private readonly onReconnect: () => void,
  ) {}

  start() {
    const steps = [
      { sequence: 1, progress: 18 },
      { sequence: 2, progress: 54 },
      { sequence: 3, progress: 82 },
    ];
    for (const [index, step] of steps.entries()) {
      this.timers.push(
        window.setTimeout(
          () => {
            this.onEvent({
              sequence: step.sequence,
              job: { ...this.job, state: "running", progress: step.progress },
            });
            if (step.sequence === 2) {
              this.onReconnect();
              this.onEvent({
                sequence: 1,
                job: { ...this.job, state: "running", progress: 18 },
              });
              this.onEvent({
                sequence: 2,
                job: { ...this.job, state: "running", progress: 54 },
              });
            }
          },
          250 * (index + 1),
        ),
      );
    }
  }

  stop() {
    for (const timer of this.timers) window.clearTimeout(timer);
    this.timers = [];
  }
}
