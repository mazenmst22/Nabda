"use client";

import { useEffect, useId, useRef } from "react";
import type { ReactNode } from "react";
import { IconButton } from "@/components/ui/button";

type OverlayProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  closeLabel: string;
  children: ReactNode;
  footer?: ReactNode;
};

function Overlay({
  kind,
  open,
  onOpenChange,
  title,
  description,
  closeLabel,
  children,
  footer,
}: OverlayProps & { kind: "dialog" | "sheet" }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      className={`ui-overlay ui-overlay--${kind}`}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      onCancel={(event) => {
        event.preventDefault();
        onOpenChange(false);
      }}
      onClose={() => onOpenChange(false)}
      onClick={(event) => {
        if (event.currentTarget === event.target) onOpenChange(false);
      }}
    >
      <div className="ui-overlay__panel">
        <header className="ui-overlay__header">
          <div>
            <h2 id={titleId}>{title}</h2>
            {description ? <p id={descriptionId}>{description}</p> : null}
          </div>
          <IconButton label={closeLabel} icon="close" onClick={() => onOpenChange(false)} />
        </header>
        <div className="ui-overlay__body">{children}</div>
        {footer ? <footer className="ui-overlay__footer">{footer}</footer> : null}
      </div>
    </dialog>
  );
}

export function Dialog(props: OverlayProps) {
  return <Overlay {...props} kind="dialog" />;
}

export function Sheet(props: OverlayProps) {
  return <Overlay {...props} kind="sheet" />;
}
