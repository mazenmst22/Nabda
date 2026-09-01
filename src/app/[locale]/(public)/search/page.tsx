import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { SearchForm } from "@/components/search/search-form";
import { SearchResultsClient, type SearchLabels } from "@/components/search/search-results-client";
import { directoryClinics, directorySpecialties, getDirectoryDoctors } from "@/lib/data/directory";
import { localizedAlternates, openGraph } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: requestedLocale } = await params;
  const locale = requestedLocale === "ar" ? "ar" : "en";
  const page = await getTranslations({ locale, namespace: "searchPage" });
  return {
    title: page("metadataTitle"),
    description: page("metadataDescription"),
    alternates: localizedAlternates(locale, "/search"),
    openGraph: openGraph(locale, page("metadataTitle"), page("metadataDescription"), "/search"),
  };
}

export const revalidate = 30;

export default async function SearchPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ locale: requestedLocale }, query] = await Promise.all([params, searchParams]);
  const locale = requestedLocale === "ar" ? "ar" : "en";
  setRequestLocale(locale);
  const common = await getTranslations("common");
  const home = await getTranslations("home");
  const page = await getTranslations("searchPage");
  const doctors = getDirectoryDoctors();
  const labels: SearchLabels = {
    filters: page("filters"),
    sort: page("sort"),
    best: page("best"),
    soonest: page("soonest"),
    topRated: page("topRated"),
    feeLow: page("feeLow"),
    feeHigh: page("feeHigh"),
    specialty: page("specialty"),
    subSpecialty: page("subSpecialty"),
    area: page("area"),
    availability: page("availability"),
    any: page("any"),
    today: page("today"),
    tomorrow: page("tomorrow"),
    gender: page("gender"),
    all: page("all"),
    female: page("female"),
    male: page("male"),
    title: page("titleFilter"),
    feeRange: page("feeRange"),
    feeMin: page("feeMin"),
    feeMax: page("feeMax"),
    onlinePayment: page("onlinePayment"),
    clear: page("clear"),
    apply: page("apply"),
    close: common("close"),
    noResults: page("noResults"),
    noResultsText: page("noResultsText"),
    slotPrefix: page("slotPrefix"),
    available: common("available"),
    fee: common("fee"),
    reviews: common("reviews"),
    nextAvailable: common("nextAvailable"),
    askPulse: home("askPulse"),
    resultSummary: page("resultSummary"),
  };
  const initialQuery = typeof query.q === "string" ? query.q : "";

  return (
    <main className="search-page">
      <div className="search-top">
        <div className="shell">
          <SearchForm
            locale={locale}
            placeholder={common("search")}
            action={common("searchAction")}
            hint={home("searchHint")}
            initialQuery={initialQuery}
          />
        </div>
      </div>
      <div className="shell search-heading">
        <span className="section-index">DIRECTORY · CAIRO + GIZA</span>
        <h1 className="type-h1">{page("title")}</h1>
        <p>{page("resultCount")}</p>
      </div>
      <div className="shell">
        <SearchResultsClient
          locale={locale}
          labels={labels}
          doctors={doctors}
          clinics={directoryClinics}
          specialties={directorySpecialties}
        />
      </div>
    </main>
  );
}
