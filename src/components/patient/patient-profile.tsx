"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Icon, Ltr } from "@/components/ui";
import {
  formatNumerals,
  setNumeralPreference,
  useNumeralPreference,
  useNumerals,
  type NumeralPreference,
} from "@/lib/i18n/numerals";

export function PatientProfile({ locale }: { locale: "ar" | "en" }) {
  const t = useTranslations("patient");
  const preference = useNumeralPreference();
  const numerals = useNumerals();
  const otherLocale = locale === "ar" ? "en" : "ar";

  function chooseNumerals(value: NumeralPreference) {
    setNumeralPreference(value);
  }

  return (
    <main className="patient-workspace" id="profile">
      <header className="patient-page-header">
        <div>
          <p className="type-label">{t("account")}</p>
          <h1>{t("profile")}</h1>
          <p>{t("profileIntro")}</p>
        </div>
      </header>
      <div className="patient-profile-grid">
        <section className="patient-section patient-profile-card" aria-labelledby="personal-title">
          <div className="patient-profile-avatar" aria-hidden="true">
            أ م
          </div>
          <div>
            <h2 id="personal-title">{t("patientName")}</h2>
            <p>{t("patientSince", { year: numerals(2024) })}</p>
          </div>
          <dl>
            <div>
              <dt>{t("phone")}</dt>
              <dd>
                <Ltr>{numerals("+20 100 123 4567")}</Ltr>
              </dd>
            </div>
            <div>
              <dt>{t("email")}</dt>
              <dd>
                <Ltr>amal@example.com</Ltr>
              </dd>
            </div>
            <div>
              <dt>{t("dateOfBirth")}</dt>
              <dd>
                <Ltr>{numerals("17/04/1989")}</Ltr>
              </dd>
            </div>
          </dl>
        </section>
        <section className="patient-section patient-language-card" aria-labelledby="language-title">
          <div className="patient-section-heading">
            <div>
              <h2 id="language-title">{t("languageAndNumbers")}</h2>
              <p>{t("languageAndNumbersText")}</p>
            </div>
            <Icon name="system" />
          </div>
          <fieldset>
            <legend>{t("language")}</legend>
            <div className="patient-choice-grid">
              <span className="patient-choice is-selected" aria-current="true">
                <strong>{locale === "ar" ? "العربية" : "English"}</strong>
                <small>{t("current")}</small>
              </span>
              <Link className="patient-choice" href={`/${otherLocale}/patient/profile`}>
                <strong>{otherLocale === "ar" ? "العربية" : "English"}</strong>
                <small>{t("switchLanguage")}</small>
              </Link>
            </div>
          </fieldset>
          <fieldset>
            <legend>{t("numeralSystem")}</legend>
            <div className="patient-choice-grid">
              {(["western", "eastern"] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  className={`patient-choice${preference === value ? " is-selected" : ""}`}
                  aria-pressed={preference === value}
                  onClick={() => chooseNumerals(value)}
                >
                  <strong>{t(`numerals.${value}`)}</strong>
                  <Ltr>{formatNumerals("123", { locale, preference: value })}</Ltr>
                </button>
              ))}
            </div>
            <p className="patient-numeral-preview">
              {t("preview")} <Ltr>{numerals("09:30 · EGP 450 · 17/04/1989")}</Ltr>
            </p>
          </fieldset>
        </section>
      </div>
    </main>
  );
}
