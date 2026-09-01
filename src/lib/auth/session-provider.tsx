"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import type { AuthSession } from "./session";
import { SESSION_WARNING_SECONDS } from "./session";

type SessionContextValue = {
  session: AuthSession;
  setSession: (session: AuthSession) => void;
};

const SessionContext = createContext<SessionContextValue | null>(null);

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) throw new Error("useSession must be used inside SessionProvider");
  return context;
}

type ExpiryLabels = {
  title: string;
  description: string;
  renew: string;
  renewing: string;
  failed: string;
};

export function SessionProvider({
  initialSession,
  labels,
  children,
}: {
  initialSession: AuthSession;
  labels: ExpiryLabels;
  children: ReactNode;
}) {
  const [session, setSession] = useState(initialSession);
  const [secondsLeft, setSecondsLeft] = useState(() => session.exp - Math.floor(Date.now() / 1000));
  const [renewing, setRenewing] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const update = () => setSecondsLeft(session.exp - Math.floor(Date.now() / 1000));
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, [session.exp]);

  const renew = useCallback(async () => {
    setRenewing(true);
    setFailed(false);
    try {
      const response = await fetch("/api/auth/renew", { method: "POST" });
      if (!response.ok) throw new Error("renewal failed");
      const payload = (await response.json()) as { session: AuthSession };
      setSession(payload.session);
    } catch {
      setFailed(true);
    } finally {
      setRenewing(false);
    }
  }, []);

  const context = useMemo(() => ({ session, setSession }), [session]);
  const shouldWarn = secondsLeft > 0 && secondsLeft <= SESSION_WARNING_SECONDS;

  return (
    <SessionContext.Provider value={context}>
      {shouldWarn ? (
        <section className="session-warning" role="alert" aria-live="assertive">
          <div>
            <strong>{labels.title}</strong>
            <p>{failed ? labels.failed : labels.description}</p>
          </div>
          <Button
            variant="secondary"
            loading={renewing}
            loadingLabel={labels.renewing}
            onClick={renew}
          >
            {labels.renew}
          </Button>
        </section>
      ) : null}
      {children}
    </SessionContext.Provider>
  );
}
