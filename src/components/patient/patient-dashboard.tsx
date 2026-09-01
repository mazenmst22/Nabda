"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Badge, Icon, Tabs } from "@/components/ui";
import { useNumerals } from "@/lib/i18n/numerals";
import type { PatientAppointment } from "@/lib/patient/data";
import { PatientAppointmentCard } from "./appointment-card";
import { PulseEmptyState } from "./pulse-empty-state";

function AppointmentList({
  appointments,
  locale,
  kind,
}: {
  appointments: PatientAppointment[];
  locale: "ar" | "en";
  kind: "upcoming" | "past";
}) {
  const t = useTranslations("patient");
  if (!appointments.length)
    return (
      <PulseEmptyState
        locale={locale}
        title={t(`empty.${kind}Title`)}
        description={t(`empty.${kind}Text`)}
        action={t("askPulse")}
      />
    );
  return (
    <div className="patient-appointment-list">
      {appointments.map((appointment) => (
        <PatientAppointmentCard key={appointment.id} appointment={appointment} locale={locale} />
      ))}
    </div>
  );
}

export function PatientDashboard({
  locale,
  appointments,
  prescriptionCount,
  encounterCount,
}: {
  locale: "ar" | "en";
  appointments: PatientAppointment[];
  prescriptionCount: number;
  encounterCount: number;
}) {
  const t = useTranslations("patient");
  const numerals = useNumerals();
  const upcoming = appointments.filter(
    (appointment) =>
      Date.parse(appointment.start) > Date.now() && appointment.status !== "cancelled",
  );
  const past = appointments.filter(
    (appointment) =>
      Date.parse(appointment.start) <= Date.now() || appointment.status === "completed",
  );
  return (
    <main className="patient-workspace">
      <header className="patient-page-header">
        <div>
          <p className="type-label">{t("eyebrow")}</p>
          <h1>{t("greeting")}</h1>
          <p>{t("intro")}</p>
        </div>
        <Link className="ui-button ui-button--primary" href={`/${locale}/search`}>
          <Icon name="search" size={18} />
          <span>{t("findDoctor")}</span>
        </Link>
      </header>

      <section id="appointments" className="patient-section" aria-labelledby="appointments-title">
        <div className="patient-section-heading">
          <div>
            <p className="type-label">{t("appointmentsEyebrow")}</p>
            <h2 id="appointments-title">{t("appointments")}</h2>
          </div>
          <Badge tone="accent">
            {t("upcomingCount", {
              count: upcoming.length,
              formattedCount: numerals(upcoming.length),
            })}
          </Badge>
        </div>
        <Tabs
          label={t("appointmentTabs")}
          items={[
            {
              id: "upcoming",
              label: t("upcoming"),
              content: <AppointmentList appointments={upcoming} locale={locale} kind="upcoming" />,
            },
            {
              id: "past",
              label: t("past"),
              content: <AppointmentList appointments={past} locale={locale} kind="past" />,
            },
          ]}
        />
      </section>

      <section className="patient-overview-grid" aria-label={t("records")}>
        <Link href={`/${locale}/patient/prescriptions`} className="patient-overview-card">
          <span>
            <Icon name="plus" />
          </span>
          <div>
            <small>{t("approvedOnly")}</small>
            <h2>{t("prescriptions")}</h2>
            <p>
              {t("prescriptionCount", {
                count: prescriptionCount,
                formattedCount: numerals(prescriptionCount),
              })}
            </p>
          </div>
          <Icon name="arrow" />
        </Link>
        <Link href={`/${locale}/patient/encounters`} className="patient-overview-card">
          <span>
            <Icon name="doctor" />
          </span>
          <div>
            <small>{t("clinicPolicy")}</small>
            <h2>{t("encounters")}</h2>
            <p>
              {t("encounterCount", {
                count: encounterCount,
                formattedCount: numerals(encounterCount),
              })}
            </p>
          </div>
          <Icon name="arrow" />
        </Link>
      </section>
    </main>
  );
}
