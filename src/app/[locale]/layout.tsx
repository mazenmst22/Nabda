import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { PulseDockLoader } from "@/components/pulse/pulse-dock-loader";
import { LocaleProvider } from "@/components/i18n/locale-provider";
import { THEME_INIT_SCRIPT } from "@/components/theme/theme-script";
import { SITE_URL } from "@/lib/seo";
import "@/styles/globals.css";
import "@/styles/ui.css";
import "@/styles/site.css";

const locales = ["ar", "en"] as const;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "نبضة | Nabda", template: "%s | Nabda" },
  description:
    "مواعيد دكاترة حقيقية من جدول العيادة — Real doctor availability from the clinic schedule.",
  icons: { icon: "/nabda-mark.svg" },
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(locales, locale)) notFound();
  setRequestLocale(locale);
  const direction = locale === "ar" ? "rtl" : "ltr";

  return (
    <html lang={locale} dir={direction} suppressHydrationWarning>
      <head>
        <link
          rel="preload"
          href="/fonts/readex-pro-variable.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: THEME_INIT_SCRIPT,
          }}
        />
      </head>
      <body>
        <LocaleProvider locale={locale}>
          <ThemeProvider>
            {children}
            <PulseDockLoader
              locale={locale}
              label={locale === "ar" ? "افتح Pulse" : "Open Pulse"}
            />
          </ThemeProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}
