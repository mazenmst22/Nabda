"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { AppLocale } from "@/i18n/routing";

const LocaleContext = createContext<AppLocale>("ar");

export function LocaleProvider({ locale, children }: { locale: AppLocale; children: ReactNode }) {
  return <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>;
}

export function useAppLocale() {
  return useContext(LocaleContext);
}
