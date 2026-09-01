import type { AppLocale } from "@/i18n/routing";

export type NumeralPreference = "western" | "eastern";
export type NumeralFormatter = (value: number | string) => string;

export function localeWithNumerals(locale: AppLocale, preference: NumeralPreference) {
  const numberingSystem = preference === "eastern" ? "arab" : "latn";
  return `${locale}-EG-u-nu-${numberingSystem}`;
}

export function formatNumerals(
  value: number | string,
  { locale, preference = "western" }: { locale: AppLocale; preference?: NumeralPreference },
) {
  const localeTag = localeWithNumerals(locale, preference);
  const numberFormatter = new Intl.NumberFormat(localeTag);

  if (typeof value === "number") return numberFormatter.format(value);

  const digitFormatter = new Intl.NumberFormat(localeTag, { useGrouping: false });
  return value.replace(/\d/gu, (digit) => digitFormatter.format(Number(digit)));
}
