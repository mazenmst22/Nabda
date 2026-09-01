"use client";

import { useTranslations } from "next-intl";
import { Icon, Ltr } from "@/components/ui";
import { formatDateTime } from "@/lib/i18n/formatters";
import { useNumerals } from "@/lib/i18n/numerals";
import type { ApprovedPatientPrescription } from "@/lib/patient/data";
import { PulseEmptyState } from "./pulse-empty-state";

export function PrescriptionsList({
  locale,
  prescriptions,
}: {
  locale: "ar" | "en";
  prescriptions: ApprovedPatientPrescription[];
}) {
  const t = useTranslations("patient");
  const numerals = useNumerals();
  return (
    <main className="patient-workspace">
      <header className="patient-page-header">
        <div>
          <p className="type-label">{t("records")}</p>
          <h1>{t("prescriptions")}</h1>
          <p>{t("prescriptionsIntro")}</p>
        </div>
        <span className="patient-truth-badge">
          <Icon name="shield" size={18} />
          {t("approvedTruth")}
        </span>
      </header>
      <section className="patient-section" aria-label={t("prescriptions")}>
        {!prescriptions.length ? (
          <PulseEmptyState
            locale={locale}
            icon="plus"
            title={t("empty.prescriptionsTitle")}
            description={t("empty.prescriptionsText")}
            action={t("askPulse")}
          />
        ) : (
          <div className="patient-prescription-list">
            {prescriptions.map((prescription) => {
              const doctor =
                locale === "ar" ? prescription.doctorNameAr : prescription.doctorNameEn;
              return (
                <article className="patient-prescription-card" key={prescription.id}>
                  <header>
                    <div>
                      <span className="patient-record-icon">
                        <Icon name="plus" />
                      </span>
                      <div>
                        <h2>{t("prescriptionFrom", { doctor })}</h2>
                        <p>
                          {numerals(
                            formatDateTime(prescription.approvedAt, {
                              locale,
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                            }),
                          )}
                        </p>
                      </div>
                    </div>
                    <span className="patient-approved-mark">
                      <Icon name="double-check" size={17} />
                      {t("approved")}
                    </span>
                  </header>
                  <div className="patient-medications">
                    {prescription.payload.medications.map((medication) => (
                      <div key={`${prescription.id}-${medication.normalizedName}`}>
                        <strong>{medication.normalizedName}</strong>
                        <span>
                          <Ltr>{numerals(`${medication.dose} ${medication.unit}`)}</Ltr> ·{" "}
                          {medication.frequency}
                        </span>
                        <small>
                          {medication.duration} · {medication.notes}
                        </small>
                      </div>
                    ))}
                  </div>
                  <footer>
                    <span>{t("signedVersion")}</span>
                    <Ltr>{t("version", { version: numerals(prescription.version) })}</Ltr>
                  </footer>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
