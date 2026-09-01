import type { CSSProperties } from "react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ClinicBookingDirectory } from "@/components/clinic/clinic-booking-directory";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { MessagesProvider } from "@/components/i18n/messages-provider";
import { Icon } from "@/components/ui/icon";
import { Ltr } from "@/components/ui/ltr";
import {
  directoryClinics,
  getDirectoryDoctors,
  localizedClinicAddress,
  localizedClinicDistrict,
} from "@/lib/data/directory";
import { formatNumerals } from "@/lib/i18n/numeral-format";
import { clinicJsonLd, localizedAlternates, openGraph } from "@/lib/seo";

type ClinicStyle = CSSProperties & { "--clinic-accent": string };

export function generateStaticParams() {
  return directoryClinics.map((clinic) => ({ slug: clinic.slug }));
}

export const revalidate = 30;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale: requestedLocale, slug } = await params;
  const locale = requestedLocale === "ar" ? "ar" : "en";
  const clinic = directoryClinics.find((item) => item.slug === slug);
  if (!clinic) return {};
  const title = locale === "ar" ? clinic.nameAr : clinic.nameEn;
  const description = `${localizedClinicAddress(clinic, locale)} · ${localizedClinicDistrict(clinic, locale)}`;
  return {
    title,
    description,
    alternates: localizedAlternates(locale, `/clinic/${clinic.slug}`),
    openGraph: openGraph(locale, title, description, `/clinic/${clinic.slug}`),
  };
}

export default async function ClinicPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale: requestedLocale, slug } = await params;
  const locale = requestedLocale === "ar" ? "ar" : "en";
  setRequestLocale(locale);
  const clinic = directoryClinics.find((item) => item.slug === slug);
  if (!clinic) notFound();
  const doctors = getDirectoryDoctors().filter((doctor) => doctor.clinicId === clinic.id);
  const common = await getTranslations("common");
  const page = await getTranslations("clinicPage");
  const name = locale === "ar" ? clinic.nameAr : clinic.nameEn;
  const jsonLd = JSON.stringify(clinicJsonLd(clinic, locale)).replaceAll("<", "\\u003c");
  const accent = clinic.theme?.accent ?? "var(--brand-teal)";

  return (
    <div className="clinic-page" style={{ "--clinic-accent": accent } as ClinicStyle}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
      <header className="clinic-header">
        <Link href={`/${locale}/clinic/${clinic.slug}`} className="clinic-brand">
          <span aria-hidden="true">{name.slice(0, 1)}</span>
          <strong>{name}</strong>
        </Link>
        <div>
          <a href={`tel:${clinic.phone}`}>
            <Icon name="phone" size={18} />
            <Ltr>{clinic.phone}</Ltr>
          </a>
          <LanguageSwitcher
            locale={locale}
            label={common("language")}
            className="clinic-language"
          />
        </div>
      </header>

      <main>
        <section className="clinic-hero">
          <div>
            <span className="clinic-eyebrow">
              <Icon name="shield" size={16} />
              {page("scheduleSource")}
            </span>
            <h1>{name}</h1>
            <p>
              <Icon name="pin" size={18} />
              {localizedClinicAddress(clinic, locale)} · {localizedClinicDistrict(clinic, locale)}
            </p>
            <a className="clinic-primary" href="#booking">
              {page("bookDirectly")}
              <Icon name="arrow" size={18} />
            </a>
          </div>
          <div className="clinic-hours-card">
            <h2>{page("hours")}</h2>
            <dl>
              {clinic.hours.map((hours) => (
                <div key={hours.day}>
                  <dt>{page(`days.${hours.day}`)}</dt>
                  <dd>
                    {hours.periods.length
                      ? hours.periods.map((period) => (
                          <Ltr key={period.open}>
                            {formatNumerals(`${period.open}–${period.close}`, { locale })}
                          </Ltr>
                        ))
                      : page("closed")}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <MessagesProvider>
          <ClinicBookingDirectory
            locale={locale}
            doctors={doctors}
            clinic={{
              ...clinic,
              localizedName: name,
              localizedAddress: localizedClinicAddress(clinic, locale),
            }}
            labels={{
              doctors: page("doctors"),
              chooseDoctor: page("chooseDoctor"),
              selected: page("selected"),
              fee: common("fee"),
            }}
          />
        </MessagesProvider>
      </main>

      <footer className="clinic-footer">
        <span>{page("licence")}</span>
        <Link href={`/${locale}`}>
          <small>{common("poweredBy")}</small>
          <Image src="/nabda-mark.svg" width={28} height={25} alt="" />
          Nabda
        </Link>
      </footer>
    </div>
  );
}
