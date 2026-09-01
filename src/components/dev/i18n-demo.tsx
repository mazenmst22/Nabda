"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { Plural } from "@/components/i18n/plural";
import { Ltr } from "@/components/ui/ltr";
import type { AppLocale } from "@/i18n/routing";
import { formatDateTime, formatMoney, formatRelative } from "@/lib/i18n/formatters";
import { useNumerals } from "@/lib/i18n/numerals";

const APPOINTMENT_ISO = "2026-08-28T16:30:00Z";
const REFERENCE_NOW = "2026-08-28T16:10:00Z";
const PHONE_NUMBER = "+20 2 1234 5678";

export function I18nDemo({ locale }: { locale: AppLocale }) {
  const t = useTranslations("admin.i18nDemo");
  const common = useTranslations("common");
  const formatNumerals = useNumerals();
  const time = formatNumerals(
    formatDateTime(APPOINTMENT_ISO, {
      locale,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }),
  );
  const price = formatNumerals(formatMoney({ amount: 450, currency: "EGP", locale }));
  const phone = formatNumerals(PHONE_NUMBER);
  const relative = formatNumerals(formatRelative(APPOINTMENT_ISO, { locale, now: REFERENCE_NOW }));

  return (
    <main className="i18n-demo-page">
      <header className="i18n-demo-header">
        <div>
          <span className="type-label">{t("kicker")}</span>
          <h1 className="type-display">{t("title")}</h1>
          <p>{t("intro")}</p>
        </div>
        <LanguageSwitcher locale={locale} label={common("language")} className="language-link" />
      </header>

      <section className="i18n-demo-card" aria-labelledby="bidi-demo-heading">
        <h2 id="bidi-demo-heading" className="sr-only">
          {t("kicker")}
        </h2>
        <p className="i18n-demo-sentence">
          {t.rich("sentence", {
            time,
            price,
            phone,
            timeTag: (chunks) => <Ltr>{chunks}</Ltr>,
            priceTag: (chunks) => <Ltr>{chunks}</Ltr>,
            phoneTag: (chunks) => <Ltr>{chunks}</Ltr>,
          })}
        </p>
        <dl className="i18n-demo-details">
          <div>
            <dt>{t("relativeLabel")}</dt>
            <dd>{relative}</dd>
          </div>
          <div>
            <dt>{t("pluralLabel")}</dt>
            <dd>
              <Plural namespace="booking" id="appointmentCount" count={3} />
            </dd>
          </div>
        </dl>
      </section>

      <Link className="i18n-demo-back" href={`/${locale}/dev/tokens`}>
        {t("back")}
      </Link>
    </main>
  );
}
