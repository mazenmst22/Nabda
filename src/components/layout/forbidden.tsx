import Link from "next/link";
import { Icon } from "@/components/ui/icon";

export function Forbidden({
  locale,
  labels,
}: {
  locale: "ar" | "en";
  labels: { title: string; text: string; back: string };
}) {
  return (
    <main className="forbidden-page" data-status="403">
      <div className="forbidden-card">
        <span className="forbidden-code">403</span>
        <Icon name="shield" size={34} />
        <h1 className="type-h1">{labels.title}</h1>
        <p>{labels.text}</p>
        <Link className="ui-button ui-button--primary" href={`/${locale}`}>
          {labels.back}
        </Link>
      </div>
    </main>
  );
}
