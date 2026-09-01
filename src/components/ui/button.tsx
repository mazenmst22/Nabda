"use client";

import { forwardRef } from "react";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Icon, type IconName } from "@/components/ui/icon";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "pulse";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  loading?: boolean;
  loadingLabel?: string;
  leadingIcon?: IconName;
  children: ReactNode;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = "primary",
    loading = false,
    loadingLabel,
    leadingIcon,
    className = "",
    disabled,
    children,
    type = "button",
    ...props
  },
  ref,
) {
  return (
    <button
      {...props}
      ref={ref}
      type={type}
      className={`ui-button ui-button--${variant} ${className}`.trim()}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
    >
      {loading ? <span className="ui-spinner" aria-hidden="true" /> : null}
      {!loading && leadingIcon ? <Icon name={leadingIcon} size={19} /> : null}
      <span>{loading && loadingLabel ? loadingLabel : children}</span>
    </button>
  );
});

export type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string;
  icon: IconName;
  variant?: ButtonVariant;
  loading?: boolean;
};

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  {
    label,
    icon,
    variant = "ghost",
    loading = false,
    className = "",
    disabled,
    type = "button",
    ...props
  },
  ref,
) {
  return (
    <button
      {...props}
      ref={ref}
      type={type}
      className={`ui-icon-button ui-icon-button--${variant} ${className}`.trim()}
      aria-label={label}
      aria-busy={loading || undefined}
      disabled={disabled || loading}
    >
      {loading ? <span className="ui-spinner" aria-hidden="true" /> : <Icon name={icon} />}
    </button>
  );
});
