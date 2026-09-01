import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { BookingPanel } from "@/components/booking/booking-panel";
import { MessagesProvider } from "@/components/i18n/messages-provider";
import { Icon } from "@/components/ui/icon";
import { Ltr } from "@/components/ui/ltr";
import {
  availabilityForDoctor,
  clinicForDoctor,
  directoryDoctors,
  getDirectoryDoctors,
  localizedBio,
  localizedClinicAddress,
  localizedClinicDistrict,
  localizedSpecialty,
  localizedSubSpecialty,
  localizedTitle,
} from "@/lib/data/directory";
import { formatDateTime, formatMoney } from "@/lib/i18n/formatters";
import { formatNumerals } from "@/lib/i18n/numeral-format";
import { localizedAlternates, openGraph, physicianJsonLd } from "@/lib/seo";

export function generateStaticParams() {
  return directoryDoctors.map((doctor) => ({ slug: doctor.slug }));
}

export const revalidate = 30;

function initials(name: string) {
  return name
    .replace(/^Dr\.?\s|^د\.\s?/u, "")
    .split(" ")
    .slice(0, 2)
    .map((part) => part.slice(0, 1))
    .join(" ");
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale: requestedLocale, slug } = await params;
  const locale = requestedLocale === "ar" ? "ar" : "en";
  const doctor = getDirectoryDoctors().find((item) => item.slug === slug);
  if (!doctor) return {};
  const clinic = clinicForDoctor(doctor);
  if (!clinic) return {};
  const specialty = localizedSpecialty(doctor.specialties[0] ?? "", locale);
  const title = `${locale === "ar" ? doctor.nameAr : doctor.nameEn} · ${specialty}`;
  const description = `${localizedTitle(doctor.title, locale)} · ${localizedClinicDistrict(clinic, locale)} · ${doctor.fee.amount} EGP`;
  return {
    title,
    description,
    alternates: localizedAlternates(locale, `/doctor/${doctor.slug}`),
    openGraph: openGraph(locale, title, description, `/doctor/${doctor.slug}`),
  };
}

export default async function DoctorPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale: requestedLocale, slug } = await params;
  const locale = requestedLocale === "ar" ? "ar" : "en";
  setRequestLocale(locale);
  const doctors = getDirectoryDoctors();
  const doctor = doctors.find((item) => item.slug === slug);
  if (!doctor) notFound();
  const clinic = clinicForDoctor(doctor);
  if (!clinic || !doctor.nextAvailable) notFound();
  const common = await getTranslations("common");
  const page = await getTranslations("doctor");
  const slots = availabilityForDoctor(doctor.id, doctors).flatMap((day) =>
    day.slots.filter((slot) => slot.available).map((slot) => slot.start),
  );
  const name = locale === "ar" ? doctor.nameAr : doctor.nameEn;
  const clinicName = locale === "ar" ? clinic.nameAr : clinic.nameEn;
  const nextTime = formatDateTime(doctor.nextAvailable, {
    locale,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const nextDay = formatDateTime(doctor.nextAvailable, {
    locale,
    weekday: "long",
    day: "numeric",
    month: "short",
  });
  const jsonLd = JSON.stringify(physicianJsonLd(doctor, clinic, locale)).replaceAll("<", "\\u003c");

  return (
    <main className="doctor-profile">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
      <div className="profile-crumb shell">
        <Link href={`/${locale}/search`}>{common("search")}</Link>
        <Icon name="chevron" size={15} />
        <span>{name}</span>
      </div>

      <div className="shell profile-hero-grid">
        <section className="profile-identity">
          <div className="doctor-avatar profile-avatar" aria-hidden="true">
            <span>{initials(name)}</span>
            <i className="verified-dot">
              <Icon name="check" size={11} strokeWidth={2.8} />
            </i>
          </div>
          <div className="profile-identity-copy">
            <span className="availability-pill">
              <i className="status-dot" />
              {common("available")}
            </span>
            <h1 className="type-h1">{name}</h1>
            <p>
              {localizedTitle(doctor.title, locale)} ·{" "}
              {doctor.specialties.map((item) => localizedSpecialty(item, locale)).join("، ")}
            </p>
            <div className="profile-meta">
              <span>
                <Icon name="star" size={16} />
                <Ltr>{formatNumerals(doctor.rating.average, { locale })}</Ltr> (
                <Ltr>{formatNumerals(doctor.rating.count, { locale })}</Ltr> {common("reviews")})
              </span>
              <span>
                <Icon name="shield" size={16} />
                {page("experience", { years: formatNumerals(14, { locale }) })}
              </span>
            </div>
            <div className="profile-certainty">
              <span>
                <small>{common("fee")}</small>
                <strong>
                  <Ltr>{formatMoney({ ...doctor.fee, locale })}</Ltr>
                </strong>
              </span>
              <span>
                <small>{common("nextAvailable")}</small>
                <strong>
                  {nextDay} · <Ltr>{formatNumerals(nextTime, { locale })}</Ltr>
                </strong>
              </span>
            </div>
          </div>
        </section>
        <aside className="profile-booking">
          <MessagesProvider>
            <BookingPanel
              locale={locale}
              fee={doctor.fee.amount}
              doctor={{ id: doctor.id, name }}
              clinic={{
                id: clinic.id,
                name: clinicName,
                address: localizedClinicAddress(clinic, locale),
              }}
              slots={slots}
            />
          </MessagesProvider>
        </aside>
      </div>

      <div className="shell profile-details-grid">
        <div>
          <section className="profile-section">
            <h2>{page("about")}</h2>
            <p>{localizedBio(doctor.bio, locale)}</p>
          </section>
          <section className="profile-section">
            <h2>{page("subSpecialties")}</h2>
            <div className="profile-specialties">
              {doctor.subSpecialties.map((item) => (
                <span key={item}>{localizedSubSpecialty(item, locale)}</span>
              ))}
            </div>
          </section>
          <section className="profile-section profile-reviews">
            <h2>{page("reviewsHeading")}</h2>
            <blockquote>
              <p>{page("reviewOne")}</p>
              <footer>{page("verifiedVisit")}</footer>
            </blockquote>
            <blockquote>
              <p>{page("reviewTwo")}</p>
              <footer>{page("verifiedVisit")}</footer>
            </blockquote>
          </section>
        </div>
        <section className="profile-section clinic-address">
          <h2>{page("clinic")}</h2>
          <div>
            <span className="specialty-icon">
              <Icon name="pin" />
            </span>
            <p>
              <strong>{clinicName}</strong>
              {localizedClinicAddress(clinic, locale)}
            </p>
          </div>
          <div className="clinic-map" aria-hidden="true">
            <Icon name="pin" size={30} />
            <span>{localizedClinicDistrict(clinic, locale)}</span>
          </div>
          <Link href={`/${locale}/clinic/${clinic.slug}`}>{page("viewClinic")}</Link>
        </section>
      </div>
    </main>
  );
}
