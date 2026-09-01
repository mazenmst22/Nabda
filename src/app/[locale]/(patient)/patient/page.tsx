import { setRequestLocale } from "next-intl/server";
import { PatientDashboard } from "@/components/patient/patient-dashboard";
import {
  getApprovedPatientPrescriptions,
  getPatientAppointments,
  getPatientEncounterSummaries,
} from "@/lib/patient/data";

export const dynamic = "force-dynamic";

export default async function PatientWorkspacePage({
  params,
}: {
  params: Promise<{ locale: "ar" | "en" }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <PatientDashboard
      locale={locale}
      appointments={getPatientAppointments()}
      prescriptionCount={getApprovedPatientPrescriptions().length}
      encounterCount={getPatientEncounterSummaries().length}
    />
  );
}
