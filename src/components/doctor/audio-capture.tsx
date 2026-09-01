"use client";

import { useEffect, useMemo, useReducer, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Button, Icon, Ltr, StatusPill } from "@/components/ui";
import { ApiClient, createApiAction, type ApiAction } from "@/lib/api/client";
import { ApiRequestError } from "@/lib/api/errors";
import { useNumerals } from "@/lib/i18n/numerals";
import { audioUploadSchema, jobSchema, type ConsentRecord, type Job } from "@/lib/schemas";
import { captureReducer, hasCurrentAudioConsent, type CaptureState } from "./audio-capture-machine";
import { JobProgress } from "./job-progress";

type PendingUpload = {
  blob?: Blob;
  audioKey?: string;
  uploadUrl?: string;
  uploaded: boolean;
  sha256: string;
  durationMs: number;
  action: ApiAction;
};

function formatDuration(milliseconds: number) {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  return `${String(minutes).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}

async function digestBlob(blob: Blob) {
  const digest = await crypto.subtle.digest("SHA-256", await blob.arrayBuffer());
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function uploadBlob({
  url,
  blob,
  idempotencyKey,
  onProgress,
  onRequest,
}: {
  url: string;
  blob: Blob;
  idempotencyKey: string;
  onProgress: (progress: number) => void;
  onRequest: (request: XMLHttpRequest | null) => void;
}) {
  return new Promise<void>((resolve, reject) => {
    const request = new XMLHttpRequest();
    onRequest(request);
    request.open("PUT", url);
    request.setRequestHeader("Content-Type", blob.type || "audio/webm");
    request.setRequestHeader("Idempotency-Key", idempotencyKey);
    request.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable) onProgress(Math.round((event.loaded / event.total) * 100));
    });
    request.addEventListener("load", () => {
      onRequest(null);
      if (request.status >= 200 && request.status < 300) resolve();
      else reject(new Error(`Audio upload failed with ${request.status}`));
    });
    request.addEventListener("error", () => {
      onRequest(null);
      reject(new Error("Audio upload failed"));
    });
    request.addEventListener("abort", () => {
      onRequest(null);
      reject(new DOMException("Upload aborted", "AbortError"));
    });
    request.send(blob);
  });
}

export function AudioCapture({
  locale,
  patientId,
  encounterId,
  consent,
  requiredTextVersion,
}: {
  locale: "ar" | "en";
  patientId: string;
  encounterId: string;
  consent: ConsentRecord | null;
  requiredTextVersion: string;
}) {
  const t = useTranslations("doctor.audio");
  const numerals = useNumerals();
  const [state, dispatch] = useReducer(captureReducer, "idle");
  const [durationMs, setDurationMs] = useState(0);
  const [waveform, setWaveform] = useState(() => Array.from({ length: 24 }, () => 8));
  const [uploadProgress, setUploadProgress] = useState(0);
  const [browserAudioHeld, setBrowserAudioHeld] = useState(false);
  const [job, setJob] = useState<Job | null>(null);
  const [deviceMessage, setDeviceMessage] = useState("");
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const pendingRef = useRef<PendingUpload | null>(null);
  const xhrRef = useRef<XMLHttpRequest | null>(null);
  const analyserFrame = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const revokedRef = useRef(false);
  const durationRef = useRef(0);
  const stateRef = useRef<CaptureState>(state);

  const api = useMemo(
    () =>
      new ApiClient({
        getAccessToken: () => "doctor-session",
        getClinicId: () => "clinic-maadi",
        getLocale: () => locale,
      }),
    [locale],
  );

  const validConsent = hasCurrentAudioConsent({
    consent,
    patientId,
    encounterId,
    textVersion: requiredTextVersion,
  });

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    durationRef.current = durationMs;
  }, [durationMs]);

  useEffect(() => {
    const current = stateRef.current;
    if (
      validConsent ||
      !["requesting-permission", "recording", "paused", "stopping", "uploading"].includes(current)
    )
      return;
    revokedRef.current = true;
    xhrRef.current?.abort();
    recorderRef.current?.stop();
    for (const track of streamRef.current?.getTracks() ?? []) track.stop();
    streamRef.current = null;
    chunksRef.current = [];
    pendingRef.current = null;
    setBrowserAudioHeld(false);
    dispatch({ type: "CONSENT_REVOKED" });
  }, [consent, validConsent]);

  useEffect(() => {
    if (state !== "recording") return;
    const started = Date.now() - durationRef.current;
    const timer = window.setInterval(() => setDurationMs(Date.now() - started), 250);
    return () => window.clearInterval(timer);
  }, [state]);

  useEffect(
    () => () => {
      xhrRef.current?.abort();
      if (recorderRef.current?.state !== "inactive") recorderRef.current?.stop();
      for (const track of streamRef.current?.getTracks() ?? []) track.stop();
      if (analyserFrame.current !== null) cancelAnimationFrame(analyserFrame.current);
      void audioContextRef.current?.close();
      chunksRef.current = [];
      pendingRef.current = null;
    },
    [],
  );

  function stopWaveform() {
    if (analyserFrame.current !== null) cancelAnimationFrame(analyserFrame.current);
    analyserFrame.current = null;
    void audioContextRef.current?.close();
    audioContextRef.current = null;
  }

  function startWaveform(stream: MediaStream) {
    const AudioContextConstructor = window.AudioContext;
    if (!AudioContextConstructor) return;
    const context = new AudioContextConstructor();
    const analyser = context.createAnalyser();
    analyser.fftSize = 64;
    context.createMediaStreamSource(stream).connect(analyser);
    const values = new Uint8Array(analyser.frequencyBinCount);
    audioContextRef.current = context;
    const draw = () => {
      analyser.getByteFrequencyData(values);
      setWaveform(
        Array.from({ length: 24 }, (_, index) =>
          Math.max(7, Math.round(((values[index] ?? 0) / 255) * 54)),
        ),
      );
      analyserFrame.current = requestAnimationFrame(draw);
    };
    draw();
  }

  async function startCapture() {
    const currentConsentValid = hasCurrentAudioConsent({
      consent,
      patientId,
      encounterId,
      textVersion: requiredTextVersion,
    });
    dispatch({ type: "START", consentValid: currentConsentValid });
    if (!currentConsentValid) return;
    revokedRef.current = false;
    setDeviceMessage("");
    setJob(null);
    setDurationMs(0);
    chunksRef.current = [];
    pendingRef.current = null;
    setBrowserAudioHeld(false);
    try {
      if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined")
        throw new DOMException("No microphone is available", "NotFoundError");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (
        revokedRef.current ||
        !hasCurrentAudioConsent({
          consent,
          patientId,
          encounterId,
          textVersion: requiredTextVersion,
        })
      ) {
        for (const track of stream.getTracks()) track.stop();
        dispatch({ type: "CONSENT_REVOKED" });
        return;
      }
      streamRef.current = stream;
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";
      const recorder = new MediaRecorder(stream, { mimeType });
      recorderRef.current = recorder;
      recorder.addEventListener("dataavailable", (event) => {
        if (event.data.size > 0 && !revokedRef.current) {
          chunksRef.current.push(event.data);
          setBrowserAudioHeld(true);
        }
      });
      recorder.addEventListener("stop", () => {
        stopWaveform();
        for (const track of stream.getTracks()) track.stop();
        streamRef.current = null;
        if (revokedRef.current) {
          chunksRef.current = [];
          setBrowserAudioHeld(false);
          return;
        }
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType });
        chunksRef.current = [];
        dispatch({ type: "RECORDER_STOPPED" });
        void prepareAndUpload(blob);
      });
      startWaveform(stream);
      recorder.start(250);
      dispatch({ type: "PERMISSION_GRANTED" });
    } catch (error) {
      setDeviceMessage(
        error instanceof DOMException && error.name === "NotAllowedError"
          ? t("permissionBlocked")
          : t("microphoneMissing"),
      );
      dispatch({ type: "PERMISSION_FAILED" });
    }
  }

  function pauseCapture() {
    recorderRef.current?.pause();
    dispatch({ type: "PAUSE" });
  }

  function resumeCapture() {
    recorderRef.current?.resume();
    dispatch({ type: "RESUME" });
  }

  function stopCapture() {
    if (!recorderRef.current || recorderRef.current.state === "inactive") return;
    dispatch({ type: "STOP" });
    recorderRef.current.stop();
  }

  async function prepareAndUpload(blob: Blob) {
    const pending: PendingUpload = {
      blob,
      uploaded: false,
      sha256: await digestBlob(blob),
      durationMs: durationRef.current,
      action: createApiAction(),
    };
    setBrowserAudioHeld(true);
    pendingRef.current = pending;
    await uploadPending(pending);
  }

  async function uploadPending(pending = pendingRef.current) {
    if (!pending) return;
    setUploadProgress(pending.uploaded ? 100 : 0);
    try {
      if (!pending.audioKey || !pending.uploadUrl) {
        const signed = await api.post(
          `/v1/encounters/${encounterId}/audio/upload-url`,
          audioUploadSchema,
          { contentType: pending.blob?.type ?? "audio/webm", bytes: pending.blob?.size ?? 0 },
          { action: pending.action, retries: 0 },
        );
        pending.audioKey = signed.audioKey;
        pending.uploadUrl = signed.uploadUrl;
      }
      if (!pending.uploaded) {
        if (!pending.blob) throw new Error("Audio data is no longer available");
        await uploadBlob({
          url: pending.uploadUrl,
          blob: pending.blob,
          idempotencyKey: pending.action.idempotencyKey,
          onProgress: setUploadProgress,
          onRequest: (request) => {
            xhrRef.current = request;
          },
        });
        pending.uploaded = true;
        pending.blob = undefined;
        chunksRef.current = [];
        setBrowserAudioHeld(false);
        setUploadProgress(100);
      }
      const completed = await api.post(
        `/v1/encounters/${encounterId}/audio/complete`,
        jobSchema,
        {
          audioKey: pending.audioKey,
          sha256: pending.sha256,
          durationMs: pending.durationMs,
        },
        { action: pending.action, retries: 1 },
      );
      pendingRef.current = null;
      setJob(completed);
      dispatch({ type: "UPLOAD_CONFIRMED" });
    } catch (error) {
      if (
        error instanceof ApiRequestError &&
        (error.envelope.code === "CONSENT_REQUIRED" || error.envelope.code === "CONSENT_REVOKED")
      ) {
        pendingRef.current = null;
        setBrowserAudioHeld(false);
        dispatch({ type: "CONSENT_REVOKED" });
        return;
      }
      if (error instanceof DOMException && error.name === "AbortError" && revokedRef.current)
        return;
      dispatch({ type: "UPLOAD_FAILED" });
    }
  }

  function retryUpload() {
    dispatch({ type: "RETRY_UPLOAD" });
    void uploadPending();
  }

  const statusTone =
    state === "done"
      ? "completed"
      : state === "device-error" || state === "upload-failed-retryable"
        ? "cancelled"
        : state === "consent-required"
          ? "held"
          : state === "recording" || state === "paused"
            ? "in-progress"
            : "booked";

  return (
    <section
      className={`audio-capture is-${state}`}
      data-capture-state={state}
      data-browser-audio-held={browserAudioHeld ? "true" : "false"}
      aria-labelledby="audio-capture-title"
    >
      <header>
        <div>
          <p className="type-label">{t("eyebrow")}</p>
          <h2 id="audio-capture-title">{t("title")}</h2>
        </div>
        <StatusPill status={statusTone} label={t(`states.${state}`)} />
      </header>

      <div className="audio-waveform" role="img" aria-label={t("waveformLabel")}>
        {waveform.map((height, index) => (
          <span key={index} style={{ blockSize: `${height}px` }} />
        ))}
      </div>
      <div className="audio-capture-clock">
        <span className={state === "recording" ? "is-live" : undefined} aria-hidden="true" />
        <Ltr>{numerals(formatDuration(durationMs))}</Ltr>
        <small>{t("browserOnlyUntilUpload")}</small>
      </div>

      {state === "consent-required" ? (
        <div className="audio-capture-notice" role="alert">
          <Icon name="shield" />
          <div>
            <strong>{t("consentRequiredTitle")}</strong>
            <p>{t("consentRequiredBody", { version: requiredTextVersion })}</p>
          </div>
        </div>
      ) : null}
      {state === "device-error" ? (
        <div className="audio-capture-notice is-error" role="alert">
          <Icon name="alert" />
          <div>
            <strong>{t("deviceErrorTitle")}</strong>
            <p>{deviceMessage}</p>
          </div>
        </div>
      ) : null}
      {state === "upload-failed-retryable" ? (
        <div className="audio-capture-notice is-error" role="alert">
          <Icon name="alert" />
          <div>
            <strong>{t("uploadFailedTitle")}</strong>
            <p>{t(browserAudioHeld ? "uploadFailedBody" : "completionFailedBody")}</p>
          </div>
          <Button variant="secondary" onClick={retryUpload}>
            {t("retrySameAudio")}
          </Button>
        </div>
      ) : null}

      {state === "uploading" ? (
        <div className="audio-upload-progress">
          <label htmlFor="audio-upload-progress">
            {t("uploadingProgress", { progress: numerals(uploadProgress) })}
          </label>
          <progress id="audio-upload-progress" max={100} value={uploadProgress} />
        </div>
      ) : null}

      <div className="audio-capture-actions">
        {["idle", "consent-required", "device-error"].includes(state) ? (
          <Button leadingIcon="dot" onClick={() => void startCapture()}>
            {t("start")}
          </Button>
        ) : null}
        {state === "requesting-permission" ? (
          <Button loading loadingLabel={t("requestingPermission")}>
            {t("requestingPermission")}
          </Button>
        ) : null}
        {state === "recording" ? (
          <Button variant="secondary" leadingIcon="half" onClick={pauseCapture}>
            {t("pause")}
          </Button>
        ) : null}
        {state === "paused" ? (
          <Button variant="secondary" leadingIcon="arrow" onClick={resumeCapture}>
            {t("resume")}
          </Button>
        ) : null}
        {state === "recording" || state === "paused" ? (
          <Button variant="danger" leadingIcon="minus" onClick={stopCapture}>
            {t("stopAndUpload")}
          </Button>
        ) : null}
        {state === "stopping" ? (
          <Button loading loadingLabel={t("stopping")}>
            {t("stopping")}
          </Button>
        ) : null}
        {state === "done" ? (
          <Button
            variant="secondary"
            leadingIcon="check"
            onClick={() => dispatch({ type: "RESET" })}
          >
            {t("newRecording")}
          </Button>
        ) : null}
      </div>

      <p className="audio-discard-policy">
        <Icon name="shield" size={16} />
        {state === "done" ? t("audioDiscarded") : t("discardPolicy")}
      </p>
      {job ? <JobProgress locale={locale} initialJob={job} /> : null}
    </section>
  );
}
