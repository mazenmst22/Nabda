"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { PulseChat } from "@/components/pulse/pulse-chat";
import {
  Button,
  Card,
  ConfirmDialog,
  Dialog,
  Icon,
  Input,
  Ltr,
  Select,
  StatusPill,
} from "@/components/ui";
import type { Status } from "@/components/ui/content";
import { ApiClient, createApiAction } from "@/lib/api/client";
import { ApiRequestError } from "@/lib/api/errors";
import { commitHeldAppointment, holdAppointmentSlot } from "@/lib/booking/actions";
import { formatDateTime, formatMoney } from "@/lib/i18n/formatters";
import { useNumeralPreference, useNumerals } from "@/lib/i18n/numerals";
import type { Appointment, QueueEntry } from "@/lib/schemas";
import { appointmentSchema, patientSchema, queueSchema } from "@/lib/schemas";
import type {
  ReceptionAppointment,
  ReceptionDoctor,
  ReceptionPatient,
  ReceptionQueueEntry,
} from "@/lib/reception/data";

const SCHEDULE_HOURS = [9, 9.5, 10, 10.5, 11, 11.5, 12, 12.5, 13, 13.5, 14];
const QUEUE_STATES = ["waiting", "called", "in_room", "done", "skipped"] as const;

function slotIso(hour: number) {
  const wholeHour = Math.floor(hour);
  return new Date(Date.UTC(2026, 7, 29, wholeHour - 3, hour % 1 ? 30 : 0)).toISOString();
}

function bookableSlots() {
  return [9, 10.5, 11.5, 13].map(slotIso);
}

const appointmentPills: Record<Appointment["status"], Status> = {
  held: "held",
  booked: "booked",
  checked_in: "checked-in",
  in_progress: "in-progress",
  completed: "completed",
  cancelled: "cancelled",
  no_show: "no-show",
};

function appointmentForCell(appointments: ReceptionAppointment[], doctorId: string, hour: number) {
  return appointments.find(
    (appointment) =>
      appointment.doctorId === doctorId &&
      formatDateTime(appointment.start, {
        locale: "en",
        numerals: "western",
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23",
      }) === `${String(Math.floor(hour)).padStart(2, "0")}:${hour % 1 ? "30" : "00"}`,
  );
}

