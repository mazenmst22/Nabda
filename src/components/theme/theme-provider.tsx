"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type ThemePreference = "system" | "light" | "dark";
type ResolvedTheme = "light" | "dark";

type ThemeContextValue = {
  theme: ThemePreference;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: ThemePreference) => void;
};

const STORAGE_KEY = "nabda-theme";
const DARK_QUERY = "(prefers-color-scheme: dark)";
const ThemeContext = createContext<ThemeContextValue | null>(null);

function isThemePreference(value: string | null): value is ThemePreference {
  return value === "system" || value === "light" || value === "dark";
}

function readStoredTheme(): ThemePreference {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return isThemePreference(stored) ? stored : "system";
  } catch {
    return "system";
  }
}

function resolveTheme(theme: ThemePreference): ResolvedTheme {
  if (theme !== "system") return theme;
  return window.matchMedia(DARK_QUERY).matches ? "dark" : "light";
}

function applyTheme(theme: ThemePreference) {
  const root = document.documentElement;
  root.dataset.themePreference = theme;

  if (theme === "system") root.removeAttribute("data-theme");
  else root.dataset.theme = theme;

  root.dataset.resolvedTheme = resolveTheme(theme);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemePreference>("system");
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>("light");

  const setTheme = useCallback((nextTheme: ThemePreference) => {
    setThemeState(nextTheme);
    applyTheme(nextTheme);
    setResolvedTheme(resolveTheme(nextTheme));

    try {
      window.localStorage.setItem(STORAGE_KEY, nextTheme);
    } catch {
      // The live preference still applies when storage is unavailable.
    }
  }, []);

  useEffect(() => {
    const initialTheme = readStoredTheme();
    const media = window.matchMedia(DARK_QUERY);
    setThemeState(initialTheme);
    applyTheme(initialTheme);
    setResolvedTheme(resolveTheme(initialTheme));

    function handleSystemChange() {
      if (readStoredTheme() !== "system") return;
      applyTheme("system");
      setResolvedTheme(resolveTheme("system"));
    }

    media.addEventListener("change", handleSystemChange);
    return () => media.removeEventListener("change", handleSystemChange);
  }, []);

  const value = useMemo(
    () => ({ theme, resolvedTheme, setTheme }),
    [resolvedTheme, setTheme, theme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used inside ThemeProvider");
  return context;
}
