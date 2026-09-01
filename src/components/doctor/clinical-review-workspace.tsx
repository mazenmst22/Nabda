"use client";

import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  Badge,
  Button,
  ConfirmDialog,
  Icon,
  Input,
  Ltr,
  StatusPill,
  Textarea,
} from "@/components/ui";
import { ApiClient, createApiAction } from "@/lib/api/client";
import { ApiRequestError } from "@/lib/api/errors";
import {
  CLINICIAN_ACTOR_NAME,
  initialTranscriptHistory,
  medicationFieldValue,
  medicationReviewFields,
  prescriptionDiff,
  REVIEW_CONFIDENCE_THRESHOLD,
  REVIEW_ENCOUNTER_ID,
  reviewFieldId,
  transcriptDiff,
  unresolvedLowConfidenceFields,
} from "@/lib/doctor/clinical-review";
import { formatDateTime } from "@/lib/i18n/formatters";
import { useNumeralPreference, useNumerals } from "@/lib/i18n/numerals";
import {
  jobSchema,
  prescriptionListSchema,
  prescriptionSchema,
  transcriptSchema,
  type MedicationReviewField,
  type Prescription,
  type PrescriptionExtraction,
  type Transcript,
} from "@/lib/schemas";

function BidiClinicalText({ children }: { children: string }) {
  const pieces = children.split(/([+\-]?[0-9٠-٩۰-۹]+(?:[/:.][0-9٠-٩۰-۹]+)*)/gu);
  return (
    <span dir="auto" className="clinical-bidi-text">
      {pieces.map((piece, index) =>
        /[0-9٠-٩۰-۹]/u.test(piece) ? (
          <Ltr key={`${piece}-${index}`}>{piece}</Ltr>
        ) : (
          <Fragment key={`${piece}-${index}`}>{piece}</Fragment>
        ),
      )}
    </span>
  );
}

function Confidence({ value, lowLabel }: { value: number; lowLabel: string }) {
  const numerals = useNumerals();
  const low = value < REVIEW_CONFIDENCE_THRESHOLD;
  return (
    <span className={`clinical-confidence ${low ? "is-low" : "is-clear"}`}>
      <meter min={0} max={1} low={REVIEW_CONFIDENCE_THRESHOLD} value={value} />
      <Ltr>{numerals(`${Math.round(value * 100)}%`)}</Ltr>
      {low ? (
        <span className="clinical-confidence__low">
          <Icon name="alert" size={14} />
          {lowLabel}
        </span>
      ) : null}
    </span>
  );
}

function VersionDiff({
  items,
  emptyLabel,
}: {
  items: Array<{ label: string; before: string; after: string }>;
  emptyLabel: string;
}) {
  return items.length ? (
    <ol className="clinical-diff-list">
      {items.map((item) => (
        <li key={`${item.label}-${item.before}-${item.after}`}>
          <Ltr>{item.label}</Ltr>
          <div>
            <del>
              <BidiClinicalText>{item.before}</BidiClinicalText>
            </del>
            <ins>
              <BidiClinicalText>{item.after}</BidiClinicalText>
            </ins>
          </div>
        </li>
      ))}
    </ol>
  ) : (
    <p className="clinical-diff-empty">{emptyLabel}</p>
  );
}

