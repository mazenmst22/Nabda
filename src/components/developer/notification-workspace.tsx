"use client";

import { useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Badge, Button, Icon, Ltr, Select, StatusPill, Textarea } from "@/components/ui";
import { formatDateTime } from "@/lib/i18n/formatters";
import { useNumeralPreference, useNumerals } from "@/lib/i18n/numerals";
import {
  calculateSmsSegments,
  ltrNotificationVariables,
  notificationChannels,
  notificationEvents,
  notificationLocales,
  notificationVariables,
  renderNotificationTemplate,
  renderNotificationTemplateParts,
  type NotificationChannel,
  type NotificationEvent,
  type NotificationLocale,
  type NotificationPreviewData,
  type NotificationTemplate,
  type NotificationTemplateCatalogue,
  type NotificationVariable,
} from "@/lib/notifications/templates";

type DeliveryStatus = "delivered" | "sent" | "queued" | "failed";

const sendLog: Array<{
  id: string;
  event: NotificationEvent;
  channel: NotificationChannel;
  recipient: string;
  sentAt: string;
  status: DeliveryStatus;
}> = [
  {
    id: "NTF-00842",
    event: "bookingConfirmed",
    channel: "whatsapp",
    recipient: "+20 10 •••• 4567",
    sentAt: "2026-08-30T09:42:00Z",
    status: "delivered",
  },
  {
    id: "NTF-00841",
    event: "reminder24h",
    channel: "sms",
    recipient: "+20 11 •••• 2190",
    sentAt: "2026-08-30T09:37:00Z",
    status: "sent",
  },
  {
    id: "NTF-00840",
    event: "prescriptionReady",
    channel: "email",
    recipient: "a•••@example.com",
    sentAt: "2026-08-30T09:31:00Z",
    status: "delivered",
  },
  {
    id: "NTF-00839",
    event: "rescheduled",
    channel: "whatsapp",
    recipient: "+20 12 •••• 0031",
    sentAt: "2026-08-30T09:24:00Z",
    status: "queued",
  },
  {
    id: "NTF-00838",
    event: "cancelled",
    channel: "sms",
    recipient: "+20 10 •••• 8872",
    sentAt: "2026-08-30T09:18:00Z",
    status: "failed",
  },
  {
    id: "NTF-00837",
    event: "reminder1h",
    channel: "email",
    recipient: "m•••@example.com",
    sentAt: "2026-08-30T09:12:00Z",
    status: "sent",
  },
];

function TemplateText({
  template,
  values,
}: {
  template: string;
  values: NotificationPreviewData[NotificationLocale];
}) {
  return renderNotificationTemplateParts(template, values).map((part, index) =>
    part.type === "variable" && ltrNotificationVariables.has(part.key) ? (
      <Ltr key={`${part.key}-${index}`}>{part.value}</Ltr>
    ) : (
      <span key={`${part.type}-${index}`}>{part.value}</span>
    ),
  );
}

function ChannelMark({ channel }: { channel: NotificationChannel }) {
  const t = useTranslations("admin.notifications.ui");
  return (
    <span className={`notification-channel-mark notification-channel-mark--${channel}`}>
      <Icon name={channel === "sms" ? "phone" : "message"} size={16} />
      {t(`channels.${channel}`)}
    </span>
  );
}

function TemplatePreview({
  locale,
  channel,
  template,
  values,
  compact = false,
}: {
  locale: NotificationLocale;
  channel: NotificationChannel;
  template: NotificationTemplate;
  values: NotificationPreviewData[NotificationLocale];
  compact?: boolean;
}) {
  const t = useTranslations("admin.notifications.ui");
  const numerals = useNumerals();
  const body = renderNotificationTemplate(template.body, values);
  const metrics = channel === "sms" ? calculateSmsSegments(body) : null;
  const subject = template.subject
    ? renderNotificationTemplate(template.subject, values)
    : undefined;

  return (
    <article
      className={`notification-preview notification-preview--${channel} ${compact ? "is-compact" : ""}`}
      lang={locale}
      dir={locale === "ar" ? "rtl" : "ltr"}
      data-channel={channel}
      data-locale={locale}
    >
      <header>
        <ChannelMark channel={channel} />
        <Badge tone="neutral">{locale === "ar" ? t("locales.ar") : t("locales.en")}</Badge>
      </header>
      {channel === "email" ? (
        <div className="notification-email-chrome">
          <span>{t("email.subject")}</span>
          <strong>{subject}</strong>
          <small>{t("email.from", { clinic: values.clinic })}</small>
        </div>
      ) : null}
      <div className="notification-preview-body">
        <TemplateText template={template.body} values={values} />
      </div>
      {metrics ? (
        <footer className="notification-sms-metrics" data-sms-encoding={metrics.encoding}>
          <span>
            <strong>
              <Ltr>{numerals(metrics.characters)}</Ltr>
            </strong>
            {t("sms.characters")}
          </span>
          <span>
            <strong>
              <Ltr>{numerals(metrics.segments)}</Ltr>
            </strong>
            {t("sms.segments")}
          </span>
          <span>
            <Ltr>{metrics.encoding.toUpperCase()}</Ltr>
          </span>
        </footer>
      ) : null}
    </article>
  );
}

