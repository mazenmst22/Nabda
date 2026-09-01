"use client";

import { useState, type ComponentType } from "react";
import { usePathname } from "next/navigation";

type DockComponent = ComponentType<{ locale: "ar" | "en"; initialOpen?: boolean }>;

export function PulseDockLoader({ locale, label }: { locale: "ar" | "en"; label: string }) {
  const pathname = usePathname();
  const [Dock, setDock] = useState<DockComponent | null>(null);
  const [loading, setLoading] = useState(false);

  if (/\/(?:ar|en)\/(?:pulse|reception|dev\/preview)\/?$/u.test(pathname)) return null;
  if (Dock) return <Dock locale={locale} initialOpen />;

  return (
    <button
      type="button"
      className="pulse-dock-trigger"
      aria-label={label}
      aria-busy={loading || undefined}
      disabled={loading}
      onClick={async () => {
        setLoading(true);
        const loaded = await import("./pulse-dock");
        setDock(() => loaded.PulseDockWithProvider);
      }}
    >
      <span className="pulse-loader-dot" aria-hidden="true" />
      <span>Pulse</span>
    </button>
  );
}
