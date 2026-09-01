export type IconName =
  | "search"
  | "pin"
  | "clock"
  | "star"
  | "calendar"
  | "shield"
  | "arrow"
  | "heart"
  | "child"
  | "spark"
  | "bone"
  | "tooth"
  | "ear"
  | "eye"
  | "plus"
  | "sun"
  | "moon"
  | "system"
  | "filter"
  | "chevron"
  | "check"
  | "wallet"
  | "close"
  | "alert"
  | "info"
  | "timer"
  | "double-check"
  | "minus"
  | "sort"
  | "user"
  | "home"
  | "message"
  | "code"
  | "grid"
  | "queue"
  | "users"
  | "doctor"
  | "chart"
  | "keyboard"
  | "phone"
  | "chevron-down"
  | "chevron-up"
  | "dot"
  | "half"
  | "outline";

type IconProps = { name: IconName; size?: number; strokeWidth?: number; className?: string };

export function Icon({ name, size = 20, strokeWidth = 1.8, className }: IconProps) {
  const paths: Record<IconName, React.ReactNode> = {
    search: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-4-4" />
      </>
    ),
    pin: (
      <>
        <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
        <circle cx="12" cy="10" r="2.5" />
      </>
    ),
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    star: <path d="m12 3 2.7 5.5 6 .9-4.4 4.2 1 6-5.3-2.8-5.3 2.8 1-6-4.4-4.2 6-.9L12 3Z" />,
    calendar: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M8 3v4M16 3v4M3 10h18" />
      </>
    ),
    shield: (
      <>
        <path d="M12 3 5 6v5c0 4.6 2.8 8 7 10 4.2-2 7-5.4 7-10V6l-7-3Z" />
        <path d="m9 12 2 2 4-4" />
      </>
    ),
    arrow: (
      <>
        <path d="M5 12h14" />
        <path d="m14 7 5 5-5 5" />
      </>
    ),
    heart: (
      <path d="M20.8 5.8a5.5 5.5 0 0 0-7.8 0L12 6.9l-1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 22l8.8-8.4a5.5 5.5 0 0 0 0-7.8Z" />
    ),
    child: (
      <>
        <circle cx="12" cy="6" r="2.5" />
        <path d="M7 21v-5a5 5 0 0 1 10 0v5M8 12l-4 4M16 12l4 4" />
      </>
    ),
    spark: (
      <>
        <path d="m12 3 1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3Z" />
        <path d="m19 15 .8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15Z" />
      </>
    ),
    bone: (
      <path d="M8.2 6.8a3 3 0 1 0-4-4 3 3 0 0 0 0 4l9.6 9.6a3 3 0 1 0 4 4 3 3 0 0 0 0-4L8.2 6.8Z" />
    ),
    tooth: (
      <path d="M7 3c-3 1-4 4-3 8 1 5 3 10 5 10 1.5 0 1.2-5 3-5s1.5 5 3 5c2 0 4-5 5-10 1-4 0-7-3-8-2-.7-3.2.5-5 .5S9 2.3 7 3Z" />
    ),
    ear: (
      <path d="M7 10a5 5 0 0 1 10 0c0 5-5 5-5 9a2 2 0 0 1-4 0M10 11a2 2 0 1 1 4 0c0 2-2 2.5-2 4" />
    ),
    eye: (
      <>
        <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" />
        <circle cx="12" cy="12" r="2.5" />
      </>
    ),
    plus: (
      <>
        <path d="M12 5v14M5 12h14" />
      </>
    ),
    sun: (
      <>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
      </>
    ),
    moon: <path d="M20 15.2A8 8 0 0 1 8.8 4 8 8 0 1 0 20 15.2Z" />,
    system: (
      <>
        <rect x="3" y="4" width="18" height="13" rx="2" />
        <path d="M8 21h8M12 17v4" />
      </>
    ),
    filter: (
      <>
        <path d="M4 6h16M7 12h10M10 18h4" />
      </>
    ),
    chevron: <path d="m9 18 6-6-6-6" />,
    check: <path d="m5 12 4 4L19 6" />,
    wallet: (
      <>
        <path d="M4 6h14a2 2 0 0 1 2 2v10H4a2 2 0 0 1-2-2V6a3 3 0 0 1 3-3h12" />
        <path d="M16 11h6v4h-6a2 2 0 0 1 0-4Z" />
      </>
    ),
    close: (
      <>
        <path d="m6 6 12 12M18 6 6 18" />
      </>
    ),
    alert: (
      <>
        <path d="M12 3 2.8 20h18.4L12 3Z" />
        <path d="M12 9v4M12 17h.01" />
      </>
    ),
    info: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 11v6M12 7h.01" />
      </>
    ),
    timer: (
      <>
        <circle cx="12" cy="13" r="8" />
        <path d="M12 9v4l3 2M9 2h6M12 5V2" />
      </>
    ),
    "double-check": <path d="m3 12 4 4 8-9M10 14l2 2 9-10" />,
    minus: <path d="M5 12h14" />,
    sort: <path d="m8 7 4-4 4 4M12 3v18M16 17l-4 4-4-4" />,
    user: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21a8 8 0 0 1 16 0" />
      </>
    ),
    home: (
      <>
        <path d="m3 11 9-8 9 8" />
        <path d="M5 10v10h14V10M9 20v-6h6v6" />
      </>
    ),
    message: (
      <>
        <path d="M4 5h16v12H8l-4 4V5Z" />
        <path d="M8 9h8M8 13h5" />
      </>
    ),
    code: <path d="m8 9-3 3 3 3M16 9l3 3-3 3M14 5l-4 14" />,
    grid: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </>
    ),
    queue: (
      <>
        <path d="M9 6h12M9 12h12M9 18h12" />
        <circle cx="4" cy="6" r="1" fill="currentColor" stroke="none" />
        <circle cx="4" cy="12" r="1" fill="currentColor" stroke="none" />
        <circle cx="4" cy="18" r="1" fill="currentColor" stroke="none" />
      </>
    ),
    users: (
      <>
        <circle cx="9" cy="8" r="3" />
        <path d="M3 20a6 6 0 0 1 12 0M16 5a3 3 0 0 1 0 6M17 14a5 5 0 0 1 4 5" />
      </>
    ),
    doctor: (
      <>
        <circle cx="12" cy="7" r="3" />
        <path d="M5 21a7 7 0 0 1 14 0M8 14v3M16 14v3M14 18h4" />
      </>
    ),
    chart: <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />,
    keyboard: (
      <>
        <rect x="2" y="6" width="20" height="13" rx="2" />
        <path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M6 14h.01M10 14h8" />
      </>
    ),
    phone: (
      <path d="M6.5 3h3l1.5 4-2 1.5a15 15 0 0 0 6.5 6.5l1.5-2 4 1.5v3c0 1.7-1.3 3-3 3C9.7 20.5 3.5 14.3 3.5 6c0-1.7 1.3-3 3-3Z" />
    ),
    "chevron-down": <path d="m6 9 6 6 6-6" />,
    "chevron-up": <path d="m6 15 6-6 6 6" />,
    dot: <circle cx="12" cy="12" r="4" fill="currentColor" stroke="none" />,
    half: (
      <>
        <circle cx="12" cy="12" r="8" />
        <path d="M12 4a8 8 0 0 0 0 16Z" fill="currentColor" stroke="none" />
      </>
    ),
    outline: <circle cx="12" cy="12" r="7" />,
  };

  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}
