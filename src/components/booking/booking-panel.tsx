"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { useTranslations } from "next-intl";
import { Button, Field, Icon, Input, Ltr } from "@/components/ui";
import { ApiClient, createApiAction, type ApiAction } from "@/lib/api/client";
import { ApiRequestError } from "@/lib/api/errors";
import {
  commitHeldAppointment,
  holdAppointmentSlot,
  releaseAppointmentHold,
} from "@/lib/booking/actions";
import { createAppointmentCalendar } from "@/lib/booking/calendar";
import { formatDateTime, formatMoney } from "@/lib/i18n/formatters";
import { useNumerals } from "@/lib/i18n/numerals";
import { patientSchema } from "@/lib/schemas";
import type { Appointment, Hold } from "@/lib/schemas";
import { SlotPicker } from "./slot-picker";

type BookingStage =
  "selecting" | "holding" | "identity" | "registering" | "review" | "committing" | "confirmed";
type BookingScenario = "slot-taken" | "hold-expired" | "network-retry";
type PatientForm = { fullName: string; phone: string; email: string };

export type BookingPanelProps = {
  locale: "ar" | "en";
  fee: number;
  doctor: { id: string; name: string };
  clinic: { id: string; name: string; address: string };
  slots?: string[];
};

const intentKey = "nabda.booking.intent";
const signedInKey = "nabda.booking.signed-in";

function errorCode(error: unknown) {
  return error instanceof ApiRequestError ? error.envelope.code : "UNKNOWN_ERROR";
}

function secondsUntil(iso: string) {
  return Math.max(0, Math.ceil((Date.parse(iso) - Date.now()) / 1000));
}

