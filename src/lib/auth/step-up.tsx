"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/overlay";
import { useSession } from "./session-provider";
import type { AuthSession } from "./session";

export type StepUpLabels = {
  action: string;
  title: string;
  description: string;
  verify: string;
  verifying: string;
  cancel: string;
  close: string;
  failed: string;
  verified: string;
};

export function StepUpReauthentication({
  labels,
  children,
}: {
  labels: StepUpLabels;
  children?: ReactNode;
}) {
  const { session, setSession } = useSession();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const verified =
    typeof session.stepUpExp === "number" && session.stepUpExp > Math.floor(Date.now() / 1000);

  async function verify() {
    setBusy(true);
    setError(false);
    try {
      const response = await fetch("/api/auth/step-up", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: "login" }),
      });
      if (!response.ok) throw new Error("step-up failed");
      const payload = (await response.json()) as { session: AuthSession };
      setSession(payload.session);
      setOpen(false);
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Button variant="ghost" leadingIcon="shield" onClick={() => setOpen(true)}>
        {verified ? labels.verified : labels.action}
      </Button>
      {verified ? children : null}
      <Dialog
        open={open}
        onOpenChange={setOpen}
        title={labels.title}
        description={labels.description}
        closeLabel={labels.close}
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              {labels.cancel}
            </Button>
            <Button loading={busy} loadingLabel={labels.verifying} onClick={verify}>
              {labels.verify}
            </Button>
          </>
        }
      >
        {error ? (
          <p className="step-up-error" role="alert">
            {labels.failed}
          </p>
        ) : null}
      </Dialog>
    </>
  );
}
