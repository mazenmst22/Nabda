import type { AppLocale } from "@/i18n/routing";
import { localeWithNumerals, type NumeralPreference } from "./numeral-format";

export const CAIRO_TIME_ZONE = "Africa/Cairo";

type Money = {
  amount: number;
  currency: "EGP";
};

type LocaleFormattingOptions = {
  locale?: AppLocale;
  numerals?: NumeralPreference;
};

type DateTimeOptions = Omit<Intl.DateTimeFormatOptions, "timeZone"> & LocaleFormattingOptions;
type RelativeOptions = LocaleFormattingOptions & { now?: Date | string };

const LTR_ISOLATE = String.fromCodePoint(0x2066);
const POP_DIRECTIONAL_ISOLATE = String.fromCodePoint(0x2069);
const BIDI_CONTROL_CHARACTERS = /[\u061c\u200e\u200f\u202a-\u202e\u2066-\u2069]/gu;

function localeTag(locale: AppLocale = "ar", numerals: NumeralPreference = "western") {
  return localeWithNumerals(locale, numerals);
}

function parseUtcIso(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) throw new RangeError("Expected a valid UTC ISO timestamp");
  return date;
}

function isolateLtr(value: string) {
  const cleanValue = value.replace(BIDI_CONTROL_CHARACTERS, "");
  return `${LTR_ISOLATE}${cleanValue}${POP_DIRECTIONAL_ISOLATE}`;
}

export function formatMoney({
  amount,
  currency,
  locale = "ar",
  numerals = "western",
}: Money & LocaleFormattingOptions) {
  const formatted = new Intl.NumberFormat(localeTag(locale, numerals), {
    style: "currency",
    currency,
    currencyDisplay: "code",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);

  return isolateLtr(formatted);
}

export function formatDateTime(
  iso: string,
  { locale = "ar", numerals = "western", ...options }: DateTimeOptions = {},
) {
  return new Intl.DateTimeFormat(localeTag(locale, numerals), {
    ...options,
    timeZone: CAIRO_TIME_ZONE,
  }).format(parseUtcIso(iso));
}

export function formatRelative(
  iso: string,
  { locale = "ar", numerals = "western", now = new Date() }: RelativeOptions = {},
) {
  const target = parseUtcIso(iso);
  const reference = now instanceof Date ? now : parseUtcIso(now);
  const differenceMs = target.getTime() - reference.getTime();
  const absoluteMs = Math.abs(differenceMs);
  let unit: Intl.RelativeTimeFormatUnit;
  let divisor: number;

  if (absoluteMs < 60_000) {
    unit = "second";
    divisor = 1_000;
  } else if (absoluteMs < 3_600_000) {
    unit = "minute";
    divisor = 60_000;
  } else if (absoluteMs < 86_400_000) {
    unit = "hour";
    divisor = 3_600_000;
  } else {
    unit = "day";
    divisor = 86_400_000;
  }

  return new Intl.RelativeTimeFormat(localeTag(locale, numerals), { numeric: "always" }).format(
    Math.round(differenceMs / divisor),
    unit,
  );
}