function TemplateEditor({
  catalogues,
  previewData,
  onSave,
}: {
  catalogues: NotificationTemplateCatalogue;
  previewData: NotificationPreviewData;
  onSave: (
    locale: NotificationLocale,
    event: NotificationEvent,
    channel: NotificationChannel,
    template: NotificationTemplate,
  ) => void;
}) {
  const t = useTranslations("admin.notifications.ui");
  const numerals = useNumerals();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [locale, setLocale] = useState<NotificationLocale>("ar");
  const [event, setEvent] = useState<NotificationEvent>("bookingConfirmed");
  const [channel, setChannel] = useState<NotificationChannel>("sms");
  const [draft, setDraft] = useState<NotificationTemplate>(catalogues.ar.bookingConfirmed.sms);
  const [announcement, setAnnouncement] = useState("");
  const metrics = calculateSmsSegments(renderNotificationTemplate(draft.body, previewData[locale]));

  function selectTemplate(
    nextLocale: NotificationLocale,
    nextEvent: NotificationEvent,
    nextChannel: NotificationChannel,
  ) {
    setLocale(nextLocale);
    setEvent(nextEvent);
    setChannel(nextChannel);
    setDraft(catalogues[nextLocale][nextEvent][nextChannel]);
  }

  function insertVariable(variable: NotificationVariable) {
    const input = textareaRef.current;
    const token = `{${variable}}`;
    const start = input?.selectionStart ?? draft.body.length;
    const end = input?.selectionEnd ?? start;
    setDraft((current) => ({
      ...current,
      body: `${current.body.slice(0, start)}${token}${current.body.slice(end)}`,
    }));
    requestAnimationFrame(() => {
      input?.focus();
      input?.setSelectionRange(start + token.length, start + token.length);
    });
  }

  function save() {
    onSave(locale, event, channel, draft);
    setAnnouncement(t("editor.saved", { template: t(`events.${event}`) }));
  }

  return (
    <div className="notification-editor-grid">
      <form className="notification-editor" onSubmit={(submission) => submission.preventDefault()}>
        <div className="sr-only" aria-live="polite">
          {announcement}
        </div>
        <div className="notification-editor-selectors">
          <label>
            <span>{t("editor.event")}</span>
            <Select
              value={event}
              onChange={(change) =>
                selectTemplate(locale, change.target.value as NotificationEvent, channel)
              }
            >
              {notificationEvents.map((item) => (
                <option key={item} value={item}>
                  {t(`events.${item}`)}
                </option>
              ))}
            </Select>
          </label>
          <label>
            <span>{t("editor.language")}</span>
            <Select
              value={locale}
              onChange={(change) =>
                selectTemplate(change.target.value as NotificationLocale, event, channel)
              }
            >
              {notificationLocales.map((item) => (
                <option key={item} value={item}>
                  {t(`locales.${item}`)}
                </option>
              ))}
            </Select>
          </label>
          <label>
            <span>{t("editor.channel")}</span>
            <Select
              value={channel}
              onChange={(change) =>
                selectTemplate(locale, event, change.target.value as NotificationChannel)
              }
            >
              {notificationChannels.map((item) => (
                <option key={item} value={item}>
                  {t(`channels.${item}`)}
                </option>
              ))}
            </Select>
          </label>
        </div>
        {channel === "email" ? (
          <label className="notification-editor-field">
            <span>{t("editor.subject")}</span>
            <Textarea
              value={draft.subject ?? ""}
              onChange={(change) => setDraft({ ...draft, subject: change.target.value })}
            />
          </label>
        ) : null}
        <label className="notification-editor-field">
          <span>{t("editor.body")}</span>
          <Textarea
            ref={textareaRef}
            value={draft.body}
            dir={locale === "ar" ? "rtl" : "ltr"}
            onChange={(change) => setDraft({ ...draft, body: change.target.value })}
          />
        </label>
        <fieldset className="notification-variable-picker">
          <legend>{t("editor.variables")}</legend>
          <p>{t("editor.variableHint")}</p>
          <div>
            {notificationVariables.map((variable) => (
              <button key={variable} type="button" onClick={() => insertVariable(variable)}>
                <Ltr>{`{${variable}}`}</Ltr>
                <span className="sr-only">{t(`variables.${variable}`)}</span>
              </button>
            ))}
          </div>
        </fieldset>
        {channel === "sms" ? (
          <div className="notification-sms-cost-warning" role="note">
            <Icon name="alert" size={18} />
            <div>
              <strong>{t("sms.costTitle")}</strong>
              <p>
                {t("sms.costWarning", {
                  unicodeEncoding: calculateSmsSegments("ا").encoding.toUpperCase(),
                  arabicLimit: numerals(70),
                  latinLimit: numerals(160),
                  latinEncoding: calculateSmsSegments("A").encoding.toUpperCase(),
                })}
              </p>
              <small>
                {t("sms.currentEncoding", {
                  encoding: metrics.encoding.toUpperCase(),
                  limit: numerals(metrics.perSegment),
                })}
              </small>
            </div>
          </div>
        ) : null}
        <Button leadingIcon="check" onClick={save}>
          {t("editor.save")}
        </Button>
      </form>
      <section className="notification-live-preview" aria-labelledby="notification-live-title">
        <header>
          <p className="type-label">{t("editor.live")}</p>
          <h3 id="notification-live-title">{t(`events.${event}`)}</h3>
          <p>{t("editor.liveDescription")}</p>
        </header>
        <TemplatePreview
          locale={locale}
          channel={channel}
          template={draft}
          values={previewData[locale]}
        />
      </section>
    </div>
  );
}

