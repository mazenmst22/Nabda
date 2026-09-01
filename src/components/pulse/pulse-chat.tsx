"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Button, Icon, IconButton } from "@/components/ui";
import { ApiClient, createApiAction, type ApiAction } from "@/lib/api/client";
import {
  commitHeldAppointment,
  holdAppointmentSlot,
  releaseAppointmentHold,
} from "@/lib/booking/actions";
import { EmergencyInterstitial } from "./emergency-interstitial";
import { PulseAvatar, type PulseState } from "./pulse-orb";
import { asksIfHuman, guardPulseResponse, hasBookingIntent, hasEmergencySignal } from "./safety";
import { ToolConfirmationCard } from "./tool-confirmation-card";
import type { PulseBookingProposal, PulseChatMessage } from "./types";

const ESTIMATED_MESSAGE_HEIGHT = 116;
const VIRTUAL_OVERSCAN = 3;
const VIRTUAL_WINDOW = 10;

function messageId(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`;
}

function nextBookableSlot() {
  const slot = new Date(Date.now() + 26 * 60 * 60 * 1000);
  slot.setMinutes(slot.getMinutes() < 30 ? 30 : 0, 0, 0);
  if (slot.getMinutes() === 0) slot.setHours(slot.getHours() + 1);
  return slot.toISOString();
}

export function PulseChat({
  locale,
  variant = "route",
  onClose,
}: {
  locale: "ar" | "en";
  variant?: "route" | "dock";
  onClose?: () => void;
}) {
  const t = useTranslations("pulse");
  const [messages, setMessages] = useState<PulseChatMessage[]>([
    {
      id: "pulse-welcome",
      role: "pulse",
      text: t("welcome"),
      createdAt: "2026-08-29T09:00:00Z",
    },
  ]);
  const [composer, setComposer] = useState("");
  const [avatarState, setAvatarState] = useState<PulseState>("idle");
  const [working, setWorking] = useState(false);
  const [emergency, setEmergency] = useState(false);
  const [handoff, setHandoff] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const [virtualStart, setVirtualStart] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const timers = useRef(new Set<number>());
  const handoffRef = useRef(false);
  const committing = useRef(new Set<string>());
  const commitActions = useRef(new Map<string, ApiAction>());

  const api = useMemo(
    () =>
      new ApiClient({
        getAccessToken: () => "pulse-session",
        getClinicId: () => "clinic-maadi",
        getLocale: () => locale,
      }),
    [locale],
  );

  const pendingTool = messages.some(
    (message) =>
      message.proposal?.status === "pending" || message.proposal?.status === "committing",
  );
  const visibleStart = Math.max(
    0,
    Math.min(virtualStart, Math.max(0, messages.length - VIRTUAL_WINDOW)),
  );
  const visibleEnd = Math.min(messages.length, visibleStart + VIRTUAL_WINDOW + VIRTUAL_OVERSCAN);
  const visibleMessages = messages.slice(visibleStart, visibleEnd);

  function schedule(callback: () => void, delay: number) {
    const timer = window.setTimeout(() => {
      timers.current.delete(timer);
      callback();
    }, delay);
    timers.current.add(timer);
    return timer;
  }

  useEffect(
    () => () => {
      for (const timer of timers.current) window.clearTimeout(timer);
      timers.current.clear();
    },
    [],
  );

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    setVirtualStart(Math.max(0, messages.length - VIRTUAL_WINDOW));
    schedule(() => list.scrollTo({ top: list.scrollHeight }), 0);
  }, [messages.length]);

  function updateProposal(
    id: string,
    update: (proposal: PulseBookingProposal) => PulseBookingProposal,
  ) {
    setMessages((current) =>
      current.map((message) =>
        message.proposal?.id === id ? { ...message, proposal: update(message.proposal) } : message,
      ),
    );
  }

  function appendMessage(message: PulseChatMessage) {
    setMessages((current) => [...current, message]);
  }

  function streamPulseResponse(text: string, proposal?: PulseBookingProposal) {
    const safeText = guardPulseResponse({ text, locale });
    const id = messageId("pulse");
    appendMessage({
      id,
      role: "pulse",
      text: "",
      createdAt: new Date().toISOString(),
      streaming: true,
    });
    setAvatarState("speaking");
    setAnnouncement("");
    let cursor = 0;

    return new Promise<void>((resolve) => {
      const tick = () => {
        cursor = Math.min(safeText.length, cursor + 3);
        const complete = cursor === safeText.length;
        setMessages((current) =>
          current.map((message) =>
            message.id === id
              ? {
                  ...message,
                  text: safeText.slice(0, cursor),
                  streaming: !complete,
                  ...(complete && proposal ? { proposal } : {}),
                }
              : message,
          ),
        );
        if (!complete) {
          schedule(tick, 18);
          return;
        }
        if (!handoffRef.current) {
          setAvatarState("done");
          schedule(() => {
            if (!handoffRef.current) setAvatarState("idle");
          }, 420);
        }
        setAnnouncement(t("responseComplete"));
        resolve();
      };
      tick();
    });
  }

  async function proposeBooking() {
    const slotStart = nextBookableSlot();
    try {
      const hold = await holdAppointmentSlot({
        api,
        doctorId: "dr-mariam-fouad",
        slotStart,
        patientId: "patient-amal",
        action: createApiAction(),
      });
      const proposal: PulseBookingProposal = {
        id: messageId("pulse-tool"),
        doctorId: hold.doctorId,
        doctorName: locale === "ar" ? "د. مريم فؤاد" : "Dr Mariam Fouad",
        clinicId: "clinic-maadi",
        clinicName: locale === "ar" ? "عيادات أندلسية" : "Andalusia Clinics",
        slotStart: hold.slotStart,
        price: hold.price,
        hold,
        status: "pending",
      };
      await streamPulseResponse(t("proposalReady", { doctor: proposal.doctorName }), proposal);
    } catch {
      await streamPulseResponse(t("holdFailed"));
    }
  }

  async function sendMessage(text = composer) {
    const trimmed = text.trim();
    if (!trimmed || working || pendingTool || emergency) return;
    setComposer("");
    setWorking(true);
    appendMessage({
      id: messageId("patient"),
      role: "patient",
      text: trimmed,
      createdAt: new Date().toISOString(),
    });

    if (handoff) {
      setAnnouncement(t("sentToStaff"));
      setWorking(false);
      return;
    }

    if (hasEmergencySignal(trimmed)) {
      setEmergency(true);
      setAvatarState("idle");
      setWorking(false);
      return;
    }

    setAvatarState("thinking");
    try {
      if (asksIfHuman(trimmed)) await streamPulseResponse(t("notHumanAnswer"));
      else if (hasBookingIntent(trimmed)) await proposeBooking();
      else if (/diagnos|medicine|medication|severity|شخص|دوا|خطورة/iu.test(trimmed))
        await streamPulseResponse("Diagnosis: restricted clinical output");
      else if (/hours|open|مواعيد العيادة|فاتحة/iu.test(trimmed))
        await streamPulseResponse(t("clinicHoursAnswer"));
      else await streamPulseResponse(t("generalAnswer"));
    } finally {
      setWorking(false);
    }
  }

  async function confirmProposal(proposal: PulseBookingProposal) {
    if (committing.current.has(proposal.id) || proposal.status !== "pending") return;
    committing.current.add(proposal.id);
    updateProposal(proposal.id, (current) => ({ ...current, status: "committing" }));
    setAvatarState("acting");
    const action = commitActions.current.get(proposal.id) ?? createApiAction();
    commitActions.current.set(proposal.id, action);
    try {
      const appointment = await commitHeldAppointment({
        api,
        holdId: proposal.hold.holdId,
        patientId: "patient-amal",
        source: "pulse",
        action,
      });
      updateProposal(proposal.id, (current) => ({
        ...current,
        status: "committed",
        appointment,
      }));
      appendMessage({
        id: messageId("pulse"),
        role: "pulse",
        text: t("tool.committedMessage"),
        createdAt: new Date().toISOString(),
      });
      setAvatarState("done");
      setAnnouncement(t("tool.committedAnnouncement"));
      schedule(() => {
        if (!handoffRef.current) setAvatarState("idle");
      }, 420);
    } catch {
      updateProposal(proposal.id, (current) => ({ ...current, status: "pending" }));
      appendMessage({
        id: messageId("pulse"),
        role: "pulse",
        text: t("tool.commitFailed"),
        createdAt: new Date().toISOString(),
      });
      setAvatarState("idle");
    } finally {
      committing.current.delete(proposal.id);
    }
  }

  async function cancelProposal(proposal: PulseBookingProposal) {
    if (committing.current.has(proposal.id)) return;
    updateProposal(proposal.id, (current) => ({ ...current, status: "cancelled" }));
    try {
      await releaseAppointmentHold({
        api,
        holdId: proposal.hold.holdId,
        action: createApiAction(),
      });
    } catch {
      // The hold expiry remains authoritative if the best-effort release cannot be delivered.
    }
    appendMessage({
      id: messageId("pulse"),
      role: "pulse",
      text: t("tool.cancelledMessage"),
      createdAt: new Date().toISOString(),
    });
    setAnnouncement(t("tool.cancelledAnnouncement"));
  }

  function startHandoff() {
    handoffRef.current = true;
    setHandoff(true);
    setAvatarState("handoff");
    appendMessage({
      id: messageId("human"),
      role: "human",
      text: t("handoffJoined"),
      createdAt: new Date().toISOString(),
    });
    setAnnouncement(t("handoffAnnouncement"));
  }

  function onListScroll() {
    const list = listRef.current;
    if (!list) return;
    setVirtualStart(Math.max(0, Math.floor(list.scrollTop / ESTIMATED_MESSAGE_HEIGHT)));
  }

  function onListKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    const list = listRef.current;
    if (!list) return;
    if (event.key === "Home") list.scrollTo({ top: 0 });
    else if (event.key === "End") list.scrollTo({ top: list.scrollHeight });
    else if (event.key === "PageDown") list.scrollBy({ top: list.clientHeight * 0.8 });
    else if (event.key === "PageUp") list.scrollBy({ top: list.clientHeight * -0.8 });
    else return;
    event.preventDefault();
  }

  return (
    <section
      className={`pulse-chat pulse-chat--${variant}${handoff ? " is-handoff" : ""}`}
      data-pulse-chat
    >
      <header className="pulse-chat-header">
        <PulseAvatar size="medium" state={avatarState} label={t(`states.${avatarState}`)} />
        <div>
          <p className="type-label">{handoff ? t("staffLabel") : t("automatedLabel")}</p>
          <h1>{handoff ? t("staffName") : "Pulse"}</h1>
        </div>
        <span className={`pulse-identity${handoff ? " is-human" : ""}`}>
          <Icon name={handoff ? "user" : "spark"} size={15} />
          {handoff ? t("humanIdentity") : t("softwareIdentity")}
        </span>
        {onClose ? <IconButton label={t("close")} icon="close" onClick={onClose} /> : null}
      </header>

      <div className="pulse-not-human">
        <Icon name="shield" size={16} />
        {handoff ? t("handoffDisclosure") : t("notHuman")}
      </div>

      <div
        ref={listRef}
        className="pulse-message-list"
        role="region"
        aria-live="off"
        aria-label={t("messageList")}
        tabIndex={0}
        data-virtualized="true"
        onScroll={onListScroll}
        onKeyDown={onListKeyDown}
      >
        <div style={{ blockSize: visibleStart * ESTIMATED_MESSAGE_HEIGHT }} aria-hidden="true" />
        {visibleMessages.map((message, index) => (
          <article
            key={message.id}
            className={`pulse-message pulse-message--${message.role}`}
            aria-posinset={visibleStart + index + 1}
            aria-setsize={messages.length}
          >
            <span className="pulse-message-author">
              {message.role === "patient"
                ? t("you")
                : message.role === "human"
                  ? t("staffName")
                  : "Pulse"}
            </span>
            <p>{message.text}</p>
            {message.streaming ? <span className="pulse-stream-caret" aria-hidden="true" /> : null}
            {message.proposal ? (
              <ToolConfirmationCard
                locale={locale}
                proposal={message.proposal}
                onConfirm={() => confirmProposal(message.proposal!)}
                onCancel={() => cancelProposal(message.proposal!)}
              />
            ) : null}
          </article>
        ))}
        <div
          style={{
            blockSize: Math.max(0, messages.length - visibleEnd) * ESTIMATED_MESSAGE_HEIGHT,
          }}
          aria-hidden="true"
        />
      </div>

      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {announcement}
      </div>

      {messages.length === 1 && !emergency ? (
        <div className="pulse-chat-suggestions" aria-label={t("suggestions")}>
          {[t("suggestOne"), t("suggestTwo"), t("suggestThree")].map((suggestion) => (
            <button key={suggestion} type="button" onClick={() => sendMessage(suggestion)}>
              <Icon name="arrow" size={16} />
              <span>{suggestion}</span>
            </button>
          ))}
        </div>
      ) : null}

      {emergency ? (
        <EmergencyInterstitial />
      ) : (
        <div className="pulse-chat-controls">
          <form
            className="pulse-chat-composer"
            onSubmit={(event) => {
              event.preventDefault();
              sendMessage();
            }}
          >
            <label className="sr-only" htmlFor={`pulse-message-${variant}`}>
              {t("composer")}
            </label>
            <textarea
              ref={inputRef}
              id={`pulse-message-${variant}`}
              value={composer}
              rows={1}
              placeholder={pendingTool ? t("composerPending") : t("composer")}
              disabled={pendingTool || working}
              aria-describedby={`pulse-composer-note-${variant}`}
              onChange={(event) => setComposer(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  sendMessage();
                }
              }}
            />
            <Button
              type="submit"
              variant="pulse"
              disabled={!composer.trim() || pendingTool || working}
              loading={working}
              loadingLabel={t("working")}
            >
              {t("send")}
            </Button>
          </form>
          <div className="pulse-chat-control-row" id={`pulse-composer-note-${variant}`}>
            <p>{pendingTool ? t("confirmationPending") : t("safetyShort")}</p>
            {!handoff ? (
              <button type="button" className="pulse-handoff-button" onClick={startHandoff}>
                <Icon name="user" size={16} />
                {t("handoff")}
              </button>
            ) : null}
          </div>
        </div>
      )}
    </section>
  );
}
