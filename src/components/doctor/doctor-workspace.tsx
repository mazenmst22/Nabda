"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Badge, Button, Icon, Ltr, StatusPill, Tabs } from "@/components/ui";
import { ApiClient, createApiAction } from "@/lib/api/client";
import { AUDIO_CONSENT_TEXT_VERSION, consentCopy, doctorPatientNames } from "@/lib/doctor/data";
import { formatDateTime, formatMoney } from "@/lib/i18n/formatters";
import { useNumeralPreference, useNumerals } from "@/lib/i18n/numerals";
import {
  consentSchema,
  encounterSchema,
  type Appointment,
  type ConsentRecord,
  type Encounter,
  type Patient,
  type PatientTimelineItem,
  type Prescription,
} from "@/lib/schemas";
import { AudioCapture } from "./audio-capture";
import { ClinicalReviewWorkspace } from "./clinical-review-workspace";

function appointmentStatus(status: Appointment["status"]) {
  if (status === "checked_in") return "checked-in" as const;
  if (status === "in_progress") return "in-progress" as const;
  if (status === "completed") return "completed" as const;
  if (status === "cancelled") return "cancelled" as const;
  if (status === "no_show") return "no-show" as const;
  if (status === "held") return "held" as const;
  return "booked" as const;
}

function ScheduleList({
  locale,
  appointments,
  mode,
}: {
  locale: "ar" | "en";
  appointments: Appointment[];
  mode: "day" | "week";
}) {
  const t = useTranslations("doctor");
  const preference = useNumeralPreference();
  const days =
    mode === "day"
      ? ["2026-08-29"]
      : ["2026-08-29", "2026-08-30", "2026-08-31", "2026-09-01", "2026-09-02", "2026-09-03"];
  return (
    <div className={`doctor-schedule doctor-schedule--${mode}`}>
      {days.map((day) => {
        const rows = appointments.filter((appointment) => appointment.start.slice(0, 10) === day);
        return (
          <section key={day} className="doctor-schedule-day" aria-label={day}>
            <h3>
              {formatDateTime(`${day}T09:00:00Z`, {
                locale,
                numerals: preference,
                weekday: "long",
                month: "short",
                day: "numeric",
              })}
            </h3>
            {rows.length ? (
              rows.map((appointment) => (
                <article key={appointment.id} className="doctor-schedule-appointment">
                  <Ltr>
                    {formatDateTime(appointment.start, {
                      locale,
                      numerals: preference,
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </Ltr>
                  <div>
                    <strong>
                      {doctorPatientNames[appointment.patientId] ?? appointment.patientId}
                    </strong>
                    <small>{t("schedule.followUp")}</small>
                  </div>
                  <StatusPill
                    status={appointmentStatus(appointment.status)}
                    label={t(`appointmentStates.${appointment.status}`)}
                  />
                </article>
              ))
            ) : (
              <p className="doctor-schedule-empty">{t("schedule.noAppointments")}</p>
            )}
          </section>
        );
      })}
    </div>
  );
}

export function DoctorWorkspace({
  locale,
  patient,
  appointments,
  timeline,
  encounters,
  prescriptions,
}: {
  locale: "ar" | "en";
  patient: Patient;
  appointments: Appointment[];
  timeline: PatientTimelineItem[];
  encounters: Encounter[];
  prescriptions: Prescription[];
}) {
  const t = useTranslations("doctor");
  const preference = useNumeralPreference();
  const numerals = useNumerals();
  const [encounter, setEncounter] = useState<Encounter | null>(null);
  const [consent, setConsent] = useState<ConsentRecord | null>(null);
  const [agreed, setAgreed] = useState(false);
  const [starting, setStarting] = useState(false);
  const [savingConsent, setSavingConsent] = useState(false);
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

  function dateTime(iso: string) {
    return formatDateTime(iso, {
      locale,
      numerals: preference,
      dateStyle: "medium",
      timeStyle: "short",
    });
  }

  async function startEncounter() {
    if (encounter || starting) return;
    setStarting(true);
    try {
      const created = await api.post(
        "/v1/encounters",
        encounterSchema,
        {
          patientId: patient.id,
          appointmentId: "appointment-doctor-amal",
          doctorId: "dr-mariam-fouad",
        },
        { action: createApiAction(), retries: 0 },
      );
      setEncounter(created);
      setAnnouncement(t("encounter.created"));
    } finally {
      setStarting(false);
    }
  }

  async function grantAudioConsent() {
    if (!encounter || !agreed || savingConsent) return;
    setSavingConsent(true);
    try {
      const record = await api.post(
        "/v1/consents",
        consentSchema,
        {
          patientId: patient.id,
          encounterId: encounter.id,
          purpose: "encounter_audio",
          textVersion: AUDIO_CONSENT_TEXT_VERSION,
        },
        { action: createApiAction(), retries: 0 },
      );
      setConsent(record);
      setAnnouncement(t("consent.granted"));
    } finally {
      setSavingConsent(false);
    }
  }

  async function revokeAudioConsent() {
    if (!consent || consent.status !== "granted") return;
    const activeConsent = consent;
    // Withdrawal is a safety boundary, so local capture stops immediately. The
    // server response remains authoritative for the persisted record, but a
    // slow connection must never extend browser recording after withdrawal.
    setConsent({
      ...activeConsent,
      status: "revoked",
      revokedAt: new Date().toISOString(),
      version: activeConsent.version + 1,
    });
    setAnnouncement(t("consent.revoked"));
    const revoked = await api.delete(`/v1/consents/${activeConsent.id}`, consentSchema, {
      action: createApiAction(),
      retries: 0,
    });
    setConsent(revoked);
  }

  const approvedPrescription = prescriptions[0];
  const medication = approvedPrescription?.payload.medications[0];

  return (
    <main className="doctor-workspace" id="main-content">
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {announcement}
      </div>
      <header className="doctor-page-header">
        <div>
          <p className="type-label">{t("eyebrow")}</p>
          <h1>{t("title")}</h1>
          <p>{t("intro")}</p>
        </div>
        <Button
          leadingIcon="doctor"
          loading={starting}
          loadingLabel={t("encounter.starting")}
          onClick={() => void startEncounter()}
        >
          {t("encounter.start")}
        </Button>
      </header>

      <section
        className="doctor-section doctor-schedule-section"
        aria-labelledby="doctor-schedule-title"
      >
        <div className="doctor-section-heading">
          <div>
            <p className="type-label">{t("schedule.eyebrow")}</p>
            <h2 id="doctor-schedule-title">{t("schedule.title")}</h2>
          </div>
          <Badge tone="accent">{t("schedule.live")}</Badge>
        </div>
        <Tabs
          label={t("schedule.views")}
          items={[
            {
              id: "day",
              label: t("schedule.day"),
              content: <ScheduleList locale={locale} appointments={appointments} mode="day" />,
            },
            {
              id: "week",
              label: t("schedule.week"),
              content: <ScheduleList locale={locale} appointments={appointments} mode="week" />,
            },
          ]}
        />
      </section>

      <section className="doctor-patient-chart" aria-labelledby="patient-chart-title">
        <header className="doctor-chart-header">
          <div className="doctor-patient-avatar" aria-hidden="true">
            {patient.fullName.slice(0, 1)}
          </div>
          <div>
            <p className="type-label">{t("chart.aggregate")}</p>
            <h2 id="patient-chart-title">{patient.fullName}</h2>
            <p>{t("chart.subtitle")}</p>
          </div>
          <span className="doctor-chart-record">
            <Icon name="shield" size={17} />
            {t("chart.oneRecord")}
          </span>
        </header>

        <nav className="doctor-chart-nav" aria-label={t("chart.sections")}>
          {["demographics", "timeline", "encounters", "prescriptions", "billing", "audit"].map(
            (section) => (
              <a key={section} href={`#doctor-${section}`}>
                {t(`chart.${section}`)}
              </a>
            ),
          )}
        </nav>

        <div className="doctor-chart-grid">
          <section
            id="doctor-demographics"
            className="doctor-chart-card doctor-demographics"
            aria-labelledby="demographics-title"
          >
            <h3 id="demographics-title">
              <Icon name="user" />
              {t("chart.demographics")}
            </h3>
            <dl>
              <div>
                <dt>{t("chart.fullName")}</dt>
                <dd>{patient.fullName}</dd>
              </div>
              <div>
                <dt>{t("chart.phone")}</dt>
                <dd>
                  <Ltr>{numerals(patient.phone)}</Ltr>
                </dd>
              </div>
              <div>
                <dt>{t("chart.email")}</dt>
                <dd>
                  <Ltr>{patient.email}</Ltr>
                </dd>
              </div>
              <div>
                <dt>{t("chart.dateOfBirth")}</dt>
                <dd>
                  <Ltr>{numerals(patient.dateOfBirth ?? "—")}</Ltr>
                </dd>
              </div>
              <div>
                <dt>{t("chart.language")}</dt>
                <dd>
                  {patient.preferredLanguage === "ar" ? t("chart.arabic") : t("chart.english")}
                </dd>
              </div>
              <div>
                <dt>{t("chart.patientId")}</dt>
                <dd>
                  <Ltr>{patient.id}</Ltr>
                </dd>
              </div>
            </dl>
          </section>

          <section
            id="doctor-timeline"
            className="doctor-chart-card"
            aria-labelledby="timeline-title"
          >
            <h3 id="timeline-title">
              <Icon name="clock" />
              {t("chart.timeline")}
            </h3>
            <ol className="doctor-timeline">
              {timeline.map((item) => (
                <li key={item.id}>
                  <span aria-hidden="true" />
                  <div>
                    <strong>{locale === "ar" ? item.titleAr : item.titleEn}</strong>
                    <Ltr>{dateTime(item.occurredAt)}</Ltr>
                    <small>{item.status}</small>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <section
            id="doctor-encounters"
            className="doctor-chart-card"
            aria-labelledby="encounters-title"
          >
            <h3 id="encounters-title">
              <Icon name="doctor" />
              {t("chart.encounters")}
            </h3>
            {encounters.map((item) => (
              <article className="doctor-record-row" key={item.id}>
                <div>
                  <strong>{t("chart.cardiologyFollowUp")}</strong>
                  <Ltr>{dateTime(item.startedAt)}</Ltr>
                </div>
                <StatusPill status="completed" label={t("chart.completed")} />
                <a href={`#audit-${item.id}`}>{t("chart.auditLink")}</a>
              </article>
            ))}
          </section>

          <section
            id="doctor-prescriptions"
            className="doctor-chart-card"
            aria-labelledby="prescriptions-title"
          >
            <h3 id="prescriptions-title">
              <Icon name="plus" />
              {t("chart.prescriptions")}
            </h3>
            {approvedPrescription && medication ? (
              <article className="doctor-prescription-row">
                <div>
                  <strong>{medication.normalizedName}</strong>
                  <span>{medication.rawText}</span>
                  <small>
                    <Ltr>{numerals(`${medication.dose} ${medication.unit}`)}</Ltr> ·{" "}
                    {medication.frequency}
                  </small>
                </div>
                <StatusPill
                  status="completed"
                  label={t("chart.approvedVersion", {
                    version: numerals(approvedPrescription.version),
                  })}
                />
                <a href={`#audit-${approvedPrescription.id}`}>{t("chart.historyAndAudit")}</a>
              </article>
            ) : null}
          </section>

          <section
            id="doctor-billing"
            className="doctor-chart-card"
            aria-labelledby="billing-title"
          >
            <h3 id="billing-title">
              <Icon name="wallet" />
              {t("chart.billing")}
            </h3>
            <article className="doctor-record-row">
              <div>
                <strong>
                  <Ltr>
                    {formatMoney({ amount: 450, currency: "EGP", locale, numerals: preference })}
                  </Ltr>
                </strong>
                <span>{t("chart.consultationFee")}</span>
              </div>
              <StatusPill status="completed" label={t("chart.paidAtClinic")} />
              <Ltr>RCPT-2026-1882</Ltr>
            </article>
          </section>

          <section id="doctor-audit" className="doctor-chart-card" aria-labelledby="audit-title">
            <h3 id="audit-title">
              <Icon name="shield" />
              {t("chart.audit")}
            </h3>
            <ul className="doctor-audit-list">
              <li id="audit-encounter-previous">
                <Ltr>AUD-ENC-9201</Ltr>
                <span>{t("chart.encounterSigned")}</span>
                <Ltr>{dateTime("2026-07-19T08:45:00Z")}</Ltr>
              </li>
              <li id="audit-prescription-approved">
                <Ltr>AUD-RX-9202</Ltr>
                <span>{t("chart.prescriptionApproved")}</span>
                <Ltr>{dateTime("2026-07-19T08:42:00Z")}</Ltr>
              </li>
            </ul>
          </section>
        </div>
      </section>

      <ClinicalReviewWorkspace locale={locale} />

      {encounter ? (
        <section className="doctor-encounter-flow" aria-labelledby="active-encounter-title">
          <div className="doctor-section-heading">
            <div>
              <p className="type-label">{t("encounter.activeLabel")}</p>
              <h2 id="active-encounter-title">
                {t("encounter.activeTitle", { patient: patient.fullName })}
              </h2>
            </div>
            <Ltr>{encounter.id}</Ltr>
          </div>
          <section
            className={`doctor-consent-gate is-${consent?.status ?? "missing"}`}
            aria-labelledby="consent-title"
          >
            <header>
              <Icon name="shield" />
              <div>
                <p className="type-label">{t("consent.legalClinical")}</p>
                <h3 id="consent-title">{t("consent.title")}</h3>
              </div>
              <Ltr>{AUDIO_CONSENT_TEXT_VERSION}</Ltr>
            </header>
            <blockquote>{consentCopy[locale]}</blockquote>
            <p className="doctor-consent-version">
              {t("consent.versionAgreed", { version: AUDIO_CONSENT_TEXT_VERSION })}
            </p>
            {consent?.status === "granted" ? (
              <div className="doctor-consent-granted">
                <StatusPill status="completed" label={t("consent.current")} />
                <Ltr>{dateTime(consent.grantedAt)}</Ltr>
                <Button variant="danger" onClick={() => void revokeAudioConsent()}>
                  {t("consent.revoke")}
                </Button>
              </div>
            ) : consent?.status === "revoked" ? (
              <div className="doctor-consent-revoked" role="alert">
                <StatusPill status="cancelled" label={t("consent.revokedStatus")} />
                <p>{t("consent.revokedBody")}</p>
              </div>
            ) : (
              <div className="doctor-consent-action">
                <label>
                  <input
                    type="checkbox"
                    checked={agreed}
                    onChange={(event) => setAgreed(event.target.checked)}
                  />
                  <span>{t("consent.patientAgrees")}</span>
                </label>
                <Button
                  disabled={!agreed}
                  loading={savingConsent}
                  loadingLabel={t("consent.saving")}
                  onClick={() => void grantAudioConsent()}
                >
                  {t("consent.recordAgreement")}
                </Button>
              </div>
            )}
          </section>
          <AudioCapture
            locale={locale}
            patientId={patient.id}
            encounterId={encounter.id}
            consent={consent}
            requiredTextVersion={AUDIO_CONSENT_TEXT_VERSION}
          />
        </section>
      ) : null}
    </main>
  );
}
