import { getTranslations } from "next-intl/server";
import type { AppLocale } from "@/i18n/routing";
import { formatNumerals } from "@/lib/i18n/numeral-format";
import type { ShellLabels } from "./patient-shell";

const shellKeys = [
  "workspace",
  "overview",
  "appointments",
  "prescriptions",
  "notifications",
  "messages",
  "profile",
  "today",
  "queue",
  "doctors",
  "patients",
  "reports",
  "developerTools",
  "apiExplorer",
  "componentLibrary",
  "tokens",
  "clinic",
  "clinicMaadi",
  "globalSearch",
  "shortcuts",
  "shortcutsTitle",
  "shortcutsDescription",
  "shortcutSearch",
  "shortcutHelp",
  "close",
  "sessionTitle",
  "sessionDescription",
  "renew",
  "renewing",
  "renewalFailed",
  "configuration",
  "stepUpTitle",
  "stepUpDescription",
  "stepUpVerify",
  "stepUpVerifying",
  "stepUpCancel",
  "stepUpFailed",
  "stepUpVerified",
  "environment",
  "secureWorkspace",
] as const satisfies readonly (keyof ShellLabels)[];

export async function getShellLabels(locale: AppLocale): Promise<ShellLabels> {
  const t = await getTranslations({ locale, namespace: "common.shells" });
  return Object.fromEntries(shellKeys.map((key) => [key, t(key)])) as unknown as ShellLabels;
}

export async function getShellControls(locale: AppLocale) {
  const t = await getTranslations({ locale, namespace: "common" });
  return {
    languageLabel: t("language"),
    themeLabels: {
      label: t("theme"),
      system: t("themeSystem"),
      light: t("themeLight"),
      dark: t("themeDark"),
    },
  };
}

export async function getForbiddenLabels(locale: AppLocale) {
  const t = await getTranslations({ locale, namespace: "common.shells" });
  return { title: t("forbiddenTitle"), text: t("forbiddenText"), back: t("forbiddenBack") };
}

export async function getPublicShellLabels(locale: AppLocale) {
  const common = await getTranslations({ locale, namespace: "common" });
  const footer = await getTranslations({ locale, namespace: "footer" });
  return {
    header: {
      brand: common("brand"),
      home: common("home"),
      specialties: common("specialties"),
      clinics: common("clinics"),
      help: common("help"),
      signIn: common("signIn"),
      language: common("language"),
      theme: common("theme"),
      themeSystem: common("themeSystem"),
      themeLight: common("themeLight"),
      themeDark: common("themeDark"),
    },
    footer: {
      brand: common("brand"),
      tagline: common("tagline"),
      about: footer("about"),
      patients: footer("patients"),
      legal: footer("legal"),
      privacy: footer("privacy"),
      terms: footer("terms"),
      contact: footer("contact"),
      licence: footer("licence"),
      copyright: footer("copyright", { year: formatNumerals(2026, { locale }) }),
    },
  };
}
