import type { ConsentRecord } from "@/lib/schemas";

export const captureStates = [
  "idle",
  "requesting-permission",
  "consent-required",
  "recording",
  "paused",
  "stopping",
  "uploading",
  "upload-failed-retryable",
  "done",
  "device-error",
] as const;

export type CaptureState = (typeof captureStates)[number];

export type CaptureAction =
  | { type: "START"; consentValid: boolean }
  | { type: "PERMISSION_GRANTED" }
  | { type: "PERMISSION_FAILED" }
  | { type: "PAUSE" }
  | { type: "RESUME" }
  | { type: "STOP" }
  | { type: "RECORDER_STOPPED" }
  | { type: "UPLOAD_FAILED" }
  | { type: "RETRY_UPLOAD" }
  | { type: "UPLOAD_CONFIRMED" }
  | { type: "CONSENT_REVOKED" }
  | { type: "RESET" };

export function captureReducer(state: CaptureState, action: CaptureAction): CaptureState {
  if (action.type === "CONSENT_REVOKED") return "consent-required";
  if (action.type === "RESET") return "idle";
  switch (state) {
    case "idle":
    case "consent-required":
    case "device-error":
      return action.type === "START"
        ? action.consentValid
          ? "requesting-permission"
          : "consent-required"
        : state;
    case "requesting-permission":
      if (action.type === "PERMISSION_GRANTED") return "recording";
      if (action.type === "PERMISSION_FAILED") return "device-error";
      return state;
    case "recording":
      if (action.type === "PAUSE") return "paused";
      if (action.type === "STOP") return "stopping";
      return state;
    case "paused":
      if (action.type === "RESUME") return "recording";
      if (action.type === "STOP") return "stopping";
      return state;
    case "stopping":
      return action.type === "RECORDER_STOPPED" ? "uploading" : state;
    case "uploading":
      if (action.type === "UPLOAD_FAILED") return "upload-failed-retryable";
      if (action.type === "UPLOAD_CONFIRMED") return "done";
      return state;
    case "upload-failed-retryable":
      return action.type === "RETRY_UPLOAD" ? "uploading" : state;
    case "done":
      return state;
  }
}

export function hasCurrentAudioConsent({
  consent,
  patientId,
  encounterId,
  textVersion,
}: {
  consent: ConsentRecord | null;
  patientId: string;
  encounterId: string;
  textVersion: string;
}) {
  return Boolean(
    consent &&
    consent.patientId === patientId &&
    consent.encounterId === encounterId &&
    consent.purpose === "encounter_audio" &&
    consent.textVersion === textVersion &&
    consent.status === "granted" &&
    !consent.revokedAt,
  );
}
