import { describe, expect, it } from "vitest";
import type { ConsentRecord } from "@/lib/schemas";
import {
  captureReducer,
  captureStates,
  hasCurrentAudioConsent,
  type CaptureAction,
  type CaptureState,
} from "./audio-capture-machine";

function follow(initial: CaptureState, actions: CaptureAction[], reached: Set<CaptureState>) {
  return actions.reduce((state, action) => {
    const next = captureReducer(state, action);
    reached.add(next);
    return next;
  }, initial);
}

describe("AudioCapture state machine", () => {
  it("makes all ten declared states reachable", () => {
    const reached = new Set<CaptureState>(["idle"]);
    follow("idle", [{ type: "START", consentValid: false }], reached);
    follow("idle", [{ type: "START", consentValid: true }, { type: "PERMISSION_FAILED" }], reached);
    follow(
      "idle",
      [
        { type: "START", consentValid: true },
        { type: "PERMISSION_GRANTED" },
        { type: "PAUSE" },
        { type: "RESUME" },
        { type: "STOP" },
        { type: "RECORDER_STOPPED" },
        { type: "UPLOAD_FAILED" },
        { type: "RETRY_UPLOAD" },
        { type: "UPLOAD_CONFIRMED" },
      ],
      reached,
    );

    expect([...reached].sort()).toEqual([...captureStates].sort());
  });

  it("cannot leave the consent-required boundary without a current exact consent", () => {
    const granted: ConsentRecord = {
      id: "consent-one",
      patientId: "patient-one",
      encounterId: "encounter-one",
      purpose: "encounter_audio",
      textVersion: "audio-v3",
      status: "granted",
      grantedAt: "2026-08-30T08:00:00Z",
      version: 1,
    };
    const input = {
      patientId: "patient-one",
      encounterId: "encounter-one",
      textVersion: "audio-v3",
    };

    expect(hasCurrentAudioConsent({ ...input, consent: null })).toBe(false);
    expect(
      hasCurrentAudioConsent({ ...input, consent: { ...granted, textVersion: "audio-v2" } }),
    ).toBe(false);
    expect(
      hasCurrentAudioConsent({
        ...input,
        consent: {
          ...granted,
          status: "revoked",
          revokedAt: "2026-08-30T08:05:00Z",
        },
      }),
    ).toBe(false);
    expect(hasCurrentAudioConsent({ ...input, consent: granted })).toBe(true);
    expect(captureReducer("idle", { type: "START", consentValid: false })).toBe("consent-required");
    expect(captureReducer("consent-required", { type: "START", consentValid: false })).toBe(
      "consent-required",
    );
  });
});
