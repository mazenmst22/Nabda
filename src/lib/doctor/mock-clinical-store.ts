import type {
  ConsentRecord,
  Encounter,
  Job,
  Prescription,
  PrescriptionExtraction,
  Transcript,
} from "@/lib/schemas";
import { AUDIO_CONSENT_TEXT_VERSION, doctorPatient, makeConsent } from "./data";
import {
  approvePrescription,
  createReviewedDraft,
  createTranscriptVersion,
  initialReviewPrescription,
  initialTranscriptHistory,
  REVIEW_ENCOUNTER_ID,
} from "./clinical-review";

type UploadedAudio = { audioKey: string; bytes: number; idempotencyKey: string };
type ClinicalStore = {
  consents: Map<string, ConsentRecord>;
  encounters: Map<string, Encounter>;
  uploads: Map<string, UploadedAudio>;
  jobsByAudioKey: Map<string, Job>;
  transcriptHistory: Map<string, Transcript[]>;
  prescriptionHistory: Map<string, Prescription[]>;
  extractionMode: "valid" | "invalid";
};

declare global {
  var __nabdaClinicalStore: ClinicalStore | undefined;
}

function makeStore(): ClinicalStore {
  return {
    consents: new Map(),
    encounters: new Map(),
    uploads: new Map(),
    jobsByAudioKey: new Map(),
    transcriptHistory: new Map([[REVIEW_ENCOUNTER_ID, structuredClone(initialTranscriptHistory)]]),
    prescriptionHistory: new Map([
      [REVIEW_ENCOUNTER_ID, [structuredClone(initialReviewPrescription)]],
    ]),
    extractionMode: "valid",
  };
}

export function clinicalStore() {
  globalThis.__nabdaClinicalStore ??= makeStore();
  return globalThis.__nabdaClinicalStore;
}

export function resetClinicalStore() {
  globalThis.__nabdaClinicalStore = makeStore();
}

export function createEncounter(): Encounter {
  const encounter: Encounter = {
    id: `encounter-${crypto.randomUUID()}`,
    patientId: doctorPatient.id,
    appointmentId: "appointment-doctor-amal",
    doctorId: "dr-mariam-fouad",
    clinicId: "clinic-maadi",
    status: "created",
    startedAt: new Date().toISOString(),
    version: 1,
  };
  clinicalStore().encounters.set(encounter.id, encounter);
  return encounter;
}

export function grantConsent(encounterId: string) {
  const consent = makeConsent(encounterId);
  clinicalStore().consents.set(consent.id, consent);
  return consent;
}

export function revokeConsent(id: string) {
  const consent = clinicalStore().consents.get(id);
  if (!consent) return undefined;
  const revoked: ConsentRecord = {
    ...consent,
    status: "revoked",
    revokedAt: new Date().toISOString(),
    version: consent.version + 1,
  };
  clinicalStore().consents.set(id, revoked);
  return revoked;
}

export function consentForEncounter(encounterId: string) {
  return [...clinicalStore().consents.values()].find(
    (consent) => consent.encounterId === encounterId,
  );
}

export function hasServerAudioConsent(encounterId: string) {
  const consent = consentForEncounter(encounterId);
  return Boolean(
    consent &&
    consent.patientId === doctorPatient.id &&
    consent.purpose === "encounter_audio" &&
    consent.textVersion === AUDIO_CONSENT_TEXT_VERSION &&
    consent.status === "granted" &&
    !consent.revokedAt,
  );
}

export function confirmAudioUpload(audioKey: string, bytes: number, idempotencyKey: string) {
  const existing = clinicalStore().uploads.get(audioKey);
  if (existing) return existing;
  const upload = { audioKey, bytes, idempotencyKey };
  clinicalStore().uploads.set(audioKey, upload);
  return upload;
}

export function hasAudioUpload(audioKey: string) {
  return clinicalStore().uploads.has(audioKey);
}

export function completeAudio(audioKey: string) {
  const existing = clinicalStore().jobsByAudioKey.get(audioKey);
  if (existing) return existing;
  const job: Job = {
    jobId: `job-${crypto.randomUUID()}`,
    kind: "transcription",
    state: "queued",
    progress: 0,
    attempts: 1,
  };
  clinicalStore().jobsByAudioKey.set(audioKey, job);
  return job;
}

export function getAuthoritativeJob(jobId: string) {
  const job = [...clinicalStore().jobsByAudioKey.values()].find(
    (candidate) => candidate.jobId === jobId,
  );
  return job ? { ...job, state: "succeeded" as const, progress: 100 } : undefined;
}

export function getTranscriptHistory(encounterId: string) {
  return clinicalStore().transcriptHistory.get(encounterId) ?? [];
}

export function getCurrentTranscript(encounterId: string) {
  return getTranscriptHistory(encounterId).at(-1);
}

export function saveTranscriptVersion(
  encounterId: string,
  version: number,
  segments: Transcript["segments"],
) {
  const history = getTranscriptHistory(encounterId);
  const current = history.at(-1);
  if (!current || current.version !== version) return undefined;
  const next = createTranscriptVersion(current, segments);
  clinicalStore().transcriptHistory.set(encounterId, [...history, next]);
  return next;
}

export function getPrescriptionHistory(encounterId: string) {
  return clinicalStore().prescriptionHistory.get(encounterId) ?? [];
}

export function saveReviewedPrescription(
  encounterId: string,
  payload: PrescriptionExtraction,
  acknowledgedIds: Set<string>,
) {
  const history = getPrescriptionHistory(encounterId);
  const current = history.at(-1);
  if (!current || current.status !== "draft") return undefined;
  const protectedPayload: PrescriptionExtraction = {
    ...payload,
    medications: payload.medications.map((medication, index) => ({
      ...medication,
      rawText: current.payload.medications[index]?.rawText ?? medication.rawText,
    })),
  };
  const next = createReviewedDraft(
    current,
    protectedPayload,
    acknowledgedIds,
    new Date().toISOString(),
  );
  clinicalStore().prescriptionHistory.set(encounterId, [...history, next]);
  return next;
}

export function approveCurrentPrescription(id: string) {
  for (const [encounterId, history] of clinicalStore().prescriptionHistory) {
    const current = history.at(-1);
    if (!current || current.id !== id) continue;
    const approved = approvePrescription(current, new Date().toISOString());
    clinicalStore().prescriptionHistory.set(encounterId, [...history, approved]);
    return approved;
  }
  return undefined;
}

export function setExtractionMode(mode: "valid" | "invalid") {
  clinicalStore().extractionMode = mode;
}

export function startReExtraction(encounterId: string): Job {
  clinicalStore().extractionMode = "valid";
  return {
    jobId: `job-extraction-${encounterId}`,
    kind: "extraction",
    state: "succeeded",
    progress: 100,
    attempts: 2,
  };
}
