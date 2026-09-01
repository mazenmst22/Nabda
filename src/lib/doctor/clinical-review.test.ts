import { describe, expect, it } from "vitest";
import {
  approvePrescription,
  canApprovePrescription,
  createTranscriptVersion,
  initialReviewPrescription,
  initialTranscriptHistory,
  reviewFieldId,
  unresolvedLowConfidenceFields,
} from "./clinical-review";
import {
  getPrescriptionHistory,
  resetClinicalStore,
  saveReviewedPrescription,
} from "./mock-clinical-store";

describe("clinical review boundaries", () => {
  it("creates a transcript version without mutating its source", () => {
    const source = structuredClone(initialTranscriptHistory.at(-1)!);
    const changed = source.segments.map((segment, index) =>
      index === 0 ? { ...segment, text: `${segment.text} مراجعة.` } : segment,
    );
    const next = createTranscriptVersion(source, changed);

    expect(source.version).toBe(2);
    expect(source.segments[0]?.text).not.toContain("مراجعة");
    expect(next.version).toBe(3);
    expect(next.segments[0]?.edited).toBe(true);
  });

  it("blocks low confidence until each field is acknowledged", () => {
    const draft = structuredClone(initialReviewPrescription);
    expect(unresolvedLowConfidenceFields(draft).map((field) => field.field)).toEqual([
      "dose",
      "duration",
    ]);
    expect(canApprovePrescription(draft)).toBe(false);
    expect(() => approvePrescription(draft, "2026-08-30T10:00:00Z")).toThrow(
      "LOW_CONFIDENCE_ACKNOWLEDGEMENT_REQUIRED",
    );
  });

  it("preserves rawText and produces attributable edited and approved versions", () => {
    resetClinicalStore();
    const source = structuredClone(initialReviewPrescription);
    const payload = structuredClone(source.payload);
    payload.medications[0]!.rawText = "attempted source replacement";
    payload.medications[0]!.dose = 2.5;
    const acknowledged = new Set([reviewFieldId(0, "dose"), reviewFieldId(0, "duration")]);
    const reviewed = saveReviewedPrescription(source.encounterId, payload, acknowledged)!;

    expect(reviewed.version).toBe(2);
    expect(reviewed.payload.medications[0]?.rawText).toBe(source.payload.medications[0]?.rawText);
    expect(reviewed.review?.fields.find((field) => field.field === "dose")).toMatchObject({
      edited: true,
      editedBy: "Dr Mariam Fouad",
      acknowledged: true,
    });

    const approved = approvePrescription(reviewed, "2026-08-30T10:05:00Z");
    expect(approved).toMatchObject({
      status: "approved",
      version: 3,
      approvedAt: "2026-08-30T10:05:00Z",
      review: { approvedBy: "Dr Mariam Fouad" },
    });
    expect(getPrescriptionHistory(source.encounterId)).toHaveLength(2);
  });
});
