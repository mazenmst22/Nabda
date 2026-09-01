import { setRequestLocale } from "next-intl/server";
import { DoctorWorkspace } from "@/components/doctor/doctor-workspace";
import {
  doctorAppointments,
  doctorEncounters,
  doctorPatient,
  doctorPrescriptions,
  doctorTimeline,
} from "@/lib/doctor/data";

export const dynamic = "force-dynamic";

export default async function DoctorWorkspacePage({
  params,
}: {
  params: Promise<{ locale: "ar" | "en" }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <DoctorWorkspace
      locale={locale}
      patient={doctorPatient}
      appointments={doctorAppointments}
      timeline={doctorTimeline}
      encounters={doctorEncounters}
      prescriptions={doctorPrescriptions}
    />
  );
}
