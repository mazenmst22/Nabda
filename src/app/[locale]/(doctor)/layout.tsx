import { setRequestLocale } from "next-intl/server";
import { Forbidden } from "@/components/layout/forbidden";
import { MessagesProvider } from "@/components/i18n/messages-provider";
import {
  getForbiddenLabels,
  getShellControls,
  getShellLabels,
} from "@/components/layout/shell-labels";
import { StaffShell } from "@/components/layout/staff-shell";
import { AuthorizationDeniedError, requireRole } from "@/lib/rbac/guard";
import "@/styles/doctor.css";

export const dynamic = "force-dynamic";

export default async function DoctorWorkspaceLayout({
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
    const session = await requireRole(["doctor", "clinic_admin"]);
    const [labels, controls] = await Promise.all([
      getShellLabels(locale),
      getShellControls(locale),
    ]);
    return (
      <MessagesProvider>
        <StaffShell kind="doctor" locale={locale} session={session} labels={labels} {...controls}>
          {children}
        </StaffShell>
      </MessagesProvider>
    );
  } catch (error) {
    if (!(error instanceof AuthorizationDeniedError)) throw error;
    return <Forbidden locale={locale} labels={await getForbiddenLabels(locale)} />;
  }
}
