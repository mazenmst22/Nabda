"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { NextIntlClientProvider } from "next-intl";
import { Icon } from "@/components/ui";
import arMessages from "../../../messages/ar.json";
import enMessages from "../../../messages/en.json";
import { PulseAvatar } from "./pulse-orb";
import "@/styles/pulse.css";

const PulseChat = dynamic(() => import("./pulse-chat").then((module) => module.PulseChat), {
  ssr: false,
});

export function PulseDock({
  locale,
  initialOpen = false,
}: {
  locale: "ar" | "en";
  initialOpen?: boolean;
}) {
  const pathname = usePathname();
  const t = useTranslations("pulse");
  const [open, setOpen] = useState(initialOpen);
  const [desktop, setDesktop] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 1024px)");
    const update = () => setDesktop(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (!open) return;
    panelRef.current?.querySelector<HTMLElement>("textarea, button")?.focus();
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
        return;
      }
      if (desktop || event.key !== "Tab" || !panelRef.current) return;
      const focusable = [
        ...panelRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), textarea:not([disabled]), a[href], [tabindex="0"]',
        ),
      ];
      const first = focusable[0];
      const last = focusable.at(-1);
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [desktop, open]);

  if (/\/(?:ar|en)\/(?:pulse|reception)\/?$/u.test(pathname)) return null;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className="pulse-dock-trigger"
        aria-label={t("open")}
        aria-expanded={open}
        aria-controls="pulse-dock-panel"
        onClick={() => setOpen(true)}
      >
        <PulseAvatar size="small" state="idle" />
        <span>Pulse</span>
        <Icon name="message" size={18} />
      </button>
      {open ? (
        <div className="pulse-dock-backdrop" onMouseDown={() => !desktop && setOpen(false)}>
          <div
            ref={panelRef}
            id="pulse-dock-panel"
            className="pulse-dock-panel"
            role="dialog"
            aria-modal={desktop ? undefined : true}
            aria-label={t("title")}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <PulseChat
              key={`${locale}-${open ? "open" : "closed"}`}
              locale={locale}
              variant="dock"
              onClose={() => {
                setOpen(false);
                triggerRef.current?.focus();
              }}
            />
          </div>
        </div>
      ) : null}
    </>
  );
}

export function PulseDockWithProvider({
  ...props
}: {
  locale: "ar" | "en";
  initialOpen?: boolean;
}) {
  const catalogue = props.locale === "ar" ? arMessages : enMessages;
  return (
    <NextIntlClientProvider locale={props.locale} messages={{ pulse: catalogue.pulse }}>
      <PulseDock {...props} />
    </NextIntlClientProvider>
  );
}
