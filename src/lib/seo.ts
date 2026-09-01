import type { Metadata } from "next";
import type { AppLocale } from "@/i18n/routing";
import type { Clinic, Doctor } from "@/lib/schemas";
import {
  localizedClinicAddress,
  localizedClinicDistrict,
  localizedSpecialty,
  localizedTitle,
} from "@/lib/data/directory";

export const SITE_URL = "https://nabda.health";

export function localizedAlternates(locale: AppLocale, path = ""): Metadata["alternates"] {
  const suffix = path.startsWith("/") ? path : `/${path}`;
  return {
    canonical: `${SITE_URL}/${locale}${suffix === "/" ? "" : suffix}`,
    languages: {
      ar: `${SITE_URL}/ar${suffix === "/" ? "" : suffix}`,
      en: `${SITE_URL}/en${suffix === "/" ? "" : suffix}`,
      "x-default": `${SITE_URL}/ar${suffix === "/" ? "" : suffix}`,
    },
  };
}

export function openGraph(
  locale: AppLocale,
  title: string,
  description: string,
  path = "",
): Metadata["openGraph"] {
  const suffix = path.startsWith("/") ? path : `/${path}`;
  return {
    type: "website",
    locale: locale === "ar" ? "ar_EG" : "en_EG",
    title,
    description,
    siteName: locale === "ar" ? "نبضة" : "Nabda",
    url: `${SITE_URL}/${locale}${suffix === "/" ? "" : suffix}`,
    images: [{ url: `${SITE_URL}/nabda-mark.svg`, width: 132, height: 116, alt: "Nabda" }],
  };
}

export function physicianJsonLd(doctor: Doctor, clinic: Clinic, locale: AppLocale) {
  const name = locale === "ar" ? doctor.nameAr : doctor.nameEn;
  return {
    "@context": "https://schema.org",
    "@type": "Physician",
    name,
    description: `${localizedTitle(doctor.title, locale)} · ${doctor.specialties.map((item) => localizedSpecialty(item, locale)).join(", ")}`,
    url: `${SITE_URL}/${locale}/doctor/${doctor.slug}`,
    medicalSpecialty: doctor.specialties,
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: doctor.rating.average,
      reviewCount: doctor.rating.count,
      bestRating: 5,
    },
    priceRange: `${doctor.fee.amount} EGP`,
    worksFor: { "@type": "MedicalClinic", name: locale === "ar" ? clinic.nameAr : clinic.nameEn },
  };
}

export function clinicJsonLd(clinic: Clinic, locale: AppLocale) {
  return {
    "@context": "https://schema.org",
    "@type": "MedicalClinic",
    name: locale === "ar" ? clinic.nameAr : clinic.nameEn,
    url: `${SITE_URL}/${locale}/clinic/${clinic.slug}`,
    telephone: clinic.phone,
    address: {
      "@type": "PostalAddress",
      streetAddress: localizedClinicAddress(clinic, locale),
      addressLocality: localizedClinicDistrict(clinic, locale),
      addressRegion: clinic.city,
      addressCountry: "EG",
    },
    openingHoursSpecification: clinic.hours.flatMap((hours) =>
      hours.periods.map((period) => ({
        "@type": "OpeningHoursSpecification",
        dayOfWeek: hours.day,
        opens: period.open,
        closes: period.close,
      })),
    ),
  };
}
