"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Icon, Ltr, StatusPill } from "@/components/ui";
import { formatDateTime, formatMoney } from "@/lib/i18n/formatters";
import { useNumerals } from "@/lib/i18n/numerals";
import type { PatientAppointment } from "@/lib/patient/data";

export function PatientAppointmentCard({
  appointment,
  locale,
}: {
  appointment: PatientAppointment;
  locale: "ar" | "en";
}) {
  const t = useTranslations("patient");
  const numerals = useNumerals();
  const doctor = locale === "ar" ? appointment.doctorNameAr : appointment.doctorNameEn;
  const clinic = locale === "ar" ? appointment.clinicNameAr : appointment.clinicNameEn;
  const specialty = locale === "ar" ? appointment.specialtyAr : appointment.specialtyEn;
  const date = numerals(
    formatDateTime(appointment.start, {
      locale,
      weekday: "long",
      day: "numeric",
      month: "long",
    }),
  );
  const time = numerals(
    formatDateTime(appointment.start, {
      locale,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }),
  );
  const status = appointment.status === "completed" ? "completed" : "booked";
  return (
    <article className="patient-appointment-card">
      <div className="patient-appointment-date" aria-hidden="true">
        <strong>{numerals(formatDateTime(appointment.start, { locale, day: "2-digit" }))}</strong>
        <span>{formatDateTime(appointment.start, { locale, month: "short" })}</span>
      </div>
      <div className="patient-appointment-copy">
        <div className="patient-card-heading">
          <div>
            <h3>{doctor}</h3>
            <p>{specialty}</p>
          </div>
          <StatusPill status={status} label={t(`statuses.${status}`)} />
        </div>
        <div className="patient-appointment-meta">
          <span>
            <Icon name="calendar" size={17} />
            {date} · <Ltr>{time}</Ltr>
          </span>
          <span>
            <Icon name="pin" size={17} />
            {clinic}
          </span>
          <span>
            <Icon name="wallet" size={17} />
            <Ltr>{numerals(formatMoney({ ...appointment.price, locale }))}</Ltr>
          </span>
        </div>
        <Link
          className="patient-card-link"
          href={`/${locale}/patient/appointments/${appointment.id}`}
        >
          {t("viewAppointment")}
          <Icon name="arrow" size={17} />
        </Link>
      </div>
    </article>
  );
}
