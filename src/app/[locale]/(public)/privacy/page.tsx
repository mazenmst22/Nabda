import type { Metadata } from "next";
import { PublicInfoRoute, publicInfoMetadata } from "@/components/public/public-info-route";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: requestedLocale } = await params;
  return publicInfoMetadata(requestedLocale === "ar" ? "ar" : "en", "privacy");
}

export default async function PrivacyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: requestedLocale } = await params;
  return <PublicInfoRoute locale={requestedLocale === "ar" ? "ar" : "en"} kind="privacy" />;
}
