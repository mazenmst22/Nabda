import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Icon } from "@/components/ui/icon";
import { directorySpecialties, specialtyIcons } from "@/lib/data/directory";
import { localizedAlternates, openGraph } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: requestedLocale } = await params;
  const locale = requestedLocale === "ar" ? "ar" : "en";
  const page = await getTranslations({ locale, namespace: "browse" });
  return {
    title: page("title"),
    description: page("intro"),
    alternates: localizedAlternates(locale, "/specialties"),
    openGraph: openGraph(locale, page("title"), page("intro"), "/specialties"),
  };
}

export default async function SpecialtiesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: requestedLocale } = await params;
  const locale = requestedLocale === "ar" ? "ar" : "en";
  setRequestLocale(locale);
  const page = await getTranslations("browse");
  return (
    <main className="browse-page shell">
      <header>
        <span className="section-index">SPECIALTIES</span>
        <h1 className="type-display">{page("title")}</h1>
        <p>{page("intro")}</p>
      </header>
      <div className="browse-specialty-grid">
        {directorySpecialties.map((specialty) => (
          <Link href={`/${locale}/specialty/${specialty.key}`} key={specialty.key}>
            <span>
              <Icon name={specialtyIcons[specialty.key] ?? "plus"} size={26} />
            </span>
            <strong>{locale === "ar" ? specialty.nameAr : specialty.nameEn}</strong>
            <Icon name="arrow" size={18} />
          </Link>
        ))}
      </div>
    </main>
  );
}
