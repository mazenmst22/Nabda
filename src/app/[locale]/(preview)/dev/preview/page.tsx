import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PreviewHarness } from "@/components/preview/preview-harness";
import { createMockSession, encodeSessionToken } from "@/lib/auth/session";
import { requirePreviewEnabled } from "@/lib/preview/access";
import { discoverPreviewEntries } from "@/lib/preview/routes";
import "@/styles/preview.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Screen preview",
  robots: { index: false, follow: false, nocache: true },
};

export default async function PreviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    screen?: string | string[];
    theme?: string | string[];
    viewport?: string | string[];
    showBlocked?: string | string[];
  }>;
}) {
  requirePreviewEnabled(process.env.NODE_ENV, process.env.NEXT_PUBLIC_ENABLE_PREVIEW, notFound);
  const [{ locale: requestedLocale }, query, entries] = await Promise.all([
    params,
    searchParams,
    discoverPreviewEntries(),
  ]);
  const locale = requestedLocale === "ar" ? "ar" : "en";
  const initialEntryId = typeof query.screen === "string" ? query.screen : undefined;
  const initialTheme = query.theme === "dark" ? "dark" : "light";
  const initialViewport = query.viewport === "834" ? 834 : query.viewport === "1280" ? 1280 : 390;
  const sessions = {
    patient: encodeSessionToken(createMockSession("patient")),
    receptionist: encodeSessionToken(createMockSession("receptionist")),
    doctor: encodeSessionToken(createMockSession("doctor", { doctorId: "dr-mariam-fouad" })),
    developer: encodeSessionToken(createMockSession("developer")),
  };

  return (
    <PreviewHarness
      entries={entries}
      initialEntryId={initialEntryId}
      initialLocale={locale}
      initialTheme={initialTheme}
      initialViewport={initialViewport}
      initialShowBlocked={query.showBlocked === "1"}
      sessions={sessions}
    />
  );
}
