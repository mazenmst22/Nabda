"use client";

import { TimeSlotChip } from "@/components/ui";
import { formatDateTime } from "@/lib/i18n/formatters";
import { useNumerals } from "@/lib/i18n/numerals";

export function SlotPicker({
  locale,
  slots,
  selected,
  onSelect,
  labels,
}: {
  locale: "ar" | "en";
  slots: string[];
  selected: string;
  onSelect: (slot: string) => void;
  labels: { day: string; today: string; tomorrow: string; available: string; unavailable: string };
}) {
  const formatNumerals = useNumerals();
  return (
    <div className="shared-slot-picker">
      <div className="day-tabs" role="tablist" aria-label={labels.day}>
        <button type="button" role="tab" aria-selected="true" className="active">
          {labels.today}
        </button>
        <button type="button" role="tab" aria-selected="false">
          {labels.tomorrow}
        </button>
      </div>
      <div className="profile-slots" aria-label={labels.available}>
        {slots.map((slot) => {
          const time = formatNumerals(
            formatDateTime(slot, {
              locale,
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
            }),
          );
          return (
            <TimeSlotChip
              key={slot}
              time={time}
              state={selected === slot ? "selected" : "available"}
              unavailableLabel={labels.unavailable}
              onClick={() => onSelect(slot)}
            />
          );
        })}
      </div>
    </div>
  );
}