function TemplateGallery({
  catalogues,
  previewData,
}: {
  catalogues: NotificationTemplateCatalogue;
  previewData: NotificationPreviewData;
}) {
  const t = useTranslations("admin.notifications.ui");
  return (
    <div className="notification-template-gallery">
      {notificationEvents.map((event, eventIndex) => (
        <details key={event} open={eventIndex === 0} data-template-event={event}>
          <summary>
            <span>
              <Icon name="message" size={18} />
              {t(`events.${event}`)}
            </span>
            <Badge tone="neutral">{t("gallery.variantCount")}</Badge>
          </summary>
          <div className="notification-language-grid">
            {notificationLocales.map((locale) => (
              <section key={locale} lang={locale} dir={locale === "ar" ? "rtl" : "ltr"}>
                <h3>{t(`locales.${locale}`)}</h3>
                <div>
                  {notificationChannels.map((channel) => (
                    <TemplatePreview
                      key={channel}
                      locale={locale}
                      channel={channel}
                      template={catalogues[locale][event][channel]}
                      values={previewData[locale]}
                      compact
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        </details>
      ))}
    </div>
  );
}

function SendLog({ locale }: { locale: NotificationLocale }) {
  const t = useTranslations("admin.notifications.ui");
  const preference = useNumeralPreference();
  const [channel, setChannel] = useState<"all" | NotificationChannel>("all");
  const records = channel === "all" ? sendLog : sendLog.filter((row) => row.channel === channel);
  const statusMap: Record<DeliveryStatus, "completed" | "booked" | "held" | "cancelled"> = {
    delivered: "completed",
    sent: "booked",
    queued: "held",
    failed: "cancelled",
  };
  return (
    <div className="notification-send-log">
      <label className="notification-log-filter">
        <span>{t("log.channelFilter")}</span>
        <Select
          value={channel}
          onChange={(change) => setChannel(change.target.value as "all" | NotificationChannel)}
        >
          <option value="all">{t("log.allChannels")}</option>
          {notificationChannels.map((item) => (
            <option key={item} value={item}>
              {t(`channels.${item}`)}
            </option>
          ))}
        </Select>
      </label>
      <div className="notification-log-table" tabIndex={0} aria-label={t("log.tableRegion")}>
        <table>
          <caption className="sr-only">{t("log.table")}</caption>
          <thead>
            <tr>
              <th scope="col">{t("log.sentAt")}</th>
              <th scope="col">{t("log.template")}</th>
              <th scope="col">{t("log.channel")}</th>
              <th scope="col">{t("log.recipient")}</th>
              <th scope="col">{t("log.status")}</th>
              <th scope="col">{t("log.reference")}</th>
            </tr>
          </thead>
          <tbody>
            {records.map((row) => (
              <tr key={row.id}>
                <td>
                  <Ltr>
                    {formatDateTime(row.sentAt, {
                      locale,
                      numerals: preference,
                      dateStyle: "short",
                      timeStyle: "short",
                    })}
                  </Ltr>
                </td>
                <td>{t(`events.${row.event}`)}</td>
                <td>
                  <ChannelMark channel={row.channel} />
                </td>
                <td>
                  <Ltr>{row.recipient}</Ltr>
                </td>
                <td>
                  <StatusPill status={statusMap[row.status]} label={t(`statuses.${row.status}`)} />
                </td>
                <td>
                  <Ltr>{row.id}</Ltr>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function NotificationWorkspace({
  locale,
  initialCatalogues,
  previewData,
}: {
  locale: NotificationLocale;
  initialCatalogues: NotificationTemplateCatalogue;
  previewData: NotificationPreviewData;
}) {
  const t = useTranslations("admin.notifications.ui");
  const [catalogues, setCatalogues] = useState<NotificationTemplateCatalogue>(() =>
    structuredClone(initialCatalogues),
  );
  const [activeSection, setActiveSection] = useState<"editor" | "catalogue" | "log">("editor");
  const sections = useMemo(() => ["editor", "catalogue", "log"] as const, []);

  function saveTemplate(
    templateLocale: NotificationLocale,
    event: NotificationEvent,
    channel: NotificationChannel,
    template: NotificationTemplate,
  ) {
    setCatalogues((current) => ({
      ...current,
      [templateLocale]: {
        ...current[templateLocale],
        [event]: { ...current[templateLocale][event], [channel]: template },
      },
    }));
  }

  return (
    <main className="notification-workspace" id="main-content">
      <header className="notification-page-header">
        <div>
          <p className="type-label">{t("eyebrow")}</p>
          <h1>{t("title")}</h1>
          <p>{t("description")}</p>
        </div>
        <span className="notification-catalogue-mark">
          <Icon name="message" size={18} />
          {t("catalogueMark")}
        </span>
      </header>

      <nav className="notification-section-nav" aria-label={t("sections")}>
        {sections.map((section) => (
          <button
            key={section}
            type="button"
            aria-pressed={activeSection === section}
            onClick={() => setActiveSection(section)}
          >
            {t(`nav.${section}`)}
          </button>
        ))}
      </nav>

      {activeSection === "editor" ? (
        <section className="notification-panel" aria-labelledby="notification-editor-title">
          <header className="notification-panel-heading">
            <div>
              <p className="type-label">{t("editor.eyebrow")}</p>
              <h2 id="notification-editor-title">{t("editor.title")}</h2>
              <p>{t("editor.description")}</p>
            </div>
            <Badge tone="accent">{t("editor.catalogueBacked")}</Badge>
          </header>
          <TemplateEditor catalogues={catalogues} previewData={previewData} onSave={saveTemplate} />
        </section>
      ) : null}

      {activeSection === "catalogue" ? (
        <section className="notification-panel" aria-labelledby="notification-gallery-title">
          <header className="notification-panel-heading">
            <div>
              <p className="type-label">{t("gallery.eyebrow")}</p>
              <h2 id="notification-gallery-title">{t("gallery.title")}</h2>
              <p>{t("gallery.description")}</p>
            </div>
            <Badge tone="accent">{t("gallery.coverage")}</Badge>
          </header>
          <TemplateGallery catalogues={catalogues} previewData={previewData} />
        </section>
      ) : null}

      {activeSection === "log" ? (
        <section className="notification-panel" aria-labelledby="notification-log-title">
          <header className="notification-panel-heading">
            <div>
              <p className="type-label">{t("log.eyebrow")}</p>
              <h2 id="notification-log-title">{t("log.title")}</h2>
              <p>{t("log.description")}</p>
            </div>
            <StatusPill status="completed" label={t("log.live")} />
          </header>
          <SendLog locale={locale} />
        </section>
      ) : null}
    </main>
  );
}
