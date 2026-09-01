"use client";

import { useTranslations } from "next-intl";
import { Icon } from "@/components/ui";
import { formatDateTime } from "@/lib/i18n/formatters";
import { useNumerals } from "@/lib/i18n/numerals";
import type { PatientEncounterSummary } from "@/lib/patient/data";
import { PulseEmptyState } from "./pulse-empty-state";

export function EncounterList({
  locale,
  encounters,
}: {
  locale: "ar" | "en";
  encounters: PatientEncounterSummary[];
}) {
  const t = useTranslations("patient");
  const numerals = useNumerals();
  return (
    <main className="patient-workspace">
      <header className="patient-page-header">
        <div>
          <p className="type-label">{t("records")}</p>
          <h1>{t("encounters")}</h1>
          <p>{t("encountersIntro")}</p>
        </div>
      </header>
      <section className="patient-section" aria-label={t("encounters")}>
        {!encounters.length ? (
          <PulseEmptyState
            locale={locale}
            icon="doctor"
            title={t("empty.encountersTitle")}
            description={t("empty.encountersText")}
            action={t("askPulse")}
          />
        ) : (
          <div className="patient-encounter-list">
            {encounters.map((encounter) => (
              <article className="patient-encounter-card" key={encounter.id}>
                <header>
                  <span className="patient-record-icon">
                    <Icon name="doctor" />
                  </span>
                  <div>
                    <h2>{locale === "ar" ? encounter.doctorNameAr : encounter.doctorNameEn}</h2>
                    <p>
                      {locale === "ar" ? encounter.specialtyAr : encounter.specialtyEn} ·{" "}
                      {numerals(
                        formatDateTime(encounter.occurredAt, {
                          locale,
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        }),
                      )}
                    </p>
                  </div>
                </header>
                <div>
                  <h3>{t("summary")}</h3>
                  <p>{locale === "ar" ? encounter.summaryAr : encounter.summaryEn}</p>
                </div>
                <div className="patient-follow-up">
                  <Icon name="calendar" size={18} />
                  <span>
                    <strong>{t("followUp")}</strong>
                    {locale === "ar" ? encounter.followUpAr : encounter.followUpEn}
                  </span>
                </div>
                <footer>
                  <Icon name="shield" size={16} />
                  {t("sharedByClinic")}
                </footer>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
