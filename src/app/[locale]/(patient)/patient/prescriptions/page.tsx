import { setRequestLocale } from "next-intl/server";
import { PrescriptionsList } from "@/components/patient/prescriptions-list";
import { getApprovedPatientPrescriptions } from "@/lib/patient/data";

export default async function PrescriptionsPage({
  params,
}: {
  params: Promise<{ locale: "ar" | "en" }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <PrescriptionsList locale={locale} prescriptions={getApprovedPatientPrescriptions()} />;
}
