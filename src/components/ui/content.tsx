import type { HTMLAttributes, ReactNode } from "react";
import Image from "next/image";
import { Icon, type IconName } from "@/components/ui/icon";

export function Card({ className = "", ...props }: HTMLAttributes<HTMLElement>) {
  return <article {...props} className={`ui-card ${className}`.trim()} />;
}

export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "accent" | "warning";
}) {
  return <span className={`ui-badge ui-badge--${tone}`}>{children}</span>;
}

export type Status =
  | "available"
  | "held"
  | "booked"
  | "checked-in"
  | "in-progress"
  | "completed"
  | "cancelled"
  | "no-show";

const statusIcons: Record<Status, IconName> = {
  available: "dot",
  held: "timer",
  booked: "check",
  "checked-in": "arrow",
  "in-progress": "half",
  completed: "double-check",
  cancelled: "close",
  "no-show": "outline",
};

export function StatusPill({ status, label }: { status: Status; label: string }) {
  return (
    <span className={`ui-status ui-status--${status}`} data-status={status}>
      <span className="ui-status__icon" aria-hidden="true">
        <Icon name={statusIcons[status]} size={15} strokeWidth={2.2} />
      </span>
      <span>{label}</span>
    </span>
  );
}

export function Avatar({
  name,
  src,
  size = "medium",
}: {
  name: string;
  src?: string;
  size?: "small" | "medium" | "large";
}) {
  const initials = name
    .split(/\s+/u)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.slice(0, 1))
    .join("");

  return (
    <span className={`ui-avatar ui-avatar--${size}`} role="img" aria-label={name}>
      {src ? (
        <Image src={src} alt="" fill sizes="64px" unoptimized />
      ) : (
        <span aria-hidden="true">{initials}</span>
      )}
    </span>
  );
}

export function EmptyState({
  icon = "calendar",
  title,
  description,
  action,
}: {
  icon?: IconName;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="ui-empty-state">
      <span className="ui-empty-state__icon" aria-hidden="true">
        <Icon name={icon} size={28} />
      </span>
      <strong>{title}</strong>
      <p>{description}</p>
      {action}
    </div>
  );
}

export function Skeleton({ label, lines = 3 }: { label: string; lines?: number }) {
  return (
    <div className="ui-skeleton" role="status" aria-label={label}>
      <span className="ui-skeleton__block" />
      {Array.from({ length: lines }, (_, index) => (
        <span className="ui-skeleton__line" key={index} />
      ))}
      <span className="sr-only">{label}</span>
    </div>
  );
}
