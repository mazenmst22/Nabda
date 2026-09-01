"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Ltr, StatusPill } from "@/components/ui";
import { ApiClient, createApiAction } from "@/lib/api/client";
import { JobProgressStore, MockSignalRJobConnection } from "@/lib/doctor/job-progress";
import { jobSchema, type Job } from "@/lib/schemas";

export function JobProgress({ locale, initialJob }: { locale: "ar" | "en"; initialJob: Job }) {
  const t = useTranslations("doctor.audio");
  const storeRef = useRef(new JobProgressStore());
  const [job, setJob] = useState(initialJob);
  const [reconnects, setReconnects] = useState(0);
  const [source, setSource] = useState<"hub" | "rest">("hub");

  useEffect(() => {
    const store = storeRef.current;
    store.applyRest(initialJob);
    const api = new ApiClient({
      getAccessToken: () => "doctor-session",
      getClinicId: () => "clinic-maadi",
      getLocale: () => locale,
    });
    const connection = new MockSignalRJobConnection(
      initialJob,
      (event) => {
        if (!store.applyHub(event)) return;
        const snapshot = store.snapshot(initialJob.jobId);
        if (snapshot) {
          setSource("hub");
          setJob(snapshot);
        }
      },
      () => setReconnects((count) => count + 1),
    );
    connection.start();
    const restTimer = window.setTimeout(async () => {
      const authoritative = await api.get(`/v1/jobs/${initialJob.jobId}`, jobSchema, {
        action: createApiAction(),
        retries: 0,
      });
      store.applyRest(authoritative);
      setSource("rest");
      setJob(authoritative);
    }, 1_050);
    return () => {
      connection.stop();
      window.clearTimeout(restTimer);
    };
  }, [initialJob, locale]);

  const complete = job.state === "succeeded";
  return (
    <section className="doctor-job-progress" aria-labelledby="doctor-job-title">
      <div>
        <p className="type-label">{t("processingLabel")}</p>
        <h3 id="doctor-job-title">{t("processingTitle")}</h3>
      </div>
      <StatusPill
        status={complete ? "completed" : "in-progress"}
        label={complete ? t("jobComplete") : t("jobRunning")}
      />
      <progress max={100} value={job.progress} aria-label={t("jobProgress")} />
      <div className="doctor-job-meta">
        <Ltr>{job.jobId}</Ltr>
        <Ltr>{job.progress}%</Ltr>
        <span>{source === "rest" ? t("restAuthoritative") : t("signalRLive")}</span>
        {reconnects ? <span>{t("reconnected", { count: reconnects })}</span> : null}
      </div>
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {complete ? t("jobCompleteAnnouncement") : ""}
      </div>
    </section>
  );
}
