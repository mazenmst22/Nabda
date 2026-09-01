import { setRequestLocale } from "next-intl/server";
import { Forbidden } from "@/components/layout/forbidden";
import { MessagesProvider } from "@/components/i18n/messages-provider";
import { PatientShell } from "@/components/layout/patient-shell";
import {
  getForbiddenLabels,
  getShellControls,
  getShellLabels,
} from "@/components/layout/shell-labels";
import { AuthorizationDeniedError, requireRole } from "@/lib/rbac/guard";
import "@/styles/patient.css";

export const dynamic = "force-dynamic";

export default async function PatientLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale: requestedLocale } = await params;
  const locale = requestedLocale === "ar" ? "ar" : "en";
  setRequestLocale(locale);
  try {
    const session = await requireRole(["patient"]);
    const [labels, controls] = await Promise.all([
      getShellLabels(locale),
      getShellControls(locale),
    ]);
    return (
      <MessagesProvider>
        <PatientShell locale={locale} session={session} labels={labels} {...controls}>
          {children}
        </PatientShell>
      </MessagesProvider>
    );
  } catch (error) {
    if (!(error instanceof AuthorizationDeniedError)) throw error;
    return <Forbidden locale={locale} labels={await getForbiddenLabels(locale)} />;
  }
}
