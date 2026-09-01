import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { AppointmentDetail } from "@/components/patient/appointment-detail";
import { getPatientAppointment } from "@/lib/patient/data";

export const dynamic = "force-dynamic";

export default async function AppointmentPage({
  params,
}: {
  params: Promise<{ locale: "ar" | "en"; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const appointment = getPatientAppointment(id);
  if (!appointment || appointment.patientId !== "patient-amal") notFound();
  const base = Date.parse(appointment.start) + 24 * 60 * 60 * 1000;
  const slots = [0, 1, 3, 4].map((offset) =>
    new Date(base + offset * 30 * 60 * 1000).toISOString(),
  );
  return <AppointmentDetail locale={locale} initialAppointment={appointment} slots={slots} />;
}
