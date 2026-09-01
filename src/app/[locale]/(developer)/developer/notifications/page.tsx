import arMessages from "../../../../../../messages/ar.json";
import enMessages from "../../../../../../messages/en.json";
import { setRequestLocale } from "next-intl/server";
import { NotificationWorkspace } from "@/components/developer/notification-workspace";
import { notificationPreviewData } from "@/lib/notifications/preview-data";
import type { NotificationTemplateCatalogue } from "@/lib/notifications/templates";

export const dynamic = "force-dynamic";

export default async function NotificationWorkspacePage({
  params,
}: {
  params: Promise<{ locale: "ar" | "en" }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const initialCatalogues = {
    ar: arMessages.admin.notifications.templates,
    en: enMessages.admin.notifications.templates,
  } as NotificationTemplateCatalogue;

  return (
    <NotificationWorkspace
      locale={locale}
      initialCatalogues={initialCatalogues}
      previewData={notificationPreviewData}
    />
  );
}
