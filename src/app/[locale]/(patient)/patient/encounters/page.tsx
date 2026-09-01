import { setRequestLocale } from "next-intl/server";
import { EncounterList } from "@/components/patient/encounter-list";
import { getPatientEncounterSummaries } from "@/lib/patient/data";

export default async function EncountersPage({
  params,
}: {
  params: Promise<{ locale: "ar" | "en" }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <EncounterList locale={locale} encounters={getPatientEncounterSummaries()} />;
}
