import { setRequestLocale } from "next-intl/server";
import { PublicShell } from "@/components/layout/public-shell";
import { getPublicShellLabels } from "@/components/layout/shell-labels";

export default async function PublicLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale: requestedLocale } = await params;
  const locale = requestedLocale === "ar" ? "ar" : "en";
  setRequestLocale(locale);
  return (
    <PublicShell locale={locale} labels={await getPublicShellLabels(locale)}>
      {children}
    </PublicShell>
  );
}
