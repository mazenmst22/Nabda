import { setRequestLocale } from "next-intl/server";
import { DeveloperWorkspace } from "@/components/developer/developer-workspace";

export const dynamic = "force-dynamic";

export default async function DeveloperWorkspacePage({
  params,
}: {
  params: Promise<{ locale: "ar" | "en" }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <DeveloperWorkspace locale={locale} />;
}
