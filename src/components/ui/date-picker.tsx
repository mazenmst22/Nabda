"use client";

import { useId, useMemo, useRef, useState } from "react";
import type { AppLocale } from "@/i18n/routing";
import { Icon } from "@/components/ui/icon";

type DatePickerLabels = {
  open: string;
  previousMonth: string;
  nextMonth: string;
  chooseDate: string;
};

function isoDate(date: Date) {
  const year = String(date.getFullYear());
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseDate(value?: string) {
  if (!value) return new Date();
  const [year, month, day] = value.split("-").map(Number);
  return year && month && day ? new Date(year, month - 1, day, 12) : new Date();
}

export function DatePicker({
  locale,
  value,
  onChange,
  labels,
  formatNumber,
}: {
  locale: AppLocale;
  value?: string;
  onChange?: (value: string) => void;
  labels: DatePickerLabels;
  formatNumber: (value: number | string) => string;
}) {
  const id = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [viewDate, setViewDate] = useState(() => parseDate(value));
  const selectedDate = parseDate(value);
  const localeTag = `${locale}-EG-u-ca-gregory-nu-latn`;
  const monthLabel = new Intl.DateTimeFormat(localeTag, { month: "long", year: "numeric" }).format(
    viewDate,
  );
  const selectedLabel = value
    ? new Intl.DateTimeFormat(localeTag, { day: "numeric", month: "long", year: "numeric" }).format(
        selectedDate,
      )
    : labels.open;
  const weekdays = useMemo(() => {
    const saturday = new Date(2026, 7, 29, 12);
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(saturday);
      date.setDate(saturday.getDate() + index);
      return new Intl.DateTimeFormat(localeTag, { weekday: "short" }).format(date);
    });
  }, [localeTag]);
  const first = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1, 12);
  const leading = (first.getDay() + 1) % 7;
  const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
  const cells = Array.from({ length: 42 }, (_, index) => {
    const day = index - leading + 1;
    return day >= 1 && day <= daysInMonth ? day : null;
  });

  function moveMonth(offset: number) {
    setViewDate((date) => new Date(date.getFullYear(), date.getMonth() + offset, 1, 12));
  }

  function choose(day: number) {
    const next = new Date(viewDate.getFullYear(), viewDate.getMonth(), day, 12);
    onChange?.(isoDate(next));
    setOpen(false);
  }

  return (
    <div
      className="ui-date-picker"
      onKeyDown={(event) => {
        if (event.key === "Escape" && open) {
          event.preventDefault();
          setOpen(false);
          triggerRef.current?.focus();
        }
      }}
    >
      <button
        ref={triggerRef}
        type="button"
        className="ui-date-picker__trigger"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={`${id}-calendar`}
        onClick={() => setOpen((current) => !current)}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown") {
            event.preventDefault();
            setOpen(true);
          }
        }}
      >
        <Icon name="calendar" size={19} />
        <span>{selectedLabel}</span>
        <Icon name="chevron-down" size={17} />
      </button>
      {open ? (
        <div
          id={`${id}-calendar`}
          className="ui-date-picker__popover"
          role="dialog"
          aria-label={labels.chooseDate}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              event.preventDefault();
              setOpen(false);
              triggerRef.current?.focus();
              return;
            }
            if (!["ArrowDown", "ArrowUp", "ArrowLeft", "ArrowRight"].includes(event.key)) return;
            const target = event.target as HTMLElement;
            if (!target.hasAttribute("data-calendar-day") || target.tagName !== "BUTTON") return;
            const buttons = Array.from(
              event.currentTarget.querySelectorAll<HTMLButtonElement>("button[data-calendar-day]"),
            );
            const index = buttons.indexOf(target as HTMLButtonElement);
            const direction = document.documentElement.dir === "rtl" ? -1 : 1;
            const offset =
              event.key === "ArrowDown"
                ? 7
                : event.key === "ArrowUp"
                  ? -7
                  : event.key === "ArrowRight"
                    ? direction
                    : -direction;
            const next = buttons[index + offset];
            if (next) {
              event.preventDefault();
              next.focus();
            }
          }}
        >
          <div className="ui-date-picker__month">
            <button type="button" aria-label={labels.previousMonth} onClick={() => moveMonth(-1)}>
              <Icon name="chevron" size={18} />
            </button>
            <strong aria-live="polite">{monthLabel}</strong>
            <button type="button" aria-label={labels.nextMonth} onClick={() => moveMonth(1)}>
              <Icon name="chevron" size={18} />
            </button>
          </div>
          <div className="ui-date-picker__grid">
            {weekdays.map((weekday) => (
              <span className="ui-date-picker__weekday" key={weekday}>
                {weekday}
              </span>
            ))}
            {cells.map((day, index) =>
              day ? (
                <button
                  type="button"
                  data-calendar-day=""
                  key={`${viewDate.getMonth()}-${day}`}
                  aria-current={
                    value ===
                    isoDate(new Date(viewDate.getFullYear(), viewDate.getMonth(), day, 12))
                      ? "date"
                      : undefined
                  }
                  aria-label={new Intl.DateTimeFormat(localeTag, {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  }).format(new Date(viewDate.getFullYear(), viewDate.getMonth(), day, 12))}
                  onClick={() => choose(day)}
                >
                  {formatNumber(day)}
                </button>
              ) : (
                <span key={`empty-${index}`} />
              ),
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
