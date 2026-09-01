"use client";

import type { CSSProperties, KeyboardEvent } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { PreviewArea, PreviewEntry, PreviewRole } from "@/lib/preview/routes";

type Locale = "ar" | "en";
type Theme = "light" | "dark";
type Viewport = 390 | 834 | 1280;

type PreviewHarnessProps = {
  entries: PreviewEntry[];
  initialEntryId?: string;
  initialLocale: Locale;
  initialTheme: Theme;
  initialViewport: Viewport;
  initialShowBlocked: boolean;
  sessions: Record<Exclude<PreviewRole, "public">, string>;
};

type FrameStyle = CSSProperties & {
  "--preview-frame-width": string;
  "--preview-frame-height": string;
  "--preview-frame-scale": number;
  "--preview-wrapper-width": string;
  "--preview-wrapper-height": string;
};

const viewports: Viewport[] = [390, 834, 1280];
const themes: Theme[] = ["light", "dark"];
const locales: Locale[] = ["ar", "en"];

function sessionPath(locale: Locale, entry: PreviewEntry) {
  if (entry.role === "patient") return `/${locale}/patient`;
  if (entry.role === "receptionist") return `/${locale}/reception`;
  if (entry.role === "doctor") return `/${locale}/doctor`;
  if (entry.path.startsWith("/dev")) return `/${locale}/dev`;
  return `/${locale}/developer`;
}

function deniedRole(role: PreviewRole): Exclude<PreviewRole, "public"> {
  return role === "developer" ? "patient" : "developer";
}

function setSessionCookie(
  locale: Locale,
  entry: PreviewEntry,
  sessions: PreviewHarnessProps["sessions"],
) {
  if (entry.role === "public") return;
  const path = sessionPath(locale, entry);
  const role = entry.scenario === "permission-denied" ? deniedRole(entry.role) : entry.role;
  document.cookie = `nabda_mock_session=${sessions[role]}; Path=${path}; SameSite=Lax`;
  document.cookie = `nabda_mock_session=${sessions[role]}; Path=/v1; SameSite=Lax`;
}

function screenUrl(locale: Locale, entry: PreviewEntry) {
  const parameters = new URLSearchParams({
    mswScenario: entry.scenario,
    preview: "1",
  });
  if (entry.scenario === "empty" && entry.path === "/search") {
    parameters.set("q", "__nabda_preview_no_results__");
  }
  if (entry.scenario === "slot-taken" || entry.scenario === "hold-expired") {
    parameters.set("bookingScenario", entry.scenario);
  }
  if (entry.scenario === "low-confidence" || entry.scenario === "invalid-json") {
    parameters.set("extractionScenario", entry.scenario);
  }
  return `/${locale}${entry.path}?${parameters.toString()}`;
}

function wait(milliseconds: number) {
  return new Promise((resolve) => window.setTimeout(resolve, milliseconds));
}

async function waitForSelector(documentNode: Document, selector: string, timeout = 12_000) {
  const started = Date.now();
  while (!documentNode.querySelector(selector) && Date.now() - started < timeout) await wait(100);
}

