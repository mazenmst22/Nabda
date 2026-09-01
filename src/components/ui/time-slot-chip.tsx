"use client";

import type { ButtonHTMLAttributes } from "react";
import { Icon } from "@/components/ui/icon";
import { Ltr } from "@/components/ui/ltr";

export type TimeSlotState = "available" | "selected" | "unavailable";

export function TimeSlotChip({
  time,
  state = "available",
  unavailableLabel,
  ...props
}: Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> & {
  time: string;
  state?: TimeSlotState;
  unavailableLabel: string;
}) {
  const unavailable = state === "unavailable";
  return (
    <button
      {...props}
      type="button"
      className={`ui-time-slot ui-time-slot--${state}`}
      disabled={unavailable || props.disabled}
      aria-pressed={state === "selected"}
      aria-label={unavailable ? `${time}, ${unavailableLabel}` : time}
    >
      {state === "selected" ? <Icon name="check" size={16} /> : null}
      {unavailable ? <Icon name="minus" size={16} /> : null}
      <Ltr>{time}</Ltr>
    </button>
  );
}
