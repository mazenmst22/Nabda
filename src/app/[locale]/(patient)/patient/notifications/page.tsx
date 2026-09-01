import { setRequestLocale } from "next-intl/server";
import { NotificationPreferences } from "@/components/patient/notification-preferences";

export default async function NotificationsPage({
  params,
}: {
  params: Promise<{ locale: "ar" | "en" }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <NotificationPreferences />;
}
