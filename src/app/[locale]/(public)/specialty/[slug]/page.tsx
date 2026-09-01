import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { DoctorCard } from "@/components/search/doctor-card";
import { clinicForDoctor, directorySpecialties, getDirectoryDoctors } from "@/lib/data/directory";
import { localizedAlternates, openGraph } from "@/lib/seo";

export function generateStaticParams() {
  return directorySpecialties.map((specialty) => ({ slug: specialty.key }));
}

export const revalidate = 30;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale: requestedLocale, slug } = await params;
  const locale = requestedLocale === "ar" ? "ar" : "en";
  const specialty = directorySpecialties.find((item) => item.key === slug);
  if (!specialty) return {};
  const title = locale === "ar" ? specialty.nameAr : specialty.nameEn;
  const browse = await getTranslations({ locale, namespace: "browse" });
  return {
    title,
    description: browse("specialtyIntro", { specialty: title }),
    alternates: localizedAlternates(locale, `/specialty/${slug}`),
    openGraph: openGraph(
      locale,
      title,
      browse("specialtyIntro", { specialty: title }),
      `/specialty/${slug}`,
    ),
  };
}

export default async function SpecialtyPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale: requestedLocale, slug } = await params;
  const locale = requestedLocale === "ar" ? "ar" : "en";
  setRequestLocale(locale);
  const specialty = directorySpecialties.find((item) => item.key === slug);
  if (!specialty) notFound();
  const common = await getTranslations("common");
  const search = await getTranslations("searchPage");
  const page = await getTranslations("browse");
  const name = locale === "ar" ? specialty.nameAr : specialty.nameEn;
  const labels = {
    available: common("available"),
    fee: common("fee"),
    reviews: common("reviews"),
    nextAvailable: common("nextAvailable"),
    today: search("today"),
    tomorrow: search("tomorrow"),
    slotPrefix: search("slotPrefix"),
  };
  const doctors = getDirectoryDoctors().filter((doctor) => doctor.specialties.includes(slug));
  return (
    <main className="specialty-page shell">
      <header>
        <span className="section-index">SPECIALTY</span>
        <h1 className="type-display">{name}</h1>
        <p>{page("specialtyIntro", { specialty: name })}</p>
      </header>
      <div className="results-grid">
        {doctors.map((doctor) => {
          const clinic = clinicForDoctor(doctor);
          return clinic ? (
            <DoctorCard
              doctor={doctor}
              clinic={clinic}
              locale={locale}
              labels={labels}
              headingLevel={2}
              key={doctor.id}
            />
          ) : null;
        })}
      </div>
    </main>
  );
}
