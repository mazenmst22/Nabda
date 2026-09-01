"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { ThemeSwitcher } from "@/components/theme/theme-switcher";
import { Icon, type IconName } from "@/components/ui/icon";
import { IconButton } from "@/components/ui/button";
import { Dialog } from "@/components/ui/overlay";
import type { AuthSession } from "@/lib/auth/session";
import { SessionProvider } from "@/lib/auth/session-provider";
import { StepUpReauthentication } from "@/lib/auth/step-up";
import { Can } from "@/lib/rbac/can";
import type { ShellLabels } from "./patient-shell";

type StaffKind = "reception" | "doctor" | "developer";
type StaffNavItem = { label: string; href: string; icon: IconName };

function navigation(kind: StaffKind, locale: "ar" | "en", labels: ShellLabels): StaffNavItem[] {
  if (kind === "developer") {
    return [
      { label: labels.developerTools, href: `/${locale}/developer`, icon: "code" },
      {
        label: labels.notifications,
        href: `/${locale}/developer/notifications`,
        icon: "message",
      },
      { label: labels.apiExplorer, href: `/${locale}/developer#api`, icon: "search" },
      { label: labels.componentLibrary, href: `/${locale}/dev/ui`, icon: "grid" },
      { label: labels.tokens, href: `/${locale}/dev/tokens`, icon: "spark" },
    ];
  }
  const base = `/${locale}/${kind}`;
  return [
    { label: labels.today, href: base, icon: "calendar" },
    { label: labels.queue, href: `${base}#queue`, icon: "queue" },
    { label: labels.appointments, href: `${base}#appointments`, icon: "clock" },
    { label: labels.patients, href: `${base}#patients`, icon: "users" },
    ...(kind === "reception"
      ? [{ label: labels.doctors, href: `${base}#doctors`, icon: "doctor" as const }]
      : []),
    { label: labels.reports, href: `${base}#reports`, icon: "chart" },
  ];
}

export function StaffShell({
  kind,
  locale,
  session,
  labels,
  themeLabels,
  languageLabel,
  children,
}: {
  kind: StaffKind;
  locale: "ar" | "en";
  session: AuthSession;
  labels: ShellLabels;
  themeLabels: { label: string; system: string; light: string; dark: string };
  languageLabel: string;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [helpOpen, setHelpOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const nav = navigation(kind, locale, labels);
  const developer = kind === "developer";

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const isEditing = target?.matches("input, textarea, select, [contenteditable='true']");
      if (event.key === "/" && !isEditing) {
        event.preventDefault();
        const workspaceSearch = document.querySelector<HTMLInputElement>("[data-reception-search]");
        (kind === "reception" ? workspaceSearch : null)?.focus();
        if (kind !== "reception" || !workspaceSearch) searchRef.current?.focus();
      }
      if (event.key === "?" && !isEditing) {
        event.preventDefault();
        setHelpOpen(true);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [kind]);

  return (
    <SessionProvider
      initialSession={session}
      labels={{
        title: labels.sessionTitle,
        description: labels.sessionDescription,
        renew: labels.renew,
        renewing: labels.renewing,
        failed: labels.renewalFailed,
      }}
    >
      <div className="app-shell staff-shell" data-shell={developer ? "developer" : "staff"}>
        <aside className="staff-sidebar">
          <Link className="workspace-brand" href={`/${locale}`} aria-label="Nabda">
            <Image src="/nabda-mark.svg" width={39} height={35} alt="" />
            <span>Nabda</span>
          </Link>
          <p className="shell-context">{developer ? labels.environment : labels.secureWorkspace}</p>
          <nav className="shell-nav" aria-label={labels.workspace}>
            {nav.map((item, index) => {
              const active = pathname === item.href.split("#")[0] && (developer || index === 0);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={active ? "is-active" : undefined}
                  aria-current={active ? "page" : undefined}
                >
                  <Icon name={item.icon} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
          {!developer ? (
            <Can resource="clinic_configuration" action="manage">
              <div className="staff-privileged-action">
                <StepUpReauthentication
                  labels={{
                    action: labels.configuration,
                    title: labels.stepUpTitle,
                    description: labels.stepUpDescription,
                    verify: labels.stepUpVerify,
                    verifying: labels.stepUpVerifying,
                    cancel: labels.stepUpCancel,
                    close: labels.close,
                    failed: labels.stepUpFailed,
                    verified: labels.stepUpVerified,
                  }}
                />
              </div>
            </Can>
          ) : null}
          <div className="shell-user">
            <span aria-hidden="true">{session.user.name.slice(0, 1)}</span>
            <div>
              <strong>{session.user.name}</strong>
              <small>{session.roles.join(" · ")}</small>
            </div>
          </div>
        </aside>

        <header className="staff-topbar">
          <label className="global-search">
            <span className="sr-only">{labels.globalSearch}</span>
            <Icon name="search" size={19} />
            <input ref={searchRef} type="search" placeholder={labels.globalSearch} />
            <kbd>/</kbd>
          </label>
          <label className="clinic-switcher">
            <span>{labels.clinic}</span>
            <select aria-label={labels.clinic} defaultValue={session.clinicId ?? "platform"}>
              <option value={session.clinicId ?? "platform"}>
                {developer ? labels.environment : labels.clinicMaadi}
              </option>
            </select>
          </label>
          <div className="shell-tools">
            {!developer ? (
              <>
                <LanguageSwitcher locale={locale} label={languageLabel} className="language-link" />
                <ThemeSwitcher compact labels={themeLabels} />
              </>
            ) : null}
            <IconButton
              label={labels.shortcuts}
              icon="keyboard"
              onClick={() => setHelpOpen(true)}
            />
          </div>
        </header>

        <div className="shell-main">{children}</div>
      </div>

      <Dialog
        open={helpOpen}
        onOpenChange={setHelpOpen}
        title={labels.shortcutsTitle}
        description={labels.shortcutsDescription}
        closeLabel={labels.close}
      >
        <dl className="shortcut-list">
          <div>
            <dt>
              <kbd>/</kbd>
            </dt>
            <dd>{labels.shortcutSearch}</dd>
          </div>
          <div>
            <dt>
              <kbd>?</kbd>
            </dt>
            <dd>{labels.shortcutHelp}</dd>
          </div>
          {kind === "reception" ? (
            <>
              <div>
                <dt>
                  <kbd>N</kbd>
                </dt>
                <dd>{locale === "ar" ? "إنشاء موعد" : "Create appointment"}</dd>
              </div>
              <div>
                <dt>
                  <kbd>J</kbd> <kbd>K</kbd>
                </dt>
                <dd>{locale === "ar" ? "التنقل في قائمة الانتظار" : "Move through the queue"}</dd>
              </div>
              <div>
                <dt>
                  <kbd>Enter</kbd>
                </dt>
                <dd>{locale === "ar" ? "استدعاء المريض التالي" : "Call the next patient"}</dd>
              </div>
            </>
          ) : null}
        </dl>
      </Dialog>
    </SessionProvider>
  );
}
