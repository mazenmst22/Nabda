"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { AppHeader } from "./app-header";
import { SiteFooter } from "./site-footer";

type PublicShellLabels = {
  header: Parameters<typeof AppHeader>[0]["labels"];
  footer: Parameters<typeof SiteFooter>[0]["labels"];
};

export function PublicShell({
  locale,
  labels,
  children,
}: {
  locale: "ar" | "en";
  labels: PublicShellLabels;
  children: ReactNode;
}) {
  const pathname = usePathname();
  if (/\/(?:ar|en)\/clinic\//u.test(pathname)) return children;
  return (
    <div className="public-shell" data-shell="public">
      <AppHeader locale={locale} labels={labels.header} />
      {children}
      <SiteFooter locale={locale} labels={labels.footer} />
    </div>
  );
}
