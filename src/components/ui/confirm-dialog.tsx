"use client";

import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/overlay";

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  closeLabel,
  confirmLabel,
  cancelLabel,
  onConfirm,
  tone = "danger",
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  closeLabel: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  tone?: "danger" | "primary";
  children?: ReactNode;
}) {
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      closeLabel={closeLabel}
      footer={
        <>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            {cancelLabel}
          </Button>
          <Button
            variant={tone}
            onClick={() => {
              onConfirm();
              onOpenChange(false);
            }}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      {children}
    </Dialog>
  );
}
