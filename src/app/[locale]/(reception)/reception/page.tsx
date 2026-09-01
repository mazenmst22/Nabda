import { setRequestLocale } from "next-intl/server";
import { ReceptionWorkspace } from "@/components/reception/reception-workspace";
import {
  getReceptionAppointments,
  getReceptionQueue,
  receptionDoctors,
  receptionPatients,
} from "@/lib/reception/data";

export const dynamic = "force-dynamic";

export default async function ReceptionWorkspacePage({
  params,
}: {
  params: Promise<{ locale: "ar" | "en" }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <ReceptionWorkspace
      locale={locale}
      doctors={receptionDoctors}
      initialPatients={receptionPatients}
      initialAppointments={getReceptionAppointments()}
      initialQueue={getReceptionQueue()}
    />
  );
}
