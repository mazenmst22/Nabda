import { setRequestLocale } from "next-intl/server";
import { PatientProfile } from "@/components/patient/patient-profile";

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ locale: "ar" | "en" }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <PatientProfile locale={locale} />;
}
