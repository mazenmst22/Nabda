"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Button, Icon, Ltr } from "@/components/ui";
import type { IconName } from "@/components/ui/icon";

const channels = ["sms", "email", "whatsapp"] as const;
const events = ["confirmed", "reminder24", "reminder1", "cancelled", "prescription"] as const;
type PreferenceKey = `${(typeof channels)[number]}:${(typeof events)[number]}`;

const mandatory = new Set<PreferenceKey>(["sms:confirmed", "sms:cancelled"]);
const defaults = new Set<PreferenceKey>([
  ...mandatory,
  "sms:reminder24",
  "sms:reminder1",
  "sms:prescription",
  "email:confirmed",
  "email:reminder24",
  "email:prescription",
  "whatsapp:confirmed",
  "whatsapp:reminder24",
  "whatsapp:cancelled",
]);

export function NotificationPreferences() {
  const t = useTranslations("patient");
  const [enabled, setEnabled] = useState(() => new Set(defaults));
  const [saved, setSaved] = useState(false);
  const rows = useMemo<Array<{ channel: (typeof channels)[number]; icon: IconName }>>(
    () => channels.map((channel) => ({ channel, icon: channel === "sms" ? "phone" : "message" })),
    [],
  );

  function toggle(key: PreferenceKey) {
    if (mandatory.has(key)) return;
    setSaved(false);
    setEnabled((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function save() {
    try {
      window.localStorage.setItem("nabda.notification-preferences", JSON.stringify([...enabled]));
    } catch {
      // The current session still reflects the chosen preferences.
    }
    setSaved(true);
  }

  return (
    <main className="patient-workspace">
      <header className="patient-page-header">
        <div>
          <p className="type-label">{t("preferences")}</p>
          <h1>{t("notifications")}</h1>
          <p>{t("notificationsIntro")}</p>
        </div>
      </header>
      <section
        className="patient-section patient-notifications"
        aria-labelledby="notification-matrix-title"
      >
        <div className="patient-section-heading">
          <div>
            <h2 id="notification-matrix-title">{t("notificationMatrix")}</h2>
            <p>{t("clinicDefaults")}</p>
          </div>
          <span className="patient-required-note">
            <Icon name="shield" size={17} />
            {t("mandatoryNote")}
          </span>
        </div>
        <div className="patient-matrix-scroll">
          <table className="patient-notification-matrix">
            <thead>
              <tr>
                <th scope="col">{t("channel")}</th>
                {events.map((event) => (
                  <th scope="col" key={event}>
                    {t(`events.${event}`)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(({ channel, icon }) => (
                <tr key={channel}>
                  <th scope="row">
                    <Icon name={icon} size={18} />
                    {channel === "sms" ? (
                      <Ltr>{t(`channels.${channel}`)}</Ltr>
                    ) : (
                      t(`channels.${channel}`)
                    )}
                  </th>
                  {events.map((event) => {
                    const key: PreferenceKey = `${channel}:${event}`;
                    const required = mandatory.has(key);
                    return (
                      <td key={event}>
                        <label className="patient-matrix-toggle">
                          <input
                            type="checkbox"
                            checked={enabled.has(key)}
                            disabled={required}
                            onChange={() => toggle(key)}
                            aria-label={t("preferenceLabel", {
                              channel: t(`channels.${channel}`),
                              event: t(`events.${event}`),
                            })}
                          />
                          <span aria-hidden="true">
                            <Icon name={enabled.has(key) ? "check" : "minus"} size={15} />
                          </span>
                          {required ? <small>{t("required")}</small> : null}
                        </label>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="patient-preference-footer">
          <p role="status">{saved ? t("preferencesSaved") : t("preferencesUnsaved")}</p>
          <Button onClick={save}>{t("savePreferences")}</Button>
        </div>
      </section>
    </main>
  );
}
