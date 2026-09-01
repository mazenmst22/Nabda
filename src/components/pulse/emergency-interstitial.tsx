"use client";

import { useTranslations } from "next-intl";
import { Icon, Ltr } from "@/components/ui";
import { useNumerals } from "@/lib/i18n/numerals";

export function EmergencyInterstitial() {
  const t = useTranslations("pulse");
  const numerals = useNumerals();
  const ambulance = process.env.NEXT_PUBLIC_EMERGENCY_AMBULANCE ?? "123";
  const police = process.env.NEXT_PUBLIC_EMERGENCY_POLICE ?? "122";

  return (
    <section className="pulse-emergency" role="alert" aria-labelledby="pulse-emergency-title">
      <span className="pulse-emergency-icon">
        <Icon name="phone" size={25} />
      </span>
      <div>
        <p className="type-label">{t("emergency.label")}</p>
        <h2 id="pulse-emergency-title">{t("emergency.title")}</h2>
        <p>{t("emergency.text")}</p>
      </div>
      <div className="pulse-emergency-actions">
        <a className="ui-button ui-button--danger" href={`tel:${ambulance}`}>
          <Icon name="phone" size={18} />
          <span>
            {t("emergency.ambulance")} <Ltr>{numerals(ambulance)}</Ltr>
          </span>
        </a>
        <a className="ui-button ui-button--secondary" href={`tel:${police}`}>
          <Icon name="shield" size={18} />
          <span>
            {t("emergency.police")} <Ltr>{numerals(police)}</Ltr>
          </span>
        </a>
      </div>
      <p className="pulse-emergency-lock">
        <Icon name="alert" size={17} />
        {t("emergency.noContinue")}
      </p>
    </section>
  );
}
