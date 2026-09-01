import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { TokenGallery } from "@/components/dev/token-gallery";
import { formatMoney } from "@/lib/i18n/formatters";
import { formatNumerals } from "@/lib/i18n/numeral-format";
import "@/styles/tokens-page.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Design tokens",
  robots: { index: false, follow: false },
};

export default async function TokensPage({ params }: { params: Promise<{ locale: "ar" | "en" }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const tokens = await getTranslations("tokens");
  const common = await getTranslations("common");

  const labels = {
    kicker: tokens("kicker"),
    title: tokens("title"),
    intro: tokens("intro"),
    back: tokens("back"),
    palette: tokens("palette"),
    paletteIntro: tokens("paletteIntro"),
    semantic: tokens("semantic"),
    semanticIntro: tokens("semanticIntro"),
    statuses: tokens("statuses"),
    statusesIntro: tokens("statusesIntro"),
    typography: tokens("typography"),
    typographyIntro: tokens("typographyIntro"),
    latin: tokens("latin"),
    arabic: tokens("arabic"),
    latinSample: tokens("latinSample"),
    arabicSample: tokens("arabicSample"),
    latinLabel: tokens("latinLabel"),
    arabicLabel: tokens("arabicLabel"),
    dataSample: tokens("dataSample", {
      reference: formatNumerals("REF-24", { locale }),
      time: formatNumerals("09:30", { locale }),
      price: formatMoney({ amount: 450, currency: "EGP", locale }),
    }),
    spacing: tokens("spacing"),
    radii: tokens("radii"),
    elevation: tokens("elevation"),
    motion: tokens("motion"),
    productMotion: tokens("productMotion"),
    productMotionIntro: tokens("productMotionIntro"),
    pulseMotion: tokens("pulseMotion"),
    pulseMotionIntro: tokens("pulseMotionIntro"),
    contrast: tokens("contrast"),
    statusAvailable: tokens("statusAvailable"),
    statusHeld: tokens("statusHeld"),
    statusBooked: tokens("statusBooked"),
    statusCheckedIn: tokens("statusCheckedIn"),
    statusInProgress: tokens("statusInProgress"),
    statusCompleted: tokens("statusCompleted"),
    statusCancelled: tokens("statusCancelled"),
    statusNoShow: tokens("statusNoShow"),
    pulseIdle: tokens("pulseIdle"),
    pulseListening: tokens("pulseListening"),
    pulseThinking: tokens("pulseThinking"),
    pulseSpeaking: tokens("pulseSpeaking"),
    pulseActing: tokens("pulseActing"),
    pulseDone: tokens("pulseDone"),
    pulseHandoff: tokens("pulseHandoff"),
  };

  return (
    <TokenGallery
      locale={locale}
      labels={labels}
      themeLabels={{
        label: common("theme"),
        system: common("themeSystem"),
        light: common("themeLight"),
        dark: common("themeDark"),
      }}
    />
  );
}
