"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Icon, type IconName } from "@/components/ui/icon";
import { IconButton } from "@/components/ui/button";

type ToastTone = "success" | "info" | "danger";
type ToastInput = { title: string; description?: string; tone?: ToastTone };
type ToastItem = ToastInput & { id: number };
type ToastContextValue = { toast: (input: ToastInput) => void };

const ToastContext = createContext<ToastContextValue | null>(null);

export function Toast({
  title,
  description,
  tone = "success",
  closeLabel,
  onClose,
}: ToastInput & { closeLabel: string; onClose?: () => void }) {
  const icon: IconName = tone === "danger" ? "alert" : tone === "info" ? "info" : "check";
  return (
    <div className={`ui-toast ui-toast--${tone}`} role="status">
      <span className="ui-toast__icon" aria-hidden="true">
        <Icon name={icon} size={19} />
      </span>
      <div>
        <strong>{title}</strong>
        {description ? <p>{description}</p> : null}
      </div>
      {onClose ? <IconButton label={closeLabel} icon="close" onClick={onClose} /> : null}
    </div>
  );
}

export function ToastProvider({
  children,
  closeLabel,
}: {
  children: ReactNode;
  closeLabel: string;
}) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const toast = useCallback((input: ToastInput) => {
    const id = Date.now();
    setItems((current) => [...current, { ...input, id }]);
    window.setTimeout(() => setItems((current) => current.filter((item) => item.id !== id)), 5000);
  }, []);
  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="ui-toast-region" aria-live="polite" aria-atomic="false">
        {items.map((item) => (
          <Toast
            {...item}
            key={item.id}
            closeLabel={closeLabel}
            onClose={() => setItems((current) => current.filter((entry) => entry.id !== item.id))}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("ToastProvider is required");
  return context;
}