function TranscriptEditor({
  api,
  announce,
}: {
  api: ApiClient;
  announce: (message: string) => void;
}) {
  const t = useTranslations("doctor.review");
  const numerals = useNumerals();
  const [history, setHistory] = useState<Transcript[]>(() =>
    structuredClone(initialTranscriptHistory),
  );
  const [selectedVersion, setSelectedVersion] = useState(history.at(-1)?.version ?? 1);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [draftText, setDraftText] = useState("");
  const [saving, setSaving] = useState(false);
  const selected =
    history.find((version) => version.version === selectedVersion) ?? history.at(-1)!;
  const selectedIndex = history.findIndex((version) => version.version === selected.version);
  const previous = selectedIndex > 0 ? history[selectedIndex - 1] : undefined;

  async function saveSegment(index: number) {
    const current = history.at(-1)!;
    if (selected.version !== current.version || saving) return;
    const segments = current.segments.map((segment, segmentIndex) =>
      segmentIndex === index ? { ...segment, text: draftText } : segment,
    );
    setSaving(true);
    try {
      const next = await api.patch(
        `/v1/encounters/${REVIEW_ENCOUNTER_ID}/transcript`,
        transcriptSchema,
        { segments },
        { version: current.version, action: createApiAction(), retries: 1 },
      );
      setHistory((versions) => [...versions, next]);
      setSelectedVersion(next.version);
      setEditingIndex(null);
      announce(t("transcript.savedAnnouncement", { version: numerals(next.version) }));
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="clinical-review-panel" aria-labelledby="transcript-review-title">
      <header className="clinical-review-heading">
        <div>
          <p className="type-label">{t("transcript.eyebrow")}</p>
          <h2 id="transcript-review-title">{t("transcript.title")}</h2>
          <p>{t("transcript.description")}</p>
        </div>
        <Badge tone="warning">{t("transcript.draft")}</Badge>
      </header>

      <div className="clinical-version-strip" aria-label={t("versionHistory")}>
        {history.map((version) => (
          <button
            key={version.version}
            type="button"
            className={version.version === selected.version ? "is-current" : ""}
            aria-pressed={version.version === selected.version}
            onClick={() => {
              setSelectedVersion(version.version);
              setEditingIndex(null);
            }}
          >
            <Ltr>{t("version", { version: numerals(version.version) })}</Ltr>
            <span>{version.language === "mixed" ? t("codeSwitched") : version.language}</span>
          </button>
        ))}
      </div>

      <div className="transcript-segments">
        {selected.segments.map((segment, index) => {
          const canEdit = selected.version === history.at(-1)?.version;
          return (
            <article
              key={`${selected.version}-${segment.start}`}
              className={`transcript-segment confidence-${segment.confidence < REVIEW_CONFIDENCE_THRESHOLD ? "low" : "clear"}`}
            >
              <header>
                <span className={`speaker-tag speaker-${segment.speaker}`}>
                  <Icon name={segment.speaker === "doctor" ? "doctor" : "user"} size={15} />
                  {t(`speakers.${segment.speaker}`)}
                </span>
                <Ltr>{numerals(`${segment.start.toFixed(1)}–${segment.end.toFixed(1)}s`)}</Ltr>
                <Confidence value={segment.confidence} lowLabel={t("lowConfidence")} />
              </header>
              {editingIndex === index ? (
                <div className="transcript-inline-editor">
                  <label htmlFor={`transcript-segment-${index}`}>
                    {t("transcript.editLabel", { number: numerals(index + 1) })}
                  </label>
                  <Textarea
                    id={`transcript-segment-${index}`}
                    dir="auto"
                    value={draftText}
                    onChange={(event) => setDraftText(event.target.value)}
                  />
                  <div>
                    <Button variant="ghost" onClick={() => setEditingIndex(null)}>
                      {t("cancel")}
                    </Button>
                    <Button
                      loading={saving}
                      loadingLabel={t("saving")}
                      onClick={() => void saveSegment(index)}
                    >
                      {t("transcript.saveNewVersion")}
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <p>
                    <BidiClinicalText>{segment.text}</BidiClinicalText>
                  </p>
                  <footer>
                    {segment.edited ? (
                      <span className="clinical-edited-mark">
                        <Icon name="check" size={15} />
                        {t("transcript.edited")}
                      </span>
                    ) : (
                      <span>{t("transcript.machineDraft")}</span>
                    )}
                    <Button
                      variant="ghost"
                      disabled={!canEdit}
                      onClick={() => {
                        setDraftText(segment.text);
                        setEditingIndex(index);
                      }}
                    >
                      {t("edit")}
                    </Button>
                  </footer>
                </>
              )}
            </article>
          );
        })}
      </div>

      <details className="clinical-diff" open={Boolean(previous)}>
        <summary>{t("transcript.diffTitle", { version: numerals(selected.version) })}</summary>
        <VersionDiff
          items={previous ? transcriptDiff(previous, selected) : []}
          emptyLabel={t("noChanges")}
        />
      </details>
    </section>
  );
}

function updateMedicationField(
  payload: PrescriptionExtraction,
  medicationIndex: number,
  field: Exclude<MedicationReviewField, "rawText">,
  value: string,
): PrescriptionExtraction {
  return {
    ...payload,
    medications: payload.medications.map((medication, index) =>
      index === medicationIndex
        ? { ...medication, [field]: field === "dose" ? Number(value) : value }
        : medication,
    ),
  };
}

function ExtractionReview({
  locale,
  api,
  announce,
}: {
  locale: "ar" | "en";
  api: ApiClient;
  announce: (message: string) => void;
}) {
  const t = useTranslations("doctor.review");
  const numerals = useNumerals();
  const preference = useNumeralPreference();
  const [history, setHistory] = useState<Prescription[]>([]);
  const [payload, setPayload] = useState<PrescriptionExtraction | null>(null);
  const [acknowledgedIds, setAcknowledgedIds] = useState<Set<string>>(new Set());
  const [editedIds, setEditedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [approving, setApproving] = useState(false);
  const [invalid, setInvalid] = useState(false);
  const [approvalOpen, setApprovalOpen] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<number | null>(null);

  const loadPrescriptions = useCallback(async () => {
    setLoading(true);
    try {
      const versions = await api.get(
        `/v1/encounters/${REVIEW_ENCOUNTER_ID}/prescriptions`,
        prescriptionListSchema,
        { retries: 0 },
      );
      setHistory(versions);
      const current = versions.at(-1);
      setPayload(current ? structuredClone(current.payload) : null);
      setSelectedVersion(current?.version ?? null);
      setInvalid(false);
    } catch (error) {
      if (error instanceof ApiRequestError && error.envelope.code === "EXTRACTION_INVALID_JSON") {
        setInvalid(true);
        setHistory([]);
        setPayload(null);
      } else {
        throw error;
      }
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    void loadPrescriptions();
  }, [loadPrescriptions]);

  const current = history.at(-1);
  const selected = history.find((version) => version.version === selectedVersion) ?? current;
  const selectedIndex = selected
    ? history.findIndex((version) => version.version === selected.version)
    : -1;
  const previous = selectedIndex > 0 ? history[selectedIndex - 1] : undefined;
  const unresolved = current
    ? unresolvedLowConfidenceFields({
        ...current,
        review: {
          fields: (current.review?.fields ?? []).map((field) => ({
            ...field,
            acknowledged:
              field.acknowledged ||
              acknowledgedIds.has(reviewFieldId(field.medicationIndex, field.field)),
          })),
        },
      })
    : [];

  async function reExtract() {
    setLoading(true);
    try {
      await api.post(`/v1/encounters/${REVIEW_ENCOUNTER_ID}/extraction`, jobSchema, undefined, {
        action: createApiAction(),
        retries: 0,
      });
      await loadPrescriptions();
      announce(t("extraction.reExtracted"));
    } finally {
      setLoading(false);
    }
  }

  async function prepareApproval() {
    if (!current || !payload || unresolved.length || current.status !== "draft" || saving) return;
    setSaving(true);
    try {
      const draft = await api.post(
        `/v1/encounters/${REVIEW_ENCOUNTER_ID}/prescriptions`,
        prescriptionSchema,
        { payload, acknowledgedFieldIds: [...acknowledgedIds] },
        { action: createApiAction(), retries: 0 },
      );
      setHistory((versions) => [...versions, draft]);
      setSelectedVersion(draft.version);
      setApprovalOpen(true);
      announce(t("extraction.draftSaved", { version: numerals(draft.version) }));
    } finally {
      setSaving(false);
    }
  }

  async function approve() {
    const draft = history.at(-1);
    if (!draft || approving) return;
    setApproving(true);
    try {
      const approved = await api.post(
        `/v1/prescriptions/${draft.id}/approve`,
        prescriptionSchema,
        { signature: `${CLINICIAN_ACTOR_NAME}:confirmed` },
        { action: createApiAction(), retries: 0 },
      );
      setHistory((versions) => [...versions, approved]);
      setSelectedVersion(approved.version);
      setPayload(structuredClone(approved.payload));
      announce(t("extraction.approvedAnnouncement", { version: numerals(approved.version) }));
    } finally {
      setApproving(false);
    }
  }

  if (loading && !history.length && !invalid) {
    return (
      <section className="clinical-review-panel clinical-review-loading" aria-busy="true">
        <span className="ui-spinner" aria-hidden="true" />
        <p>{t("extraction.loading")}</p>
      </section>
    );
  }

  if (invalid) {
    return (
      <section
        className="clinical-review-panel clinical-invalid-extraction"
        role="alert"
        data-extraction-state="invalid"
      >
        <Icon name="alert" size={28} />
        <div>
          <p className="type-label">{t("extraction.invalidLabel")}</p>
          <h2>{t("extraction.invalidTitle")}</h2>
          <p>{t("extraction.invalidBody")}</p>
          <p className="clinical-no-partial">
            <Icon name="shield" size={16} />
            {t("extraction.noPartial")}
          </p>
        </div>
        <Button onClick={() => void reExtract()}>{t("extraction.reExtract")}</Button>
      </section>
    );
  }

  if (!current || !payload || !selected) return null;
  const approved = current.status === "approved";

  return (
    <section
      className="clinical-review-panel extraction-review"
      aria-labelledby="extraction-review-title"
    >
      <header
        className={`clinical-approval-banner is-${approved ? "approved" : "unapproved"}`}
        data-review-status={approved ? "approved" : "unapproved"}
      >
        <Icon name={approved ? "double-check" : "alert"} size={24} />
        <div>
          <p className="type-label">{approved ? t("approved") : t("unapproved")}</p>
          <h2 id="extraction-review-title">{t("extraction.title")}</h2>
          <p>{approved ? t("extraction.approvedBody") : t("extraction.unapprovedBody")}</p>
        </div>
        <StatusPill
          status={approved ? "completed" : "held"}
          label={
            approved
              ? t("extraction.approvedVersion", { version: numerals(current.version) })
              : t("unapproved")
          }
        />
      </header>

      <div className="clinical-review-meta">
        <span>
          <Icon name="user" size={16} />
          {approved ? current.review?.approvedBy : t("extraction.awaitingClinician")}
        </span>
        <span>
          <Icon name="clock" size={16} />
          {current.approvedAt ? (
            <Ltr>
              {formatDateTime(current.approvedAt, {
                locale,
                numerals: preference,
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </Ltr>
          ) : (
            t("extraction.notApprovedAt")
          )}
        </span>
        <Ltr>{REVIEW_ENCOUNTER_ID}</Ltr>
      </div>

      <div className="clinical-version-strip" aria-label={t("prescriptionHistory")}>
        {history.map((version) => (
          <button
            key={`${version.version}-${version.status}`}
            type="button"
            className={version.version === selected.version ? "is-current" : ""}
            aria-pressed={version.version === selected.version}
            onClick={() => setSelectedVersion(version.version)}
          >
            <Ltr>{t("version", { version: numerals(version.version) })}</Ltr>
            <span>{t(`statuses.${version.status}`)}</span>
          </button>
        ))}
      </div>

      <div className="medication-review-table" aria-label={t("extraction.medicationTable")}>
        {payload.medications.map((medication, medicationIndex) => (
          <section
            className="medication-review-row"
            key={`${medicationIndex}-${medication.rawText}`}
          >
            <header>
              <span className="medication-number">
                <Ltr>{numerals(medicationIndex + 1)}</Ltr>
              </span>
              <div>
                <h3>{medication.normalizedName}</h3>
                <p>{t("extraction.medicationOverallConfidence")}</p>
              </div>
              <Confidence value={medication.confidence} lowLabel={t("lowConfidence")} />
            </header>

            <div className="medication-review-content">
              <aside className="medication-raw-text">
                <span className="type-label">{t("fields.rawText")}</span>
                <blockquote>
                  <BidiClinicalText>{medication.rawText}</BidiClinicalText>
                </blockquote>
                {(() => {
                  const review = current.review?.fields.find(
                    (field) =>
                      field.medicationIndex === medicationIndex && field.field === "rawText",
                  );
                  return review ? (
                    <Confidence value={review.confidence} lowLabel={t("lowConfidence")} />
                  ) : null;
                })()}
                <small>
                  <Icon name="shield" size={15} />
                  {t("extraction.rawTextProtected")}
                </small>
              </aside>

              <div className="medication-normalized-fields">
                {medicationReviewFields
                  .filter((field) => field !== "rawText")
                  .map((field) => {
                    const review = current.review?.fields.find(
                      (candidate) =>
                        candidate.medicationIndex === medicationIndex && candidate.field === field,
                    );
                    if (!review) return null;
                    const id = reviewFieldId(medicationIndex, field);
                    const low = review.confidence < REVIEW_CONFIDENCE_THRESHOLD;
                    const acknowledged = review.acknowledged || acknowledgedIds.has(id);
                    const edited = review.edited || editedIds.has(id);
                    const value = medicationFieldValue(medication, field);
                    return (
                      <div
                        className={`medication-field ${low ? "is-uncertain" : ""}`}
                        data-field-id={id}
                        data-confidence={low ? "low" : "clear"}
                        key={field}
                      >
                        <label htmlFor={`medication-${medicationIndex}-${field}`}>
                          {t(`fields.${field}`)}
                        </label>
                        <Input
                          id={`medication-${medicationIndex}-${field}`}
                          type={field === "dose" ? "number" : "text"}
                          dir={field === "dose" ? "ltr" : "auto"}
                          value={String(value)}
                          disabled={approved || selected.version !== current.version}
                          aria-label={t("extraction.fieldFor", {
                            field: t(`fields.${field}`),
                            medication: medication.normalizedName,
                          })}
                          onChange={(event) => {
                            setPayload((active) =>
                              active
                                ? updateMedicationField(
                                    active,
                                    medicationIndex,
                                    field as Exclude<MedicationReviewField, "rawText">,
                                    event.target.value,
                                  )
                                : active,
                            );
                            setEditedIds((active) => new Set(active).add(id));
                          }}
                        />
                        <Confidence value={review.confidence} lowLabel={t("lowConfidence")} />
                        {edited ? (
                          <span className="clinical-edited-mark">
                            <Icon name="check" size={14} />
                            {t("extraction.editedBy", { actor: CLINICIAN_ACTOR_NAME })}
                          </span>
                        ) : null}
                        {low ? (
                          <label className="clinical-acknowledgement">
                            <input
                              type="checkbox"
                              checked={acknowledged}
                              disabled={approved || selected.version !== current.version}
                              aria-label={t("extraction.acknowledgeField", {
                                field: t(`fields.${field}`),
                                medication: medication.normalizedName,
                              })}
                              onChange={(event) =>
                                setAcknowledgedIds((active) => {
                                  const next = new Set(active);
                                  if (event.target.checked) next.add(id);
                                  else next.delete(id);
                                  return next;
                                })
                              }
                            />
                            <span>
                              <Icon name="alert" size={14} />
                              {t("extraction.acknowledge")}
                            </span>
                          </label>
                        ) : null}
                      </div>
                    );
                  })}
              </div>
            </div>
          </section>
        ))}
      </div>

      {!approved ? (
        <footer className="clinical-approval-actions">
          <div className={unresolved.length ? "is-blocked" : "is-ready"} aria-live="polite">
            <Icon name={unresolved.length ? "alert" : "check"} size={18} />
            <span>
              {unresolved.length
                ? t("extraction.blocked", { count: numerals(unresolved.length) })
                : t("extraction.ready")}
            </span>
          </div>
          <Button
            disabled={Boolean(unresolved.length)}
            loading={saving}
            loadingLabel={t("saving")}
            onClick={() => void prepareApproval()}
          >
            {t("extraction.reviewAndApprove")}
          </Button>
        </footer>
      ) : null}

      <details className="clinical-diff" open={Boolean(previous)}>
        <summary>{t("extraction.diffTitle", { version: numerals(selected.version) })}</summary>
        <VersionDiff
          items={previous ? prescriptionDiff(previous, selected) : []}
          emptyLabel={t("noChanges")}
        />
      </details>

      <ConfirmDialog
        open={approvalOpen}
        onOpenChange={setApprovalOpen}
        title={t("extraction.confirmTitle")}
        description={t("extraction.confirmDescription")}
        closeLabel={t("close")}
        confirmLabel={approving ? t("approving") : t("extraction.confirmApproval")}
        cancelLabel={t("cancel")}
        onConfirm={() => void approve()}
        tone="primary"
      >
        <div className="clinical-confirm-medications">
          <p>
            <Icon name="shield" size={17} />
            {t("extraction.confirmTruth")}
          </p>
          <ol>
            {payload.medications.map((medication) => (
              <li key={medication.rawText}>
                <strong>{medication.normalizedName}</strong>
                <Ltr>{numerals(`${medication.dose} ${medication.unit}`)}</Ltr>
                <span>
                  {medication.frequency} · {medication.duration}
                </span>
              </li>
            ))}
          </ol>
          <small>{t("extraction.approvingActor", { actor: CLINICIAN_ACTOR_NAME })}</small>
        </div>
      </ConfirmDialog>
    </section>
  );
}

export function ClinicalReviewWorkspace({ locale }: { locale: "ar" | "en" }) {
  const t = useTranslations("doctor.review");
  const [announcement, setAnnouncement] = useState("");
  const api = useMemo(
    () =>
      new ApiClient({
        getAccessToken: () => "doctor-session",
        getClinicId: () => "clinic-maadi",
        getLocale: () => locale,
      }),
    [locale],
  );
  return (
    <section className="clinical-review-workspace" aria-labelledby="clinical-review-title">
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {announcement}
      </div>
      <header className="clinical-review-page-header">
        <div>
          <p className="type-label">{t("eyebrow")}</p>
          <h2 id="clinical-review-title">{t("title")}</h2>
          <p>{t("description")}</p>
        </div>
        <span className="clinical-safety-mark">
          <Icon name="shield" size={18} />
          {t("safetyBoundary")}
        </span>
      </header>
      <TranscriptEditor api={api} announce={setAnnouncement} />
      <ExtractionReview locale={locale} api={api} announce={setAnnouncement} />
    </section>
  );
}
