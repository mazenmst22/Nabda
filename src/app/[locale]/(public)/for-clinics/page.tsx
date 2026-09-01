import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Icon } from "@/components/ui/icon";
import { Ltr } from "@/components/ui/ltr";
import { formatNumerals } from "@/lib/i18n/numeral-format";
import { localizedAlternates, openGraph } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: requestedLocale } = await params;
  const locale = requestedLocale === "ar" ? "ar" : "en";
  const page = await getTranslations({ locale, namespace: "forClinics" });
  return {
    title: page("title"),
    description: page("intro"),
    alternates: localizedAlternates(locale, "/for-clinics"),
    openGraph: openGraph(locale, page("title"), page("intro"), "/for-clinics"),
  };
}

export default async function ForClinicsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: requestedLocale } = await params;
  const locale = requestedLocale === "ar" ? "ar" : "en";
  setRequestLocale(locale);
  const page = await getTranslations("forClinics");
  return (
    <main className="for-clinics-page">
      <section className="for-clinics-hero shell">
        <span>{page("kicker")}</span>
        <h1 className="type-display">{page("title")}</h1>
        <p>{page("intro")}</p>
        <Link href={`/${locale}/about`}>
          {page("action")}
          <Icon name="arrow" size={18} />
        </Link>
      </section>
      <section className="clinic-proof-row shell">
        {[
          { value: "1", label: page("proofOne") },
          { value: "0", label: page("proofTwo") },
          { value: "24/7", label: page("proofThree") },
        ].map((item) => (
          <div key={item.label}>
            <strong>
              <Ltr>{formatNumerals(item.value, { locale })}</Ltr>
            </strong>
            <span>{item.label}</span>
          </div>
        ))}
      </section>
      <section className="clinic-capabilities shell">
        {["schedule", "queue", "pulse"].map((key, index) => (
          <article key={key}>
            <span>
              <Ltr>{formatNumerals(`0${index + 1}`, { locale })}</Ltr>
            </span>
            <h2>{page(`${key}Title`)}</h2>
            <p>{page(`${key}Text`)}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
