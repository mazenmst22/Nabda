"use client";

import { Icon } from "@/components/ui/icon";
import { type ThemePreference, useTheme } from "@/components/theme/theme-provider";

export type ThemeLabels = {
  label: string;
  system: string;
  light: string;
  dark: string;
};

const options: Array<{ value: ThemePreference; icon: "system" | "sun" | "moon" }> = [
  { value: "system", icon: "system" },
  { value: "light", icon: "sun" },
  { value: "dark", icon: "moon" },
];

export function ThemeSwitcher({
  labels,
  compact = false,
}: {
  labels: ThemeLabels;
  compact?: boolean;
}) {
  const { theme, setTheme } = useTheme();

  if (compact) {
    return (
      <label className="theme-select-wrap" title={labels.label} suppressHydrationWarning>
        <span className="sr-only">{labels.label}</span>
        <Icon name={options.find((option) => option.value === theme)?.icon ?? "system"} size={19} />
        <select
          aria-label={labels.label}
          value={theme}
          onChange={(event) => setTheme(event.target.value as ThemePreference)}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {labels[option.value]}
            </option>
          ))}
        </select>
      </label>
    );
  }

  return (
    <div className="theme-switcher" role="group" aria-label={labels.label} suppressHydrationWarning>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={theme === option.value}
          onClick={() => setTheme(option.value)}
        >
          <Icon name={option.icon} size={18} />
          <span>{labels[option.value]}</span>
        </button>
      ))}
    </div>
  );
}
