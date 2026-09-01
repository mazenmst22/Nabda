import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { UiGallery } from "@/components/dev/ui-gallery";
import type { AppLocale } from "@/i18n/routing";
import "@/styles/ui-gallery.css";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: AppLocale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "admin.uiGallery" });
  return { title: t("metadataTitle"), robots: { index: false, follow: false } };
}

export default async function UiGalleryPage({
  params,
}: {
  params: Promise<{ locale: AppLocale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <UiGallery locale={locale} />;
}
