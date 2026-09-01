import { setRequestLocale } from "next-intl/server";
import { PulseChat } from "@/components/pulse/pulse-chat";
import { MessagesProvider } from "@/components/i18n/messages-provider";
import "@/styles/pulse.css";

export default async function PulsePage({ params }: { params: Promise<{ locale: "ar" | "en" }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <main className="pulse-page">
      <div className="pulse-page-shell">
        <MessagesProvider>
          <PulseChat locale={locale} />
        </MessagesProvider>
      </div>
    </main>
  );
}
