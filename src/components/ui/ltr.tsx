import type { HTMLAttributes } from "react";

export function Ltr({ children, className = "", ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span {...props} className={`ltr ${className}`.trim()} dir="ltr">
      {children}
    </span>
  );
}
