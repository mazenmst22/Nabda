import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { StaticInfoPage } from "@/components/public/static-info-page";
import type { AppLocale } from "@/i18n/routing";
import { localizedAlternates, openGraph } from "@/lib/seo";

export type PublicInfoKind = "about" | "help" | "terms" | "privacy";

const actionPaths: Record<PublicInfoKind, string> = {
  about: "/search",
  help: "/pulse",
  terms: "",
  privacy: "",
};

function namespace(kind: PublicInfoKind) {
  return `publicInfo.${kind}` as const;
}

export async function publicInfoMetadata(
  locale: AppLocale,
  kind: PublicInfoKind,
): Promise<Metadata> {
  const page = await getTranslations({ locale, namespace: namespace(kind) });
  const path = `/${kind}`;
  return {
    title: page("title"),
    description: page("intro"),
    alternates: localizedAlternates(locale, path),
    openGraph: openGraph(locale, page("title"), page("intro"), path),
  };
}

export async function PublicInfoRoute({
  locale,
  kind,
}: {
  locale: AppLocale;
  kind: PublicInfoKind;
}) {
  setRequestLocale(locale);
  const page = await getTranslations(namespace(kind));
  return (
    <StaticInfoPage
      locale={locale}
      kicker={page("kicker")}
      title={page("title")}
      intro={page("intro")}
      sections={[
        { title: page("oneTitle"), body: page("oneBody") },
        { title: page("twoTitle"), body: page("twoBody") },
        { title: page("threeTitle"), body: page("threeBody") },
      ]}
      action={page("action")}
      actionHref={actionPaths[kind]}
    />
  );
}
