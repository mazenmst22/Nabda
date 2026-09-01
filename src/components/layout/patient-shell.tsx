"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { ThemeSwitcher } from "@/components/theme/theme-switcher";
import { Icon, type IconName } from "@/components/ui/icon";
import type { AuthSession } from "@/lib/auth/session";
import { SessionProvider } from "@/lib/auth/session-provider";

export type ShellLabels = {
  workspace: string;
  overview: string;
  appointments: string;
  prescriptions: string;
  notifications: string;
  messages: string;
  profile: string;
  today: string;
  queue: string;
  doctors: string;
  patients: string;
  reports: string;
  developerTools: string;
  apiExplorer: string;
  componentLibrary: string;
  tokens: string;
  clinic: string;
  clinicMaadi: string;
  globalSearch: string;
  shortcuts: string;
  shortcutsTitle: string;
  shortcutsDescription: string;
  shortcutSearch: string;
  shortcutHelp: string;
  close: string;
  sessionTitle: string;
  sessionDescription: string;
  renew: string;
  renewing: string;
  renewalFailed: string;
  configuration: string;
  stepUpTitle: string;
  stepUpDescription: string;
  stepUpVerify: string;
  stepUpVerifying: string;
  stepUpCancel: string;
  stepUpFailed: string;
  stepUpVerified: string;
  environment: string;
  secureWorkspace: string;
};

type PatientNavItem = { label: string; href: string; icon: IconName };

export function PatientShell({
  locale,
  session,
  labels,
  themeLabels,
  languageLabel,
  children,
}: {
  locale: "ar" | "en";
  session: AuthSession;
  labels: ShellLabels;
  themeLabels: { label: string; system: string; light: string; dark: string };
  languageLabel: string;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const base = `/${locale}/patient`;
  const nav: PatientNavItem[] = [
    { label: labels.appointments, href: base, icon: "calendar" },
    { label: labels.prescriptions, href: `${base}/prescriptions`, icon: "plus" },
    { label: labels.notifications, href: `${base}/notifications`, icon: "message" },
    { label: labels.profile, href: `${base}/profile`, icon: "user" },
  ];

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
      <div className="app-shell patient-shell" data-shell="patient">
        <aside className="patient-sidebar">
          <Link className="workspace-brand" href={`/${locale}`} aria-label="Nabda">
            <Image src="/nabda-mark.svg" width={39} height={35} alt="" />
            <span>Nabda</span>
          </Link>
          <p className="shell-context">{labels.workspace}</p>
          <nav className="shell-nav" aria-label={labels.workspace}>
            {nav.map((item) => {
              const active =
                item.href === base
                  ? pathname === base || pathname.startsWith(`${base}/appointments/`)
                  : pathname === item.href;
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
          <div className="shell-user">
            <span aria-hidden="true">{session.user.name.slice(0, 1)}</span>
            <div>
              <strong>{session.user.name}</strong>
              <small>{labels.profile}</small>
            </div>
          </div>
        </aside>

        <header className="patient-topbar">
          <Link className="workspace-brand" href={`/${locale}`} aria-label="Nabda">
            <Image src="/nabda-mark.svg" width={37} height={33} alt="" />
            <span>Nabda</span>
          </Link>
          <div className="shell-tools">
            <LanguageSwitcher locale={locale} label={languageLabel} className="language-link" />
            <ThemeSwitcher compact labels={themeLabels} />
          </div>
        </header>

        <div className="shell-main">{children}</div>

        <nav className="patient-tabs" aria-label={labels.workspace}>
          {nav.map((item) => {
            const active =
              item.href === base
                ? pathname === base || pathname.startsWith(`${base}/appointments/`)
                : pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={active ? "is-active" : undefined}
                aria-current={active ? "page" : undefined}
              >
                <Icon name={item.icon} size={20} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </SessionProvider>
  );
}
