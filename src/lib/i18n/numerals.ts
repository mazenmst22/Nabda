"use client";

import { useCallback, useSyncExternalStore } from "react";
import { useAppLocale } from "@/components/i18n/locale-provider";
import { formatNumerals, type NumeralFormatter, type NumeralPreference } from "./numeral-format";

export { formatNumerals } from "./numeral-format";
export type { NumeralFormatter, NumeralPreference } from "./numeral-format";

const STORAGE_KEY = "nabda-numerals";
const CHANGE_EVENT = "nabda:numerals-change";
const DEFAULT_PREFERENCE: NumeralPreference = "western";

function isNumeralPreference(value: string | null): value is NumeralPreference {
  return value === "western" || value === "eastern";
}

function getPreferenceSnapshot(): NumeralPreference {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return isNumeralPreference(stored) ? stored : DEFAULT_PREFERENCE;
  } catch {
    return DEFAULT_PREFERENCE;
  }
}

function subscribeToPreference(onChange: () => void) {
  function handleStorage(event: StorageEvent) {
    if (event.key === STORAGE_KEY) onChange();
  }

  window.addEventListener("storage", handleStorage);
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}

export function setNumeralPreference(preference: NumeralPreference) {
  try {
    window.localStorage.setItem(STORAGE_KEY, preference);
  } catch {
    // The in-memory event still lets the current document update when storage is unavailable.
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function useNumeralPreference() {
  return useSyncExternalStore(
    subscribeToPreference,
    getPreferenceSnapshot,
    () => DEFAULT_PREFERENCE,
  );
}

export function useNumerals(): NumeralFormatter {
  const locale = useAppLocale();
  const preference = useNumeralPreference();

  return useCallback(
    (value: number | string) => formatNumerals(value, { locale, preference }),
    [locale, preference],
  );
}