export function PreviewHarness({
  entries,
  initialEntryId,
  initialLocale,
  initialTheme,
  initialViewport,
  initialShowBlocked,
  sessions,
}: PreviewHarnessProps) {
  const defaultEntry = entries.find((entry) => entry.id === initialEntryId) ?? entries[0];
  if (!defaultEntry) throw new Error("The preview route inventory is empty.");

  const [selectedId, setSelectedId] = useState(defaultEntry.id);
  const [locale, setLocale] = useState<Locale>(initialLocale);
  const [theme, setTheme] = useState<Theme>(initialTheme);
  const [viewport, setViewport] = useState<Viewport>(initialViewport);
  const [showBlocked, setShowBlocked] = useState(initialShowBlocked);
  const [availableWidth, setAvailableWidth] = useState(390);
  const [contentHeight, setContentHeight] = useState(844);
  const [frameUrl, setFrameUrl] = useState("about:blank");
  const [frameNonce, setFrameNonce] = useState(0);
  const [ready, setReady] = useState(false);
  const [frameError, setFrameError] = useState("");
  const stageRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLIFrameElement>(null);
  const railButtonRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const frameResizeObserver = useRef<ResizeObserver | null>(null);

  const selected = entries.find((entry) => entry.id === selectedId) ?? defaultEntry;
  const visibleEntries = useMemo(
    () => entries.filter((entry) => showBlocked || entry.supported),
    [entries, showBlocked],
  );
  const blockedCount = entries.length - entries.filter((entry) => entry.supported).length;
  const grouped = useMemo(() => {
    const groups = new Map<PreviewArea, PreviewEntry[]>();
    for (const entry of visibleEntries) {
      const group = groups.get(entry.area) ?? [];
      group.push(entry);
      groups.set(entry.area, group);
    }
    return groups;
  }, [visibleEntries]);
  const rawUrl = screenUrl(locale, selected);
  const scale = Math.min(1, Math.max(0.2, availableWidth / viewport));
  const frameStyle: FrameStyle = {
    "--preview-frame-width": `${viewport}px`,
    "--preview-frame-height": `${contentHeight}px`,
    "--preview-frame-scale": scale,
    "--preview-wrapper-width": `${viewport * scale}px`,
    "--preview-wrapper-height": `${contentHeight * scale}px`,
  };

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setAvailableWidth(Math.max(1, entry.contentRect.width - 32));
    });
    observer.observe(stage);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function prepare() {
      setReady(false);
      setFrameError("");
      frameResizeObserver.current?.disconnect();
      try {
        window.localStorage.setItem("nabda-theme", theme);
        document.documentElement.dataset.theme = theme;
        document.documentElement.dataset.themePreference = theme;
      } catch {
        document.documentElement.dataset.theme = theme;
      }
      setSessionCookie(locale, selected, sessions);
      document.cookie = `nabda_preview_scenario=${selected.scenario}; Path=/v1; SameSite=Lax`;

      if (selected.area === "Booking") {
        await fetch("/api/testing/booking", { method: "DELETE" });
      }
      if (selected.path === "/doctor") {
        await fetch("/api/testing/doctor", { method: "DELETE" });
        if (selected.scenario === "invalid-json") {
          await fetch("/api/testing/doctor", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ extractionMode: "invalid" }),
          });
        }
      }
      if (!cancelled) {
        setFrameUrl(screenUrl(locale, selected));
        setFrameNonce((value) => value + 1);
      }
    }
    void prepare().catch((error: unknown) => {
      if (!cancelled)
        setFrameError(error instanceof Error ? error.message : "Preview setup failed");
    });
    return () => {
      cancelled = true;
    };
  }, [locale, selected, sessions, theme]);

  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.set("screen", selected.id);
    url.searchParams.set("theme", theme);
    url.searchParams.set("viewport", String(viewport));
    if (showBlocked) url.searchParams.set("showBlocked", "1");
    else url.searchParams.delete("showBlocked");
    window.history.replaceState(null, "", url);
  }, [selected.id, showBlocked, theme, viewport]);

  const measureFrame = useCallback(() => {
    const documentNode = frameRef.current?.contentDocument;
    if (!documentNode) return;
    const height = Math.max(
      720,
      documentNode.documentElement.scrollHeight,
      documentNode.body?.scrollHeight ?? 0,
    );
    setContentHeight(height);
  }, []);

  const handleFrameLoad = useCallback(async () => {
    const iframe = frameRef.current;
    const documentNode = iframe?.contentDocument;
    if (!iframe || !documentNode || iframe.src === "about:blank") return;

    documentNode.documentElement.dataset.theme = theme;
    documentNode.documentElement.dataset.themePreference = theme;
    documentNode.documentElement.dir = locale === "ar" ? "rtl" : "ltr";

    if (selected.scenario === "slot-taken" || selected.scenario === "hold-expired") {
      await waitForSelector(documentNode, ".booking-panel .booking-primary");
      await wait(1_000);
      const action = documentNode.querySelector<HTMLButtonElement>(
        ".booking-panel .booking-primary",
      );
      action?.click();
      if (selected.scenario === "slot-taken") {
        await waitForSelector(documentNode, ".booking-alternatives");
      } else {
        await waitForSelector(documentNode, ".booking-notice--expired", 7_000);
      }
    }
    if (selected.scenario === "low-confidence") {
      await waitForSelector(documentNode, ".medication-field[data-confidence='low']", 20_000);
    }
    if (selected.scenario === "invalid-json") {
      await waitForSelector(documentNode, "[data-extraction-state='invalid']", 20_000);
    }

    await documentNode.fonts?.ready;
    measureFrame();
    frameResizeObserver.current?.disconnect();
    frameResizeObserver.current = new ResizeObserver(measureFrame);
    if (documentNode.body) frameResizeObserver.current.observe(documentNode.body);
    setReady(true);
  }, [locale, measureFrame, selected.scenario, theme]);

  function handleRailKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const nextIndex =
      event.key === "Home"
        ? 0
        : event.key === "End"
          ? visibleEntries.length - 1
          : (index + (event.key === "ArrowDown" ? 1 : -1) + visibleEntries.length) %
            visibleEntries.length;
    const next = visibleEntries[nextIndex];
    if (!next) return;
    setSelectedId(next.id);
    railButtonRefs.current[nextIndex]?.focus();
  }

  let itemIndex = -1;
  return (
    <main
      className="preview-harness"
      data-preview-ready={ready ? "true" : "false"}
      data-preview-entry={selected.id}
    >
      <header className="preview-toolbar">
        <div className="preview-title">
          <span className="type-label">Nabda developer tool</span>
          <h1>Screen preview</h1>
        </div>
        <fieldset>
          <legend>Locale</legend>
          {locales.map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={locale === value}
              onClick={() => setLocale(value)}
            >
              {value}
            </button>
          ))}
        </fieldset>
        <fieldset>
          <legend>Theme</legend>
          {themes.map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={theme === value}
              onClick={() => setTheme(value)}
            >
              {value}
            </button>
          ))}
        </fieldset>
        <fieldset>
          <legend>Viewport</legend>
          {viewports.map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={viewport === value}
              onClick={() => setViewport(value)}
            >
              {value}
            </button>
          ))}
        </fieldset>
        <fieldset>
          <legend>States</legend>
          <button
            type="button"
            aria-pressed={!showBlocked}
            onClick={() => {
              setShowBlocked(false);
              if (!selected.supported) {
                const firstSupported = entries.find((entry) => entry.supported);
                if (firstSupported) setSelectedId(firstSupported.id);
              }
            }}
          >
            Ready
          </button>
          <button type="button" aria-pressed={showBlocked} onClick={() => setShowBlocked(true)}>
            All <span className="preview-state-count">{blockedCount}</span>
          </button>
        </fieldset>
        <a href={rawUrl} target="_blank" rel="noreferrer">
          Open in new tab
        </a>
      </header>

      <div className="preview-layout">
        <nav className="preview-rail" aria-label="Application screens">
          {[...grouped.entries()].map(([area, areaEntries]) => (
            <section key={area}>
              <h2>{area}</h2>
              <div className="preview-screen-list">
                {areaEntries.map((entry) => {
                  itemIndex += 1;
                  const index = itemIndex;
                  const active = selected.id === entry.id;
                  return (
                    <button
                      key={entry.id}
                      ref={(element) => {
                        railButtonRefs.current[index] = element;
                      }}
                      type="button"
                      tabIndex={active ? 0 : -1}
                      aria-current={active ? "page" : undefined}
                      data-preview-entry-id={entry.id}
                      data-preview-route={entry.path || "/"}
                      data-preview-supported={entry.supported ? "true" : "false"}
                      onKeyDown={(event) => handleRailKeyDown(event, index)}
                      onClick={() => setSelectedId(entry.id)}
                    >
                      <span>{entry.name}</span>
                      {!entry.supported ? <small>Blocked</small> : null}
                    </button>
                  );
                })}
              </div>
            </section>
          ))}
        </nav>

        <section className="preview-workbench" aria-label="Selected screen preview">
          <div className="preview-stage" ref={stageRef}>
            <div className="preview-frame-wrapper" style={frameStyle} data-preview-capture>
              <iframe
                key={frameNonce}
                ref={frameRef}
                src={frameUrl}
                title={`Preview: ${selected.name}`}
                onLoad={() => void handleFrameLoad()}
              />
            </div>
          </div>
          <footer className="preview-inspector" aria-live="polite">
            <div>
              <span>Route</span>
              <code dir="ltr">
                /{locale}
                {selected.path || ""}
              </code>
            </div>
            <div>
              <span>MSW scenario</span>
              <code dir="ltr">{selected.scenario}</code>
            </div>
            <div>
              <span>Status</span>
              <strong>{selected.supported ? (ready ? "Ready" : "Loading") : "Blocked"}</strong>
            </div>
            {!selected.supported && selected.blockedReason ? (
              <p role="note">{selected.blockedReason}</p>
            ) : null}
            {frameError ? <p role="alert">{frameError}</p> : null}
          </footer>
        </section>
      </div>
    </main>
  );
}