export function BookingPanel({ locale, fee, doctor, clinic, slots }: BookingPanelProps) {
  const t = useTranslations("booking.flow");
  const availableSlots = useMemo(
    () => (slots?.length ? slots : [new Date(Date.now() + 60 * 60 * 1000).toISOString()]),
    [slots],
  );
  const [selected, setSelected] = useState(availableSlots[0] ?? "");
  const [stage, setStage] = useState<BookingStage>("selecting");
  const [hold, setHold] = useState<Hold | null>(null);
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [remaining, setRemaining] = useState(0);
  const [notice, setNotice] = useState<"expired" | "network" | "recovered" | null>(null);
  const [slotConflict, setSlotConflict] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const commitAction = useRef<ApiAction | null>(null);
  const commitPending = useRef(false);
  const patientId = useRef("patient-amal");
  const scenario = useRef<BookingScenario | null>(null);
  const holdScenarioConsumed = useRef(false);
  const formatNumerals = useNumerals();
  const form = useForm<PatientForm>({ defaultValues: { fullName: "", phone: "", email: "" } });

  const api = useMemo(
    () =>
      new ApiClient({
        getAccessToken: () => "public-booking-session",
        getClinicId: () => clinic.id,
        getLocale: () => locale,
      }),
    [clinic.id, locale],
  );

  const formattedFee = formatMoney({ amount: fee, currency: "EGP", locale });
  const time = selected
    ? formatDateTime(selected, { locale, hour: "2-digit", minute: "2-digit", hour12: false })
    : "";
  const date = selected
    ? formatDateTime(selected, { locale, weekday: "long", day: "numeric", month: "long" })
    : "";
  const alternatives = availableSlots.filter((slot) => slot !== selected).slice(0, 3);

  useEffect(() => {
    const queryScenario = new URLSearchParams(window.location.search).get("bookingScenario");
    if (
      queryScenario === "slot-taken" ||
      queryScenario === "hold-expired" ||
      queryScenario === "network-retry"
    )
      scenario.current = queryScenario;
    setSignedIn(window.localStorage.getItem(signedInKey) === "true");
    try {
      const raw = window.sessionStorage.getItem(intentKey);
      if (!raw) return;
      const intent = JSON.parse(raw) as { doctorId?: string; slot?: string; hold?: Hold };
      if (intent.doctorId !== doctor.id || !intent.slot) return;
      setSelected(intent.slot);
      setSignedIn(true);
      setNotice("recovered");
      if (intent.hold && secondsUntil(intent.hold.expiresAt) > 0) {
        setHold(intent.hold);
        setRemaining(secondsUntil(intent.hold.expiresAt));
        setStage("identity");
      }
      window.sessionStorage.removeItem(intentKey);
    } catch {
      window.sessionStorage.removeItem(intentKey);
    }
  }, [doctor.id]);

  useEffect(() => {
    if (!hold || stage === "selecting" || stage === "confirmed") return;
    const update = () => {
      const value = secondsUntil(hold.expiresAt);
      setRemaining(value);
      if (value === 0) {
        commitPending.current = false;
        commitAction.current = null;
        setHold(null);
        setStage("selecting");
        setNotice("expired");
      }
    };
    update();
    const timer = window.setInterval(update, 250);
    return () => window.clearInterval(timer);
  }, [hold, stage]);

  const scenarioHeaders = useCallback((phase: "hold" | "commit") => {
    if (process.env.NODE_ENV === "production") return undefined;
    if (phase === "commit" && scenario.current === "network-retry")
      return { "X-Nabda-Test-Scenario": "network-retry" };
    if (
      phase === "hold" &&
      !holdScenarioConsumed.current &&
      (scenario.current === "slot-taken" || scenario.current === "hold-expired")
    )
      return { "X-Nabda-Test-Scenario": scenario.current };
    return undefined;
  }, []);

  async function requestHold() {
    if (!selected) return;
    setStage("holding");
    setNotice(null);
    setSlotConflict(false);
    const headers = scenarioHeaders("hold");
    try {
      const response = await holdAppointmentSlot({
        api,
        doctorId: doctor.id,
        slotStart: selected,
        action: createApiAction(),
        retries: 0,
        headers,
      });
      if (headers) holdScenarioConsumed.current = true;
      setHold(response);
      setRemaining(secondsUntil(response.expiresAt));
      setStage("identity");
    } catch (error) {
      if (headers) holdScenarioConsumed.current = true;
      setStage("selecting");
      if (errorCode(error) === "SLOT_TAKEN") setSlotConflict(true);
      else setNotice("network");
    }
  }

  async function releaseAndSelect() {
    const currentHold = hold;
    setHold(null);
    setStage("selecting");
    commitAction.current = null;
    if (!currentHold) return;
    try {
      await releaseAppointmentHold({ api, holdId: currentHold.holdId, action: createApiAction() });
    } catch {
      // The expiry boundary is authoritative; release is best-effort during navigation.
    }
  }

  function continueAsPatient(id: string) {
    window.sessionStorage.removeItem(intentKey);
    patientId.current = id;
    commitAction.current = createApiAction();
    setStage("review");
  }

  async function registerPatient(values: PatientForm) {
    setStage("registering");
    setNotice(null);
    try {
      const registered = await api.post(
        "/v1/patients",
        patientSchema,
        {
          fullName: values.fullName,
          phone: values.phone,
          ...(values.email ? { email: values.email } : {}),
          gender: "unspecified",
          preferredLanguage: locale,
          numeralPreference: "western",
        },
        { action: createApiAction(), retries: 1 },
      );
      continueAsPatient(registered.id);
    } catch {
      setStage("identity");
      setNotice("network");
    }
  }

  function goToSignIn() {
    if (!hold) return;
    const returnTo = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    window.sessionStorage.setItem(
      intentKey,
      JSON.stringify({ doctorId: doctor.id, slot: selected, hold }),
    );
    window.location.assign(`/${locale}/sign-in?returnTo=${encodeURIComponent(returnTo)}`);
  }

  async function commit() {
    if (!hold || commitPending.current) return;
    commitPending.current = true;
    setStage("committing");
    setNotice(null);
    commitAction.current ??= createApiAction();
    try {
      const committed = await commitHeldAppointment({
        api,
        holdId: hold.holdId,
        patientId: patientId.current,
        source: "patient_web",
        action: commitAction.current,
        retries: 1,
        headers: scenarioHeaders("commit"),
      });
      setAppointment(committed);
      setHold(null);
      setStage("confirmed");
    } catch (error) {
      if (errorCode(error) === "HOLD_EXPIRED") {
        setHold(null);
        setStage("selecting");
        setNotice("expired");
        commitAction.current = null;
      } else {
        setStage("review");
        setNotice("network");
      }
    } finally {
      commitPending.current = false;
    }
  }

  function downloadCalendar() {
    if (!appointment) return;
    const contents = createAppointmentCalendar({
      id: appointment.id,
      start: appointment.start,
      end: appointment.end,
      doctorName: doctor.name,
      clinicName: clinic.name,
      clinicAddress: clinic.address,
    });
    const url = URL.createObjectURL(new Blob([contents], { type: "text/calendar;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `nabda-${appointment.id}.ics`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  }

  const step =
    stage === "selecting" || stage === "holding"
      ? 0
      : stage === "identity" || stage === "registering"
        ? 1
        : stage === "confirmed"
          ? 3
          : 2;
  const warning = remaining > 0 && remaining <= 60;

  return (
    <section className="booking-panel" aria-labelledby="booking-heading" data-booking-stage={stage}>
      <ol className="booking-steps" aria-label={t("progressLabel")}>
        {[t("stepSlot"), t("stepDetails"), t("stepReview"), t("stepDone")].map((label, index) => (
          <li
            key={label}
            aria-current={index === step ? "step" : undefined}
            data-complete={index < step || undefined}
          >
            <span>
              {index < step ? <Icon name="check" size={13} /> : formatNumerals(index + 1)}
            </span>
            <small>{label}</small>
          </li>
        ))}
      </ol>

      <div className="booking-title-row">
        <div>
          <span className="availability-pill">
            <i className="status-dot" />
            {t("verifiedSchedule")}
          </span>
          <h2 id="booking-heading">
            {stage === "selecting" || stage === "holding"
              ? t("chooseSlot")
              : stage === "identity" || stage === "registering"
                ? t("identify")
                : stage === "confirmed"
                  ? t("confirmedTitle")
                  : t("reviewTitle")}
          </h2>
        </div>
        {hold && stage !== "confirmed" ? (
          <span
            className={`hold-timer${warning ? " is-warning" : ""}`}
            role={warning ? "alert" : undefined}
          >
            <small>{warning ? t("expiring") : t("timeLeft")}</small>
            <Ltr data-testid="hold-countdown">
              {formatNumerals(
                `${String(Math.floor(remaining / 60)).padStart(2, "0")}:${String(remaining % 60).padStart(2, "0")}`,
              )}
            </Ltr>
          </span>
        ) : null}
      </div>

      {notice ? (
        <p className={`booking-notice booking-notice--${notice}`} role="status">
          <Icon name={notice === "network" ? "alert" : "info"} size={18} />
          {t(notice)}
        </p>
      ) : null}

      {slotConflict ? (
        <div className="booking-conflict" role="alert">
          <p>
            <Icon name="alert" size={19} />
            <strong>{t("slotTakenTitle")}</strong>
          </p>
          <span>
            {t("slotTakenText", {
              doctor: doctor.name,
              count: formatNumerals(alternatives.length),
            })}
          </span>
          <div className="booking-alternatives" aria-label={t("alternativesLabel")}>
            {alternatives.map((slot) => (
              <button
                key={slot}
                type="button"
                onClick={() => {
                  setSelected(slot);
                  setSlotConflict(false);
                }}
              >
                <Icon name="clock" size={16} />
                <Ltr>
                  {formatNumerals(
                    formatDateTime(slot, {
                      locale,
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: false,
                    }),
                  )}
                </Ltr>
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {(stage === "selecting" || stage === "holding") && (
        <div className="booking-stage">
          <SlotPicker
            locale={locale}
            slots={availableSlots}
            selected={selected}
            onSelect={(slot) => {
              setSelected(slot);
              setSlotConflict(false);
            }}
            labels={{
              day: t("dayLabel"),
              today: t("today"),
              tomorrow: t("tomorrow"),
              available: t("availableTimes"),
              unavailable: t("unavailable"),
            }}
          />
          <Button
            className="booking-primary"
            leadingIcon="clock"
            loading={stage === "holding"}
            loadingLabel={t("holding")}
            onClick={requestHold}
          >
            {t("holdAction")} · <Ltr>{formatNumerals(time)}</Ltr>
          </Button>
        </div>
      )}

      {(stage === "identity" || stage === "registering") && (
        <div className="booking-stage booking-identity">
          <p className="hold-explanation">{t("holdDetail")}</p>
          {signedIn ? (
            <div className="booking-signed-in">
              <Icon name="user" />
              <span>
                <small>{t("signedInAs")}</small>
                <strong>{t("signedInPatient")}</strong>
              </span>
              <Button variant="secondary" onClick={() => continueAsPatient("patient-amal")}>
                {t("continue")}
              </Button>
            </div>
          ) : (
            <Button
              variant="secondary"
              className="booking-sign-in"
              leadingIcon="user"
              onClick={goToSignIn}
            >
              {t("signIn")}
            </Button>
          )}
          <div className="booking-divider">
            <span>{t("orRegister")}</span>
          </div>
          <FormProvider {...form}>
            <form onSubmit={form.handleSubmit(registerPatient)} noValidate>
              <Field
                name="fullName"
                label={t("fullName")}
                required
                rules={{ required: t("required") }}
              >
                <Input autoComplete="name" />
              </Field>
              <Field
                name="phone"
                label={t("phone")}
                hint={t("phoneHint")}
                required
                rules={{
                  required: t("required"),
                  pattern: { value: /^\+?[0-9 ]{10,16}$/u, message: t("phoneError") },
                }}
              >
                <Input className="ltr booking-phone" inputMode="tel" autoComplete="tel" />
              </Field>
              <Field name="email" label={t("email")} hint={t("optional")}>
                <Input className="ltr" type="email" autoComplete="email" />
              </Field>
              <Button
                type="submit"
                className="booking-primary"
                loading={stage === "registering"}
                loadingLabel={t("registering")}
              >
                {t("continue")}
              </Button>
            </form>
          </FormProvider>
          <button className="change-slot" type="button" onClick={releaseAndSelect}>
            {t("changeSlot")}
          </button>
        </div>
      )}

      {(stage === "review" || stage === "committing") && (
        <div className="booking-stage booking-review">
          <p className="hold-explanation">{t("reviewTruth")}</p>
          <dl className="booking-review-list">
            <div>
              <dt>{t("doctor")}</dt>
              <dd>{doctor.name}</dd>
            </div>
            <div>
              <dt>{t("date")}</dt>
              <dd>{date}</dd>
            </div>
            <div>
              <dt>{t("time")}</dt>
              <dd>
                <Ltr>{formatNumerals(time)}</Ltr>
              </dd>
            </div>
            <div>
              <dt>{t("fee")}</dt>
              <dd>
                <Ltr>{formatNumerals(formattedFee)}</Ltr>
              </dd>
            </div>
            <div>
              <dt>{t("payment")}</dt>
              <dd>{t("freePay")}</dd>
            </div>
            <div>
              <dt>{t("location")}</dt>
              <dd>{clinic.name}</dd>
            </div>
          </dl>
          <p className="booking-payment">
            <Icon name="wallet" size={18} />
            {t("freePay")}
          </p>
          <Button
            className="booking-primary"
            leadingIcon="double-check"
            loading={stage === "committing"}
            loadingLabel={t("committing")}
            onClick={commit}
            data-testid="commit-booking"
          >
            {notice === "network" ? t("retryCommit") : t("commit")}
          </Button>
          <button
            className="change-slot"
            type="button"
            onClick={releaseAndSelect}
            disabled={stage === "committing"}
          >
            {t("changeSlot")}
          </button>
        </div>
      )}

      {stage === "confirmed" && appointment ? (
        <div
          className="booking-stage confirmed-panel"
          aria-live="polite"
          data-appointment-id={appointment.id}
        >
          <span className="confirmation-icon">
            <Icon name="check" size={28} strokeWidth={2.4} />
          </span>
          <h3>{t("confirmedTitle")}</h3>
          <p>{t("confirmedText")}</p>
          <p className="booking-reference">
            {t("reference")} <Ltr>{appointment.id}</Ltr>
          </p>
          <dl className="booking-review-list">
            <div>
              <dt>{t("doctor")}</dt>
              <dd>{doctor.name}</dd>
            </div>
            <div>
              <dt>{t("date")}</dt>
              <dd>{date}</dd>
            </div>
            <div>
              <dt>{t("time")}</dt>
              <dd>
                <Ltr>{formatNumerals(time)}</Ltr>
              </dd>
            </div>
            <div>
              <dt>{t("location")}</dt>
              <dd>
                {clinic.name}
                <small>{clinic.address}</small>
              </dd>
            </div>
          </dl>
          <p className="booking-payment">
            <Icon name="wallet" size={18} />
            {t("freePay")}
          </p>
          <Button variant="secondary" leadingIcon="calendar" onClick={downloadCalendar}>
            {t("addCalendar")}
          </Button>
          <section className="booking-next" aria-labelledby="booking-next-title">
            <h4 id="booking-next-title">{t("nextTitle")}</h4>
            <ul>
              <li>
                <Icon name="message" size={18} />
                <span>
                  <strong>{t("reminderTitle")}</strong>
                  {t("reminderText", { hours: formatNumerals(24) })}
                </span>
              </li>
              <li>
                <Icon name="pin" size={18} />
                <span>
                  <strong>{t("addressTitle")}</strong>
                  {clinic.address}
                </span>
              </li>
              <li>
                <Icon name="info" size={18} />
                <span>
                  <strong>{t("bringTitle")}</strong>
                  {t("bringText", { minutes: formatNumerals(10) })}
                </span>
              </li>
            </ul>
          </section>
        </div>
      ) : null}

      <div className="booking-fee-bar" data-testid="booking-fee">
        <span>
          <small>{t("fee")}</small>
          <strong>
            <Ltr>{formatNumerals(formattedFee)}</Ltr>
          </strong>
        </span>
        <span>
          <Icon name="wallet" size={17} />
          {t("payAtClinic")}
        </span>
      </div>
    </section>
  );
}