function FieldLabel({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) {
  return (
    <label className="reception-field-label" htmlFor={htmlFor}>
      {children}
    </label>
  );
}

export function ReceptionWorkspace({
  locale,
  initialAppointments,
  initialQueue,
  doctors,
  initialPatients,
}: {
  locale: "ar" | "en";
  initialAppointments: ReceptionAppointment[];
  initialQueue: ReceptionQueueEntry[];
  doctors: ReceptionDoctor[];
  initialPatients: ReceptionPatient[];
}) {
  const t = useTranslations("reception");
  const numerals = useNumerals();
  const numeralPreference = useNumeralPreference();
  const searchParams = useSearchParams();
  const [appointments, setAppointments] = useState(initialAppointments);
  const [queue, setQueue] = useState(initialQueue);
  const [patients, setPatients] = useState(initialPatients);
  const [search, setSearch] = useState("");
  const [newAppointmentOpen, setNewAppointmentOpen] = useState(false);
  const [quickPatientOpen, setQuickPatientOpen] = useState(false);
  const [booking, setBooking] = useState(false);
  const [bookingError, setBookingError] = useState("");
  const [selectedPatientId, setSelectedPatientId] = useState(initialPatients[0]?.id ?? "");
  const [selectedDoctorId, setSelectedDoctorId] = useState(doctors[0]?.id ?? "");
  const [selectedSlot, setSelectedSlot] = useState(bookableSlots()[0] ?? "");
  const [quickName, setQuickName] = useState("");
  const [quickPhone, setQuickPhone] = useState("");
  const [creatingPatient, setCreatingPatient] = useState(false);
  const [moveIntent, setMoveIntent] = useState<{
    appointment: ReceptionAppointment;
    target: string;
  } | null>(null);
  const [movePending, setMovePending] = useState(false);
  const [conflict, setConflict] = useState<{
    latest: ReceptionAppointment;
    target: string;
  } | null>(null);
  const [selectedQueueIndex, setSelectedQueueIndex] = useState(0);
  const [announcement, setAnnouncement] = useState("");
  const [paid, setPaid] = useState<Record<string, number>>({});
  const [amounts, setAmounts] = useState<Record<string, string>>({});
  const [receiptId, setReceiptId] = useState<string | null>(null);
  const dragId = useRef<string | null>(null);
  const conflictScenarioUsed = useRef(false);
  const queueRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const slots = useMemo(bookableSlots, []);

  const api = useMemo(
    () =>
      new ApiClient({
        getAccessToken: () => "reception-session",
        getClinicId: () => "clinic-maadi",
        getLocale: () => locale,
      }),
    [locale],
  );

  const filteredPatients = patients.filter((patient) => {
    const value = `${patient.fullName} ${patient.phone}`.toLocaleLowerCase(locale);
    return value.includes(search.toLocaleLowerCase(locale));
  });

  function doctorName(doctor: ReceptionDoctor) {
    return locale === "ar" ? doctor.nameAr : doctor.nameEn;
  }

  function queueDoctorName(entry: ReceptionQueueEntry) {
    return locale === "ar" ? entry.doctorNameAr : entry.doctorNameEn;
  }

  function time(iso: string) {
    return formatDateTime(iso, {
      locale,
      numerals: numeralPreference,
      hour: "numeric",
      minute: "2-digit",
    });
  }

  function money(amount: number) {
    return formatMoney({ amount, currency: "EGP", locale, numerals: numeralPreference });
  }

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const editing = target?.matches("input, textarea, select, [contenteditable='true']");
      const dialogOpen = document.querySelector("dialog[open]");
      if (editing || dialogOpen) return;
      if (event.key.toLocaleLowerCase() === "n") {
        event.preventDefault();
        setNewAppointmentOpen(true);
        return;
      }
      if (event.key.toLocaleLowerCase() === "j" || event.key.toLocaleLowerCase() === "k") {
        event.preventDefault();
        const direction = event.key.toLocaleLowerCase() === "j" ? 1 : -1;
        setSelectedQueueIndex((current) => {
          const next = Math.min(Math.max(current + direction, 0), Math.max(queue.length - 1, 0));
          queueRefs.current[next]?.focus();
          return next;
        });
        return;
      }
      if (event.key === "Enter" && queue.length) {
        event.preventDefault();
        const selected = queue[selectedQueueIndex];
        const waitingIndex =
          selected?.state === "waiting"
            ? selectedQueueIndex
            : queue.findIndex((entry) => entry.state === "waiting");
        if (waitingIndex >= 0) queueRefs.current[waitingIndex]?.click();
      }
    }
    // Capture the key before a focused queue card can synthesize its own click.
    // Enter always means “call the next waiting patient”, regardless of which
    // card J/K most recently focused.
    window.addEventListener("keydown", onKeyDown, { capture: true });
    return () => window.removeEventListener("keydown", onKeyDown, { capture: true });
  }, [queue, selectedQueueIndex]);

  useEffect(() => {
    if (!receiptId) return;
    const print = window.requestAnimationFrame(() => window.print());
    const clear = () => setReceiptId(null);
    window.addEventListener("afterprint", clear, { once: true });
    return () => {
      window.cancelAnimationFrame(print);
      window.removeEventListener("afterprint", clear);
    };
  }, [receiptId]);

  async function createAppointment(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedPatientId || !selectedDoctorId || !selectedSlot || booking) return;
    setBooking(true);
    setBookingError("");
    const action = createApiAction();
    try {
      const hold = await holdAppointmentSlot({
        api,
        doctorId: selectedDoctorId,
        slotStart: selectedSlot,
        patientId: selectedPatientId,
        action,
      });
      const committed = await commitHeldAppointment({
        api,
        holdId: hold.holdId,
        patientId: selectedPatientId,
        source: "reception",
        action,
      });
      const patient = patients.find((candidate) => candidate.id === selectedPatientId);
      setAppointments((current) => [
        ...current,
        { ...committed, patientName: patient?.fullName ?? selectedPatientId },
      ]);
      setAnnouncement(t("bookingCommitted", { patient: patient?.fullName ?? selectedPatientId }));
      setNewAppointmentOpen(false);
    } catch {
      setBookingError(t("bookingFailed"));
    } finally {
      setBooking(false);
    }
  }

  async function createPatient(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!quickName.trim() || !quickPhone.trim()) return;
    setCreatingPatient(true);
    try {
      const patient = await api.post(
        "/v1/patients",
        patientSchema,
        {
          fullName: quickName.trim(),
          phone: quickPhone.trim(),
          gender: "unspecified",
          preferredLanguage: locale,
          numeralPreference: "western",
        },
        { action: createApiAction(), retries: 0 },
      );
      setPatients((current) => [...current, patient]);
      setSelectedPatientId(patient.id);
      setSearch(patient.fullName);
      setQuickPatientOpen(false);
      setQuickName("");
      setQuickPhone("");
      setAnnouncement(t("patientCreated", { patient: patient.fullName }));
    } finally {
      setCreatingPatient(false);
    }
  }

  function startMove(appointment: ReceptionAppointment, target: string) {
    if (appointment.start === target) return;
    setConflict(null);
    setMoveIntent({ appointment, target });
  }

  async function confirmMove(intent = moveIntent) {
    if (!intent || movePending) return;
    setMovePending(true);
    try {
      const testConflict =
        searchParams.get("appointmentConflict") === "1" && !conflictScenarioUsed.current;
      if (testConflict) conflictScenarioUsed.current = true;
      const updated = await api.patch(
        `/v1/appointments/${intent.appointment.id}`,
        appointmentSchema,
        { slotStart: intent.target },
        {
          version: intent.appointment.version,
          action: createApiAction(),
          retries: 0,
          headers: testConflict ? { "X-Nabda-Test-Scenario": "version-conflict" } : undefined,
        },
      );
      setAppointments((current) =>
        current.map((appointment) =>
          appointment.id === updated.id
            ? { ...updated, patientName: appointment.patientName }
            : appointment,
        ),
      );
      setConflict(null);
      setAnnouncement(
        t("moveSuccess", { patient: intent.appointment.patientName, time: time(updated.start) }),
      );
    } catch (error) {
      if (error instanceof ApiRequestError && error.envelope.code === "VERSION_CONFLICT") {
        const latest = await api.get(
          `/v1/appointments/${intent.appointment.id}`,
          appointmentSchema,
          {
            action: createApiAction(),
            retries: 0,
          },
        );
        const display = { ...latest, patientName: intent.appointment.patientName };
        setAppointments((current) =>
          current.map((appointment) => (appointment.id === display.id ? display : appointment)),
        );
        setConflict({ latest: display, target: intent.target });
        setAnnouncement(t("conflictAnnouncement"));
      } else {
        setAnnouncement(t("moveFailed"));
      }
    } finally {
      setMovePending(false);
      setMoveIntent(null);
    }
  }

  async function changeQueueState(entry: ReceptionQueueEntry, state: QueueEntry["state"]) {
    try {
      const updated = await api.patch(
        `/v1/queue/${entry.id}`,
        queueSchema,
        { state },
        { version: entry.version, action: createApiAction(), retries: 1 },
      );
      setQueue((current) =>
        current.map((candidate) =>
          candidate.id === entry.id
            ? { ...candidate, ...updated, version: candidate.version + 1 }
            : candidate,
        ),
      );
      setAnnouncement(
        t("queueUpdated", { patient: entry.patientName, state: t(`queueStates.${state}`) }),
      );
    } catch (error) {
      setAnnouncement(
        error instanceof ApiRequestError && error.envelope.code === "VERSION_CONFLICT"
          ? t("queueConflict")
          : t("queueFailed"),
      );
    }
  }

  function markPaid(appointment: ReceptionAppointment) {
    const amount = Number(amounts[appointment.id] ?? appointment.price.amount);
    if (!Number.isFinite(amount) || amount <= 0) return;
    setPaid((current) => ({ ...current, [appointment.id]: amount }));
    setAnnouncement(t("paidRecorded", { patient: appointment.patientName }));
  }

  return (
    <main className="reception-workspace" id="main-content">
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {announcement}
      </div>

      <header className="reception-page-header">
        <div>
          <p className="type-label">{t("eyebrow")}</p>
          <h1>{t("title")}</h1>
          <p>{t("intro")}</p>
        </div>
        <Button leadingIcon="plus" onClick={() => setNewAppointmentOpen(true)}>
          {t("newAppointment")}
          <kbd>N</kbd>
        </Button>
      </header>

      <section className="reception-metrics" aria-label={t("todaySummary")}>
        {[
          { label: t("metricAppointments"), value: appointments.length, icon: "calendar" as const },
          {
            label: t("metricWaiting"),
            value: queue.filter((entry) => entry.state === "waiting").length,
            icon: "queue" as const,
          },
          { label: t("metricPaid"), value: Object.keys(paid).length, icon: "wallet" as const },
        ].map((metric) => (
          <Card key={metric.label}>
            <Icon name={metric.icon} />
            <strong>{numerals(metric.value)}</strong>
            <span>{metric.label}</span>
          </Card>
        ))}
      </section>

      <section className="reception-section" id="appointments" aria-labelledby="schedule-title">
        <div className="reception-section-heading">
          <div>
            <p className="type-label">{t("liveSchedule")}</p>
            <h2 id="schedule-title">{t("scheduleTitle")}</h2>
            <p>{t("scheduleDescription")}</p>
          </div>
          <span className="reception-live-badge">
            <Icon name="double-check" size={16} />
            {t("sourceOfTruth")}
          </span>
        </div>

        {conflict ? (
          <div className="reception-conflict" role="alert" data-testid="version-conflict">
            <Icon name="alert" />
            <div>
              <strong>{t("conflictTitle")}</strong>
              <p>
                {t("conflictBody", {
                  patient: conflict.latest.patientName,
                  time: time(conflict.latest.start),
                })}
              </p>
            </div>
            <Button
              variant="secondary"
              onClick={() =>
                void confirmMove({ appointment: conflict.latest, target: conflict.target })
              }
            >
              {t("retryMove")}
            </Button>
          </div>
        ) : null}

        <div
          className="reception-schedule-scroll"
          tabIndex={0}
          role="region"
          aria-label={t("scheduleScrollLabel")}
        >
          <div className="reception-schedule-grid">
            <div className="reception-grid-corner">{t("time")}</div>
            {doctors.map((doctor) => (
              <div className="reception-doctor-header" key={doctor.id}>
                <strong>{doctorName(doctor)}</strong>
                <span>{locale === "ar" ? doctor.specialtyAr : doctor.specialtyEn}</span>
              </div>
            ))}
            {SCHEDULE_HOURS.flatMap((hour) => {
              const displayTime = time(slotIso(hour));
              return [
                <div className="reception-time-cell" key={`time-${hour}`}>
                  <Ltr>{displayTime}</Ltr>
                </div>,
                ...doctors.map((doctor) => {
                  const appointment = appointmentForCell(appointments, doctor.id, hour);
                  return (
                    <div
                      className="reception-slot-cell"
                      key={`${doctor.id}-${hour}`}
                      data-doctor={doctor.id}
                      data-time={displayTime}
                      onDragOver={(event) => event.preventDefault()}
                      onDrop={() => {
                        const dragged = appointments.find((item) => item.id === dragId.current);
                        if (dragged) startMove(dragged, slotIso(hour));
                      }}
                    >
                      {appointment ? (
                        <button
                          type="button"
                          draggable
                          className={`reception-appointment-block is-${appointment.status}`}
                          data-testid={`appointment-${appointment.id}`}
                          onDragStart={() => {
                            dragId.current = appointment.id;
                          }}
                          onDragEnd={() => {
                            dragId.current = null;
                          }}
                          onClick={() =>
                            startMove(appointment, slotIso(hour === 14 ? 13.5 : hour + 0.5))
                          }
                          aria-label={t("appointmentLabel", {
                            patient: appointment.patientName,
                            doctor: doctorName(doctor),
                            time: displayTime,
                            status: t(`appointmentStates.${appointment.status}`),
                          })}
                        >
                          <strong>{appointment.patientName}</strong>
                          <StatusPill
                            status={appointmentPills[appointment.status]}
                            label={t(`appointmentStates.${appointment.status}`)}
                          />
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="reception-empty-slot"
                          onClick={() => {
                            setSelectedDoctorId(doctor.id);
                            setSelectedSlot(slotIso(hour));
                            setNewAppointmentOpen(true);
                          }}
                          aria-label={t("createAt", {
                            doctor: doctorName(doctor),
                            time: displayTime,
                          })}
                        >
                          <span aria-hidden="true">+</span>
                        </button>
                      )}
                    </div>
                  );
                }),
              ];
            })}
          </div>
        </div>
      </section>

      <section className="reception-section" id="queue" aria-labelledby="queue-title">
        <div className="reception-section-heading">
          <div>
            <p className="type-label">{t("queueLive")}</p>
            <h2 id="queue-title">{t("queueTitle")}</h2>
            <p>{t("queueDescription")}</p>
          </div>
          <span className="reception-shortcut-hint">
            <kbd>J</kbd>
            <kbd>K</kbd>
            <kbd>Enter</kbd>
            {t("queueKeyboard")}
          </span>
        </div>
        <div className="reception-queue-board">
          {QUEUE_STATES.map((state) => (
            <section
              className={`reception-queue-column is-${state}`}
              key={state}
              aria-labelledby={`queue-${state}`}
            >
              <h3 id={`queue-${state}`}>
                <Icon
                  name={
                    state === "done"
                      ? "double-check"
                      : state === "skipped"
                        ? "minus"
                        : state === "in_room"
                          ? "doctor"
                          : state === "called"
                            ? "phone"
                            : "clock"
                  }
                  size={17}
                />
                {t(`queueStates.${state}`)}
                <span>{numerals(queue.filter((entry) => entry.state === state).length)}</span>
              </h3>
              <div className="reception-queue-list">
                {queue
                  .filter((entry) => entry.state === state)
                  .map((entry) => {
                    const absoluteIndex = queue.findIndex((candidate) => candidate.id === entry.id);
                    return (
                      <button
                        key={entry.id}
                        ref={(node) => {
                          queueRefs.current[absoluteIndex] = node;
                        }}
                        type="button"
                        className="reception-queue-card"
                        tabIndex={absoluteIndex === selectedQueueIndex ? 0 : -1}
                        aria-pressed={absoluteIndex === selectedQueueIndex}
                        onFocus={() => setSelectedQueueIndex(absoluteIndex)}
                        onClick={() =>
                          void changeQueueState(
                            entry,
                            entry.state === "waiting"
                              ? "called"
                              : entry.state === "called"
                                ? "in_room"
                                : entry.state === "in_room"
                                  ? "done"
                                  : entry.state,
                          )
                        }
                      >
                        <span className="reception-queue-position">
                          <Ltr>{numerals(entry.position)}</Ltr>
                        </span>
                        <strong>{entry.patientName}</strong>
                        <small>{queueDoctorName(entry)}</small>
                        <span className="reception-wait">
                          <Icon name="timer" size={15} />
                          {entry.estimatedWaitMin
                            ? t("estimatedWait", { minutes: numerals(entry.estimatedWaitMin) })
                            : t("readyNow")}
                        </span>
                      </button>
                    );
                  })}
                {!queue.some((entry) => entry.state === state) ? (
                  <p className="reception-queue-empty">{t("queueEmpty")}</p>
                ) : null}
              </div>
            </section>
          ))}
        </div>
        <p className="reception-estimate-note">
          <Icon name="shield" size={16} />
          {t("estimateSource")}
        </p>
      </section>

      <div className="reception-lower-grid">
        <section className="reception-section" id="patients" aria-labelledby="patients-title">
          <div className="reception-section-heading">
            <div>
              <p className="type-label">{t("patientLookup")}</p>
              <h2 id="patients-title">{t("patientsTitle")}</h2>
            </div>
            <Button
              variant="secondary"
              leadingIcon="plus"
              onClick={() => setQuickPatientOpen(true)}
            >
              {t("quickCreate")}
            </Button>
          </div>
          <label className="reception-patient-search">
            <span className="sr-only">{t("searchPatients")}</span>
            <Icon name="search" />
            <Input
              data-reception-search
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t("searchPatients")}
            />
            <kbd>/</kbd>
          </label>
          <ul className="reception-patient-results">
            {filteredPatients.map((patient) => (
              <li key={patient.id}>
                <div>
                  <strong>{patient.fullName}</strong>
                  <Ltr>{numerals(patient.phone)}</Ltr>
                </div>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setSelectedPatientId(patient.id);
                    setNewAppointmentOpen(true);
                  }}
                >
                  {t("bookPatient")}
                </Button>
              </li>
            ))}
          </ul>
        </section>

        <section
          className="reception-section reception-billing"
          id="billing"
          aria-labelledby="billing-title"
        >
          <div className="reception-section-heading">
            <div>
              <p className="type-label">{t("billingLite")}</p>
              <h2 id="billing-title">{t("billingTitle")}</h2>
            </div>
          </div>
          <ul>
            {appointments.slice(0, 3).map((appointment) => (
              <li
                key={appointment.id}
                className={`${paid[appointment.id] ? "is-paid" : ""}${receiptId === appointment.id ? " is-receipt-target" : ""}`.trim()}
              >
                <div>
                  <strong>{appointment.patientName}</strong>
                  <Ltr>{money(appointment.price.amount)}</Ltr>
                  <small className="reception-receipt-details">
                    {t("clinicName")} · {t("reference")} <Ltr>{appointment.id}</Ltr> ·{" "}
                    <Ltr>{time(appointment.start)}</Ltr>
                  </small>
                </div>
                <label>
                  <span className="sr-only">
                    {t("amountFor", { patient: appointment.patientName })}
                  </span>
                  <Input
                    dir="ltr"
                    inputMode="decimal"
                    value={amounts[appointment.id] ?? String(appointment.price.amount)}
                    onChange={(event) =>
                      setAmounts((current) => ({
                        ...current,
                        [appointment.id]: event.target.value,
                      }))
                    }
                  />
                </label>
                {paid[appointment.id] ? (
                  <Button
                    variant="secondary"
                    leadingIcon="check"
                    onClick={() => setReceiptId(appointment.id)}
                  >
                    {t("printReceipt")}
                  </Button>
                ) : (
                  <Button leadingIcon="wallet" onClick={() => markPaid(appointment)}>
                    {t("markPaid")}
                  </Button>
                )}
              </li>
            ))}
          </ul>
          <p className="reception-print-note">{t("receiptNote")}</p>
        </section>
      </div>

      <aside className="reception-pulse-panel" aria-labelledby="pulse-assist-title">
        <div className="reception-section-heading">
          <div>
            <p className="type-label">{t("pulseAssist")}</p>
            <h2 id="pulse-assist-title">{t("pulseTitle")}</h2>
            <p>{t("pulseDescription")}</p>
          </div>
        </div>
        <PulseChat locale={locale} variant="dock" />
      </aside>

      <Dialog
        open={newAppointmentOpen}
        onOpenChange={setNewAppointmentOpen}
        title={t("newAppointment")}
        description={t("newAppointmentDescription")}
        closeLabel={t("close")}
        footer={null}
      >
        <form
          className="reception-dialog-form"
          onSubmit={createAppointment}
          data-testid="new-appointment-form"
        >
          <div>
            <FieldLabel htmlFor="reception-patient">{t("patient")}</FieldLabel>
            <Select
              id="reception-patient"
              value={selectedPatientId}
              onChange={(event) => setSelectedPatientId(event.target.value)}
              required
              autoFocus
            >
              {patients.map((patient) => (
                <option key={patient.id} value={patient.id}>
                  {patient.fullName}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <FieldLabel htmlFor="reception-doctor">{t("doctor")}</FieldLabel>
            <Select
              id="reception-doctor"
              value={selectedDoctorId}
              onChange={(event) => setSelectedDoctorId(event.target.value)}
              required
            >
              {doctors.map((doctor) => (
                <option key={doctor.id} value={doctor.id}>
                  {doctorName(doctor)}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <FieldLabel htmlFor="reception-slot">{t("availableTime")}</FieldLabel>
            <Select
              id="reception-slot"
              value={selectedSlot}
              onChange={(event) => setSelectedSlot(event.target.value)}
              required
            >
              {slots.map((slot) => (
                <option key={slot} value={slot}>
                  {time(slot)}
                </option>
              ))}
            </Select>
          </div>
          <div className="reception-price-confirm">
            <Icon name="wallet" />
            <span>{t("feeShown")}</span>
            <strong>
              <Ltr>{money(doctors.find((doctor) => doctor.id === selectedDoctorId)?.fee ?? 0)}</Ltr>
            </strong>
          </div>
          {bookingError ? (
            <p role="alert" className="reception-form-error">
              {bookingError}
            </p>
          ) : null}
          <div className="reception-dialog-actions">
            <Button variant="ghost" onClick={() => setNewAppointmentOpen(false)}>
              {t("cancel")}
            </Button>
            <Button
              type="submit"
              loading={booking}
              loadingLabel={t("committing")}
              data-testid="commit-reception-booking"
            >
              {t("confirmBooking")}
            </Button>
          </div>
        </form>
      </Dialog>

      <Dialog
        open={quickPatientOpen}
        onOpenChange={setQuickPatientOpen}
        title={t("quickCreate")}
        description={t("quickCreateDescription")}
        closeLabel={t("close")}
      >
        <form className="reception-dialog-form" onSubmit={createPatient}>
          <div>
            <FieldLabel htmlFor="quick-name">{t("fullName")}</FieldLabel>
            <Input
              id="quick-name"
              value={quickName}
              onChange={(event) => setQuickName(event.target.value)}
              required
              autoFocus
            />
          </div>
          <div>
            <FieldLabel htmlFor="quick-phone">{t("phone")}</FieldLabel>
            <Input
              id="quick-phone"
              dir="ltr"
              inputMode="tel"
              value={quickPhone}
              onChange={(event) => setQuickPhone(event.target.value)}
              required
            />
          </div>
          <div className="reception-dialog-actions">
            <Button variant="ghost" onClick={() => setQuickPatientOpen(false)}>
              {t("cancel")}
            </Button>
            <Button type="submit" loading={creatingPatient} loadingLabel={t("creatingPatient")}>
              {t("createPatient")}
            </Button>
          </div>
        </form>
      </Dialog>

      <ConfirmDialog
        open={Boolean(moveIntent)}
        onOpenChange={(open) => {
          if (!open) setMoveIntent(null);
        }}
        title={t("moveTitle")}
        description={
          moveIntent
            ? t("moveDescription", {
                patient: moveIntent.appointment.patientName,
                time: time(moveIntent.target),
              })
            : ""
        }
        closeLabel={t("close")}
        confirmLabel={movePending ? t("moving") : t("confirmMove")}
        cancelLabel={t("cancel")}
        tone="primary"
        onConfirm={() => void confirmMove()}
      >
        <p>{t("moveAuditNote")}</p>
      </ConfirmDialog>
    </main>
  );
}
