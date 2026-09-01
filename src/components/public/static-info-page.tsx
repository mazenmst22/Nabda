import Link from "next/link";
import { Icon } from "@/components/ui/icon";

export function StaticInfoPage({
  locale,
  kicker,
  title,
  intro,
  sections,
  action,
  actionHref,
}: {
  locale: "ar" | "en";
  kicker: string;
  title: string;
  intro: string;
  sections: Array<{ title: string; body: string }>;
  action: string;
  actionHref: string;
}) {
  return (
    <main className="static-info-page">
      <header className="static-info-hero shell">
        <span>{kicker}</span>
        <h1 className="type-display">{title}</h1>
        <p>{intro}</p>
      </header>
      <div className="static-info-body shell">
        {sections.map((section) => (
          <section key={section.title}>
            <h2>{section.title}</h2>
            <p>{section.body}</p>
          </section>
        ))}
        <Link href={`/${locale}${actionHref}`}>
          {action}
          <Icon name="arrow" size={18} />
        </Link>
      </div>
    </main>
  );
}
