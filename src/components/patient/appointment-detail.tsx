"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { SlotPicker } from "@/components/booking/slot-picker";
import { Button, ConfirmDialog, Icon, Ltr, StatusPill } from "@/components/ui";
import { ApiClient, createApiAction } from "@/lib/api/client";
import { formatDateTime, formatMoney } from "@/lib/i18n/formatters";
import { useNumerals } from "@/lib/i18n/numerals";
import { appointmentSchema, holdReleasedSchema, holdSchema } from "@/lib/schemas";
import type { Hold } from "@/lib/schemas";
import type { PatientAppointment } from "@/lib/patient/data";

function secondsUntil(iso: string) {
  return Math.max(0, Math.ceil((Date.parse(iso) - Date.now()) / 1000));
}

export function AppointmentDetail({
  locale,
  initialAppointment,
  slots,
}: {
  locale: "ar" | "en";
  initialAppointment: PatientAppointment;
  slots: string[];
}) {
  const t = useTranslations("patient");
  const numerals = useNumerals();
  const [appointment, setAppointment] = useState(initialAppointment);
  const [showReschedule, setShowReschedule] = useState(false);
  const [selected, setSelected] = useState(slots[0] ?? "");
  const [newHold, setNewHold] = useState<Hold | null>(null);
  const [remaining, setRemaining] = useState(0);
  const [busy, setBusy] = useState<"holding" | "moving" | "cancelling" | null>(null);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const moveAction = useRef(createApiAction());
  const api = useMemo(
    () =>
      new ApiClient({
        getAccessToken: () => "patient-session",
        getClinicId: () => appointment.clinicId,
        getLocale: () => locale,
      }),
    [appointment.clinicId, locale],
  );
  const doctor = locale === "ar" ? appointment.doctorNameAr : appointment.doctorNameEn;
  const clinic = locale === "ar" ? appointment.clinicNameAr : appointment.clinicNameEn;
  const address = locale === "ar" ? appointment.clinicAddressAr : appointment.clinicAddressEn;
  const policy =
    locale === "ar" ? appointment.cancellationPolicyAr : appointment.cancellationPolicyEn;
  const date = numerals(
    formatDateTime(appointment.start, { locale, weekday: "long", day: "numeric", month: "long" }),
  );
  const time = numerals(
    formatDateTime(appointment.start, {
      locale,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }),
  );

  useEffect(() => {
    if (!newHold) return;
    const update = () => {
      const value = secondsUntil(newHold.expiresAt);
      setRemaining(value);
      if (value === 0) {
        setNewHold(null);
        setNotice(t("rescheduleExpired"));
      }
    };
    update();
    const timer = window.setInterval(update, 250);
    return () => window.clearInterval(timer);
  }, [newHold, t]);

  async function holdNewTime() {
    if (!selected) return;
    setBusy("holding");
    setNotice(null);
    try {
      const hold = await api.post(
        "/v1/appointments/holds",
        holdSchema,
        { doctorId: appointment.doctorId, slotStart: selected, patientId: appointment.patientId },
        { action: createApiAction(), retries: 1 },
      );
      setNewHold(hold);
      setRemaining(secondsUntil(hold.expiresAt));
    } catch {
      setNotice(t("rescheduleHoldFailed"));
    } finally {
      setBusy(null);
    }
  }

  async function confirmMove() {
    if (!newHold) return;
    setBusy("moving");
    setNotice(null);
    try {
      const moved = await api.patch(
        `/v1/appointments/${appointment.id}`,
        appointmentSchema,
        { slotStart: newHold.slotStart },
        { version: appointment.version, action: moveAction.current, retries: 1 },
      );
      setAppointment({ ...appointment, ...moved });
      await api.delete(`/v1/appointments/holds/${newHold.holdId}`, holdReleasedSchema, {
        action: createApiAction(),
        retries: 0,
      });
      setNewHold(null);
      setShowReschedule(false);
      setNotice(t("rescheduled"));
      moveAction.current = createApiAction();
    } catch {
      setNotice(t("rescheduleFailed"));
    } finally {
      setBusy(null);
    }
  }

  async function cancelAppointment() {
    setBusy("cancelling");
    setNotice(null);
    try {
      const cancelled = await api.patch(
        `/v1/appointments/${appointment.id}`,
        appointmentSchema,
        { status: "cancelled" },
        { version: appointment.version, action: createApiAction(), retries: 1 },
      );
      setAppointment({ ...appointment, ...cancelled });
      setNotice(t("cancelledNotice"));
    } catch {
      setNotice(t("cancelFailed"));
    } finally {
      setBusy(null);
    }
  }

  const isCancelled = appointment.status === "cancelled";
  return (
    <main className="patient-workspace patient-detail-page">
      <Link className="patient-back-link" href={`/${locale}/patient`}>
        <Icon name="arrow" size={17} />
        {t("backAppointments")}
      </Link>
      <header className="patient-page-header patient-detail-header">
        <div>
          <p className="type-label">{t("appointmentDetail")}</p>
          <h1>{doctor}</h1>
          <p>{clinic}</p>
        </div>
        <StatusPill
          status={isCancelled ? "cancelled" : "booked"}
          label={t(`statuses.${isCancelled ? "cancelled" : "booked"}`)}
        />
      </header>
      {notice ? (
        <p className="patient-action-notice" role="status">
          <Icon name="info" size={18} />
          {notice}
        </p>
      ) : null}

      <section className="patient-detail-grid">
        <article className="patient-detail-card">
          <h2>{t("visitDetails")}</h2>
          <dl>
            <div>
              <dt>{t("date")}</dt>
              <dd>{date}</dd>
            </div>
            <div>
              <dt>{t("time")}</dt>
              <dd>
                <Ltr>{time}</Ltr>
              </dd>
            </div>
            <div>
              <dt>{t("clinic")}</dt>
              <dd>
                {clinic}
                <small>{address}</small>
              </dd>
            </div>
            <div>
              <dt>{t("fee")}</dt>
              <dd>
                <Ltr>{numerals(formatMoney({ ...appointment.price, locale }))}</Ltr>
              </dd>
            </div>
            <div>
              <dt>{t("payment")}</dt>
              <dd>{t("payAtClinic")}</dd>
            </div>
          </dl>
          {!isCancelled ? (
            <div className="patient-detail-actions">
              <Button
                variant="secondary"
                leadingIcon="calendar"
                onClick={() => {
                  setShowReschedule((value) => !value);
                  setNotice(null);
                }}
              >
                {t("reschedule")}
              </Button>
              <Button
                variant="ghost"
                leadingIcon="close"
                loading={busy === "cancelling"}
                onClick={() => setCancelOpen(true)}
              >
                {t("cancel")}
              </Button>
            </div>
          ) : null}
        </article>

        {showReschedule && !isCancelled ? (
          <article className="patient-reschedule-card">
            <div className="patient-section-heading">
              <div>
                <p className="type-label">{t("safeReschedule")}</p>
                <h2>{t("chooseNewTime")}</h2>
              </div>
              {newHold ? (
                <span className="patient-hold-countdown">
                  <small>{t("timeLeft")}</small>
                  <Ltr>
                    {numerals(
                      `${String(Math.floor(remaining / 60)).padStart(2, "0")}:${String(remaining % 60).padStart(2, "0")}`,
                    )}
                  </Ltr>
                </span>
              ) : null}
            </div>
            <p>{newHold ? t("newTimeHeld") : t("oldTimeSafe")}</p>
            <SlotPicker
              locale={locale}
              slots={slots}
              selected={selected}
              onSelect={(slot) => {
                setSelected(slot);
                setNewHold(null);
              }}
              labels={{
                day: t("appointmentDay"),
                today: t("nextAvailableDay"),
                tomorrow: t("later"),
                available: t("availableTimes"),
                unavailable: t("unavailable"),
              }}
            />
            {newHold ? (
              <Button
                className="patient-reschedule-action"
                loading={busy === "moving"}
                loadingLabel={t("moving")}
                onClick={confirmMove}
              >
                {t("confirmNewTime")}
              </Button>
            ) : (
              <Button
                className="patient-reschedule-action"
                loading={busy === "holding"}
                loadingLabel={t("holdingNewTime")}
                onClick={holdNewTime}
              >
                {t("holdNewTime")}
              </Button>
            )}
          </article>
        ) : null}
      </section>

      <ConfirmDialog
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        title={t("cancelTitle", { doctor })}
        description={t("cancelDescription", { doctor, time })}
        closeLabel={t("close")}
        confirmLabel={t("confirmCancel")}
        cancelLabel={t("keepAppointment")}
        onConfirm={cancelAppointment}
      >
        <div className="patient-policy">
          <Icon name="info" size={18} />
          <div>
            <strong>{t("cancellationPolicy")}</strong>
            <p>{policy}</p>
          </div>
        </div>
      </ConfirmDialog>
    </main>
  );
}
