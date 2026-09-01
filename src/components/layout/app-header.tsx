"use client";

import Image from "next/image";
import Link from "next/link";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { ThemeSwitcher } from "@/components/theme/theme-switcher";

type HeaderLabels = {
  brand: string;
  home: string;
  specialties: string;
  clinics: string;
  help: string;
  signIn: string;
  language: string;
  theme: string;
  themeSystem: string;
  themeLight: string;
  themeDark: string;
};

export function AppHeader({ locale, labels }: { locale: "ar" | "en"; labels: HeaderLabels }) {
  return (
    <header className="site-header">
      <div className="shell header-inner">
        <Link
          prefetch={false}
          href={`/${locale}`}
          className="brand-lockup"
          aria-label={labels.brand}
        >
          <Image src="/nabda-mark.svg" width={45} height={40} alt="" priority />
          <span>{labels.brand}</span>
        </Link>

        <nav className="desktop-nav" aria-label={labels.home}>
          <Link prefetch={false} href={`/${locale}`} className="nav-link is-active">
            {labels.home}
          </Link>
          <Link prefetch={false} href={`/${locale}/specialties`} className="nav-link">
            {labels.specialties}
          </Link>
          <Link prefetch={false} href={`/${locale}/for-clinics`} className="nav-link">
            {labels.clinics}
          </Link>
          <Link prefetch={false} href={`/${locale}/help`} className="nav-link">
            {labels.help}
          </Link>
        </nav>

        <div className="header-actions">
          <LanguageSwitcher locale={locale} label={labels.language} className="language-link" />
          <ThemeSwitcher
            compact
            labels={{
              label: labels.theme,
              system: labels.themeSystem,
              light: labels.themeLight,
              dark: labels.themeDark,
            }}
          />
          <Link prefetch={false} className="sign-in-button" href={`/${locale}/search`}>
            {labels.signIn}
          </Link>
        </div>
      </div>
    </header>
  );
}
