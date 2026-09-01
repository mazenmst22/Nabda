export const notificationLocales = ["ar", "en"] as const;
export const notificationChannels = ["sms", "email", "whatsapp"] as const;
export const notificationEvents = [
  "bookingConfirmed",
  "reminder24h",
  "reminder1h",
  "cancelled",
  "rescheduled",
  "prescriptionReady",
] as const;
export const notificationVariables = [
  "patient",
  "doctor",
  "clinic",
  "date",
  "time",
  "newDate",
  "newTime",
  "fee",
  "reference",
  "address",
] as const;

export type NotificationLocale = (typeof notificationLocales)[number];
export type NotificationChannel = (typeof notificationChannels)[number];
export type NotificationEvent = (typeof notificationEvents)[number];
export type NotificationVariable = (typeof notificationVariables)[number];

export type NotificationTemplate = {
  subject?: string;
  body: string;
};

export type NotificationTemplateCatalogue = Record<
  NotificationLocale,
  Record<NotificationEvent, Record<NotificationChannel, NotificationTemplate>>
>;

export type NotificationPreviewData = Record<
  NotificationLocale,
  Record<NotificationVariable, string>
>;

const placeholderPattern = /\{([a-zA-Z][a-zA-Z0-9]*)\}/gu;

export function extractTemplateVariables(template: string) {
  return [...template.matchAll(placeholderPattern)].map((match) => match[1] ?? "");
}

export function renderNotificationTemplate(
  template: string,
  values: Record<NotificationVariable, string>,
) {
  return template.replace(placeholderPattern, (placeholder, key: string) => {
    return key in values ? values[key as NotificationVariable] : placeholder;
  });
}

export type NotificationTemplatePart =
  { type: "text"; value: string } | { type: "variable"; key: NotificationVariable; value: string };

export function renderNotificationTemplateParts(
  template: string,
  values: Record<NotificationVariable, string>,
): NotificationTemplatePart[] {
  const parts: NotificationTemplatePart[] = [];
  let cursor = 0;
  for (const match of template.matchAll(placeholderPattern)) {
    const index = match.index;
    const key = match[1] as NotificationVariable | undefined;
    if (index > cursor) parts.push({ type: "text", value: template.slice(cursor, index) });
    if (key && key in values) parts.push({ type: "variable", key, value: values[key] });
    else parts.push({ type: "text", value: match[0] });
    cursor = index + match[0].length;
  }
  if (cursor < template.length) parts.push({ type: "text", value: template.slice(cursor) });
  return parts;
}

const gsmBasic = new Set(
  Array.from(
    "@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ !\"#¤%&'()*+,-./:;<=>?¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà",
  ),
);
const gsmExtended = new Set(Array.from("^{}\\[~]|€"));

export type SmsMetrics = {
  characters: number;
  units: number;
  segments: number;
  perSegment: number;
  encoding: "gsm-7" | "ucs-2";
};

export function calculateSmsSegments(value: string): SmsMetrics {
  const characters = Array.from(value);
  const gsm = characters.every(
    (character) => gsmBasic.has(character) || gsmExtended.has(character),
  );
  if (!gsm) {
    const units = value.length;
    const perSegment = units <= 70 ? 70 : 67;
    return {
      characters: characters.length,
      units,
      segments: units === 0 ? 0 : Math.ceil(units / perSegment),
      perSegment,
      encoding: "ucs-2",
    };
  }
  const units = characters.reduce(
    (total, character) => total + (gsmExtended.has(character) ? 2 : 1),
    0,
  );
  const perSegment = units <= 160 ? 160 : 153;
  return {
    characters: characters.length,
    units,
    segments: units === 0 ? 0 : Math.ceil(units / perSegment),
    perSegment,
    encoding: "gsm-7",
  };
}

export const ltrNotificationVariables = new Set<NotificationVariable>([
  "date",
  "time",
  "newDate",
  "newTime",
  "fee",
  "reference",
]);
