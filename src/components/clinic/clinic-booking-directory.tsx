"use client";

import { useState } from "react";
import { BookingPanel } from "@/components/booking/booking-panel";
import { Icon } from "@/components/ui/icon";
import { Ltr } from "@/components/ui/ltr";
import { availabilityForDoctor, localizedSpecialty, localizedTitle } from "@/lib/data/directory";
import { formatMoney } from "@/lib/i18n/formatters";
import type { Clinic, Doctor } from "@/lib/schemas";

export function ClinicBookingDirectory({
  locale,
  doctors,
  clinic,
  labels,
}: {
  locale: "ar" | "en";
  doctors: Doctor[];
  clinic: Clinic & { localizedName: string; localizedAddress: string };
  labels: { doctors: string; chooseDoctor: string; selected: string; fee: string };
}) {
  const [selectedId, setSelectedId] = useState(doctors[0]?.id ?? "");
  const selected = doctors.find((doctor) => doctor.id === selectedId) ?? doctors[0];
  if (!selected) return null;
  const slots = availabilityForDoctor(selected.id, doctors).flatMap((day) =>
    day.slots.filter((slot) => slot.available).map((slot) => slot.start),
  );

  return (
    <section className="clinic-doctors-section" id="booking">
      <div className="clinic-section-heading">
        <span>{labels.chooseDoctor}</span>
        <h2>{labels.doctors}</h2>
      </div>
      <div className="clinic-booking-grid">
        <div className="clinic-doctor-list">
          {doctors.map((doctor) => {
            const active = doctor.id === selected.id;
            return (
              <button
                type="button"
                className={active ? "is-selected" : undefined}
                aria-pressed={active}
                onClick={() => setSelectedId(doctor.id)}
                key={doctor.id}
              >
                <span className="clinic-doctor-avatar" aria-hidden="true">
                  <Icon name="doctor" />
                </span>
                <span>
                  <strong>{locale === "ar" ? doctor.nameAr : doctor.nameEn}</strong>
                  <small>
                    {localizedTitle(doctor.title, locale)} ·{" "}
                    {localizedSpecialty(doctor.specialties[0] ?? "", locale)}
                  </small>
                </span>
                <span className="clinic-doctor-fee">
                  <small>{labels.fee}</small>
                  <Ltr>{formatMoney({ ...doctor.fee, locale })}</Ltr>
                </span>
                {active ? (
                  <span className="clinic-selected-label">
                    <Icon name="check" size={15} />
                    {labels.selected}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
        <aside>
          <BookingPanel
            key={selected.id}
            locale={locale}
            fee={selected.fee.amount}
            doctor={{
              id: selected.id,
              name: locale === "ar" ? selected.nameAr : selected.nameEn,
            }}
            clinic={{
              id: clinic.id,
              name: clinic.localizedName,
              address: clinic.localizedAddress,
            }}
            slots={slots}
          />
        </aside>
      </div>
    </section>
  );
}
