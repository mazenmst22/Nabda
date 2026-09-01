import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { I18nDemo } from "@/components/dev/i18n-demo";
import type { AppLocale } from "@/i18n/routing";
import "@/styles/i18n-demo.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Bilingual primitives",
  robots: { index: false, follow: false },
};

export default async function I18nDemoPage({ params }: { params: Promise<{ locale: AppLocale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <I18nDemo locale={locale} />;
}
