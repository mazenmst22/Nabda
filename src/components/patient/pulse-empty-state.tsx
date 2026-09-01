import Link from "next/link";
import { EmptyState, Icon } from "@/components/ui";
import type { IconName } from "@/components/ui/icon";

export function PulseEmptyState({
  locale,
  icon,
  title,
  description,
  action,
}: {
  locale: "ar" | "en";
  icon?: IconName;
  title: string;
  description: string;
  action: string;
}) {
  return (
    <EmptyState
      icon={icon}
      title={title}
      description={description}
      action={
        <Link className="ui-button ui-button--pulse patient-pulse-link" href={`/${locale}/pulse`}>
          <Icon name="spark" size={18} />
          <span>{action}</span>
        </Link>
      }
    />
  );
}
