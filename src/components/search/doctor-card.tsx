import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { Ltr } from "@/components/ui/ltr";
import {
  localizedClinicDistrict,
  localizedSpecialty,
  localizedSubSpecialty,
  localizedTitle,
} from "@/lib/data/directory";
import { formatDateTime, formatMoney } from "@/lib/i18n/formatters";
import { formatNumerals } from "@/lib/i18n/numeral-format";
import type { Clinic, Doctor } from "@/lib/schemas";

export type DoctorCardLabels = {
  available: string;
  fee: string;
  reviews: string;
  nextAvailable: string;
  today: string;
  tomorrow: string;
  slotPrefix: string;
};

function initials(name: string) {
  return name
    .replace(/^Dr\.?\s|^د\.\s?/u, "")
    .split(" ")
    .slice(0, 2)
    .map((part) => part.slice(0, 1))
    .join(" ");
}

function cairoDay(iso: string) {
  return formatDateTime(iso, { locale: "en", year: "numeric", month: "2-digit", day: "2-digit" });
}

function relativeDayLabel(iso: string, labels: Pick<DoctorCardLabels, "today" | "tomorrow">) {
  const today = cairoDay(new Date().toISOString());
  const tomorrow = cairoDay(new Date(Date.now() + 86_400_000).toISOString());
  const target = cairoDay(iso);
  if (target === today) return labels.today;
  if (target === tomorrow) return labels.tomorrow;
  return target;
}

export function DoctorCard({
  doctor,
  clinic,
  locale,
  labels,
  compact = false,
  href,
  headingLevel = 3,
}: {
  doctor: Doctor;
  clinic: Clinic;
  locale: "ar" | "en";
  labels: DoctorCardLabels;
  compact?: boolean;
  href?: string;
  headingLevel?: 2 | 3;
}) {
  const name = locale === "ar" ? doctor.nameAr : doctor.nameEn;
  const next = doctor.nextAvailable;
  const time = next
    ? formatDateTime(next, { locale, hour: "2-digit", minute: "2-digit", hour12: false })
    : "—";
  const day = next ? relativeDayLabel(next, labels) : "—";
  const Heading = headingLevel === 2 ? "h2" : "h3";

  return (
    <article className={`doctor-card${compact ? " compact" : ""}`}>
      <div className="doctor-card-top">
        <div className="doctor-avatar" aria-hidden="true">
          <span>{initials(name)}</span>
          <i className="verified-dot">
            <Icon name="check" size={11} strokeWidth={2.8} />
          </i>
        </div>
        <div className="doctor-heading">
          <Heading>{name}</Heading>
          <p>{localizedTitle(doctor.title, locale)}</p>
        </div>
      </div>

      <div
        className="doctor-tags"
        aria-label={localizedSpecialty(doctor.specialties[0] ?? "", locale)}
      >
        {doctor.specialties.map((specialty) => (
          <span key={specialty}>{localizedSpecialty(specialty, locale)}</span>
        ))}
        {doctor.subSpecialties.slice(0, 1).map((specialty) => (
          <span key={specialty}>{localizedSubSpecialty(specialty, locale)}</span>
        ))}
      </div>

      <p className="doctor-district">
        <Icon name="pin" size={16} />
        {localizedClinicDistrict(clinic, locale)}
      </p>

      <div className="doctor-certainty-grid">
        <div className="fee-block">
          <small>{labels.fee}</small>
          <strong>
            <Ltr>{formatMoney({ ...doctor.fee, locale })}</Ltr>
          </strong>
        </div>
        <div className="rating-block">
          <small>{labels.reviews}</small>
          <strong>
            <Icon name="star" size={15} />
            <Ltr>{formatNumerals(doctor.rating.average.toFixed(1), { locale })}</Ltr>
            <span>
              (<Ltr>{formatNumerals(doctor.rating.count, { locale })}</Ltr>)
            </span>
          </strong>
        </div>
        <div className="next-slot">
          <small>{labels.nextAvailable}</small>
          <strong>
            <span>{day}</span> · <Ltr>{formatNumerals(time, { locale })}</Ltr>
          </strong>
        </div>
      </div>

      <Link
        prefetch={false}
        href={href ?? `/${locale}/doctor/${doctor.slug}`}
        className="slot-button"
      >
        <Icon name="calendar" size={18} />
        {labels.slotPrefix} <Ltr>{formatNumerals(time, { locale })}</Ltr>
      </Link>
    </article>
  );
}
