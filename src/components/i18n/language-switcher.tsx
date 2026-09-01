"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import type { AppLocale } from "@/i18n/routing";

function alternateLocalePath(pathname: string, locale: AppLocale) {
  const alternateLocale: AppLocale = locale === "ar" ? "en" : "ar";
  const localizedPath = pathname.replace(/^\/(ar|en)(?=\/|$)/u, `/${alternateLocale}`);
  return localizedPath === pathname ? `/${alternateLocale}${pathname}` : localizedPath;
}

function SwitcherWithQuery({
  href,
  label,
  className,
}: {
  href: string;
  label: string;
  className?: string;
}) {
  const searchParams = useSearchParams();
  const query = searchParams.toString();
  const targetLocale = href.slice(1, 3) as AppLocale;

  return (
    <Link
      className={className}
      href={query ? `${href}?${query}` : href}
      hrefLang={targetLocale}
      lang={targetLocale}
      dir={targetLocale === "ar" ? "rtl" : "ltr"}
    >
      {label}
    </Link>
  );
}

export function LanguageSwitcher({
  locale,
  label,
  className,
}: {
  locale: AppLocale;
  label: string;
  className?: string;
}) {
  const pathname = usePathname();
  const href = alternateLocalePath(pathname, locale);
  const targetLocale: AppLocale = locale === "ar" ? "en" : "ar";

  return (
    <Suspense
      fallback={
        <Link
          className={className}
          href={href}
          hrefLang={targetLocale}
          lang={targetLocale}
          dir={targetLocale === "ar" ? "rtl" : "ltr"}
        >
          {label}
        </Link>
      }
    >
      <SwitcherWithQuery href={href} label={label} className={className} />
    </Suspense>
  );
}
