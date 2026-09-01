"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { PulseOrb, type PulseState } from "@/components/pulse/pulse-orb";
import { ThemeSwitcher, type ThemeLabels } from "@/components/theme/theme-switcher";
import { useTheme } from "@/components/theme/theme-provider";
import { Ltr } from "@/components/ui/ltr";

type TokenLabels = {
  kicker: string;
  title: string;
  intro: string;
  back: string;
  palette: string;
  paletteIntro: string;
  semantic: string;
  semanticIntro: string;
  statuses: string;
  statusesIntro: string;
  typography: string;
  typographyIntro: string;
  latin: string;
  arabic: string;
  latinSample: string;
  arabicSample: string;
  latinLabel: string;
  arabicLabel: string;
  dataSample: string;
  spacing: string;
  radii: string;
  elevation: string;
  motion: string;
  productMotion: string;
  productMotionIntro: string;
  pulseMotion: string;
  pulseMotionIntro: string;
  contrast: string;
  statusAvailable: string;
  statusHeld: string;
  statusBooked: string;
  statusCheckedIn: string;
  statusInProgress: string;
  statusCompleted: string;
  statusCancelled: string;
  statusNoShow: string;
  pulseIdle: string;
  pulseListening: string;
  pulseThinking: string;
  pulseSpeaking: string;
  pulseActing: string;
  pulseDone: string;
  pulseHandoff: string;
};

type ColorDefinition = { token: string; against: string };
type Rgba = { r: number; g: number; b: number; a: number };

const palette: ColorDefinition[] = [
  { token: "--brand-teal", against: "--brand-paper" },
  { token: "--brand-deep", against: "--brand-paper" },
  { token: "--brand-ink", against: "--brand-paper" },
  { token: "--brand-faience", against: "--brand-ink" },
  { token: "--brand-mint", against: "--brand-ink" },
  { token: "--brand-mist", against: "--brand-ink" },
  { token: "--brand-paper", against: "--brand-ink" },
  { token: "--brand-white", against: "--brand-teal" },
  { token: "--brand-gold", against: "--brand-ink" },
  { token: "--brand-gold-glow", against: "--brand-ink" },
  { token: "--brand-gold-deep", against: "--brand-paper" },
  { token: "--brand-lapis", against: "--brand-paper" },
  { token: "--brand-carnelian", against: "--brand-paper" },
  { token: "--brand-slate", against: "--brand-paper" },
  { token: "--brand-paper-warm", against: "--brand-ink" },
];

const semantic: ColorDefinition[] = [
  { token: "--surface-bg", against: "--text-primary" },
  { token: "--surface-raised", against: "--text-primary" },
  { token: "--surface-sunken", against: "--text-primary" },
  { token: "--surface-inverse", against: "--text-inverse" },
  { token: "--surface-tint", against: "--text-primary" },
  { token: "--surface-glass", against: "--text-primary" },
  { token: "--text-primary", against: "--surface-bg" },
  { token: "--text-secondary", against: "--surface-bg" },
  { token: "--text-tertiary", against: "--surface-bg" },
  { token: "--text-inverse", against: "--surface-inverse" },
  { token: "--text-on-accent", against: "--action-primary-bg" },
  { token: "--border-subtle", against: "--surface-bg" },
  { token: "--border-default", against: "--surface-bg" },
  { token: "--border-strong", against: "--surface-bg" },
  { token: "--border-focus", against: "--surface-bg" },
  { token: "--action-primary-bg", against: "--action-primary-fg" },
  { token: "--action-primary-hover", against: "--action-primary-fg" },
  { token: "--action-primary-active", against: "--action-primary-fg" },
  { token: "--action-primary-fg", against: "--action-primary-bg" },
  { token: "--action-secondary-bg", against: "--action-secondary-fg" },
  { token: "--action-secondary-border", against: "--action-secondary-bg" },
  { token: "--action-secondary-fg", against: "--action-secondary-bg" },
  { token: "--action-ghost-fg", against: "--surface-bg" },
  { token: "--action-danger-bg", against: "--action-danger-fg" },
  { token: "--action-danger-fg", against: "--action-danger-bg" },
  { token: "--selection-bg", against: "--selection-fg" },
  { token: "--selection-fg", against: "--selection-bg" },
  { token: "--accent-soft", against: "--surface-inverse" },
  { token: "--pulse-core", against: "--pulse-surface" },
  { token: "--pulse-glow", against: "--pulse-surface" },
  { token: "--pulse-surface", against: "--pulse-fg" },
  { token: "--pulse-fg", against: "--pulse-surface" },
  { token: "--pulse-fg-on-light", against: "--surface-bg" },
  { token: "--data-1", against: "--surface-bg" },
  { token: "--data-2", against: "--surface-bg" },
  { token: "--data-3", against: "--surface-inverse" },
  { token: "--data-4", against: "--surface-bg" },
  { token: "--data-5", against: "--surface-bg" },
  { token: "--data-6", against: "--surface-bg" },
];

const statusDefinitions: ColorDefinition[] = [
  { token: "--status-available", against: "--surface-bg" },
  { token: "--status-held", against: "--status-held-bg" },
  { token: "--status-held-bg", against: "--status-held" },
  { token: "--status-booked", against: "--surface-bg" },
  { token: "--status-checked-in", against: "--surface-inverse" },
  { token: "--status-in-progress", against: "--surface-bg" },
  { token: "--status-completed", against: "--surface-bg" },
  { token: "--status-cancelled", against: "--surface-bg" },
  { token: "--status-no-show", against: "--surface-bg" },
];

const typeRows = ["display", "h1", "h2", "h3", "body", "small", "label", "data"] as const;
const spacing = [
  "--space-4",
  "--space-8",
  "--space-12",
  "--space-16",
  "--space-24",
  "--space-40",
  "--space-72",
];
const radii = ["--r-sm", "--r-md", "--r-lg", "--r-full"];
const elevations = ["--e-1", "--e-2", "--e-pulse"];

function parseColor(value: string): Rgba | null {
  const numbers = value.match(/[\d.]+/g)?.map(Number);
  if (!numbers || numbers.length < 3) return null;
  const isSrgb = value.startsWith("color(srgb");
  const factor = isSrgb ? 255 : 1;
  return {
    r: (numbers[0] ?? 0) * factor,
    g: (numbers[1] ?? 0) * factor,
    b: (numbers[2] ?? 0) * factor,
    a: numbers[3] ?? 1,
  };
}

function blend(foreground: Rgba, background: Rgba): Rgba {
  return {
    r: foreground.r * foreground.a + background.r * (1 - foreground.a),
    g: foreground.g * foreground.a + background.g * (1 - foreground.a),
    b: foreground.b * foreground.a + background.b * (1 - foreground.a),
    a: 1,
  };
}

function luminance(color: Rgba) {
  const channels = [color.r, color.g, color.b].map((channel) => {
    const value = channel / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * (channels[0] ?? 0) + 0.7152 * (channels[1] ?? 0) + 0.0722 * (channels[2] ?? 0);
}

function contrastRatio(foreground: Rgba, background: Rgba) {
  const opaqueForeground = blend(foreground, background);
  const light = Math.max(luminance(opaqueForeground), luminance(background));
  const dark = Math.min(luminance(opaqueForeground), luminance(background));
  return (light + 0.05) / (dark + 0.05);
}

function toHex(color: Rgba) {
  const channel = (value: number) => Math.round(value).toString(16).padStart(2, "0").toUpperCase();
  const alpha = color.a < 1 ? channel(color.a * 255) : "";
  return `${String.fromCharCode(35)}${channel(color.r)}${channel(color.g)}${channel(color.b)}${alpha}`;
}

function ColorToken({
  definition,
  contrastLabel,
}: {
  definition: ColorDefinition;
  contrastLabel: string;
}) {
  const swatchRef = useRef<HTMLDivElement>(null);
  const probeRef = useRef<HTMLSpanElement>(null);
  const [value, setValue] = useState("—");
  const [ratio, setRatio] = useState("—");
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    if (!swatchRef.current || !probeRef.current) return;
    const swatch = parseColor(window.getComputedStyle(swatchRef.current).backgroundColor);
    const probe = window.getComputedStyle(probeRef.current);
    const foreground = parseColor(probe.color);
    const background = parseColor(probe.backgroundColor);
    if (swatch) setValue(toHex(swatch));
    if (foreground && background) setRatio(`${contrastRatio(foreground, background).toFixed(2)}:1`);
  }, [resolvedTheme]);

  return (
    <article className="token-card">
      <div
        ref={swatchRef}
        className="token-swatch"
        style={{ backgroundColor: `var(${definition.token})` }}
      />
      <span
        ref={probeRef}
        className="contrast-probe"
        style={{ color: `var(${definition.token})`, backgroundColor: `var(${definition.against})` }}
      />
      <div className="token-card-copy">
        <code>{definition.token}</code>
        <strong className="type-data" dir="ltr">
          {value}
        </strong>
        <small>
          {ratio} {contrastLabel} <code>{definition.against}</code>
        </small>
      </div>
    </article>
  );
}

function SectionHeading({ title, intro }: { title: string; intro?: string }) {
  return (
    <header className="tokens-section-heading">
      <h2 className="type-h2">{title}</h2>
      {intro ? <p>{intro}</p> : null}
    </header>
  );
}

export function TokenGallery({
  locale,
  labels,
  themeLabels,
}: {
  locale: "ar" | "en";
  labels: TokenLabels;
  themeLabels: ThemeLabels;
}) {
  const statusTokens = [
    ["--status-available", "●", labels.statusAvailable],
    ["--status-held", "◷", labels.statusHeld],
    ["--status-booked", "✓", labels.statusBooked],
    ["--status-checked-in", "→", labels.statusCheckedIn],
    ["--status-in-progress", "◐", labels.statusInProgress],
    ["--status-completed", "✓✓", labels.statusCompleted],
    ["--status-cancelled", "✕", labels.statusCancelled],
    ["--status-no-show", "⊘", labels.statusNoShow],
  ] as const;
  const pulseStates: Array<[PulseState, string]> = [
    ["idle", labels.pulseIdle],
    ["listening", labels.pulseListening],
    ["thinking", labels.pulseThinking],
    ["speaking", labels.pulseSpeaking],
    ["acting", labels.pulseActing],
    ["done", labels.pulseDone],
    ["handoff", labels.pulseHandoff],
  ];

  return (
    <main className="tokens-page">
      <header className="tokens-hero">
        <div>
          <span className="type-label tokens-kicker">{labels.kicker}</span>
          <h1 className="type-display">{labels.title}</h1>
          <p>{labels.intro}</p>
        </div>
        <div className="tokens-hero-actions">
          <ThemeSwitcher labels={themeLabels} />
          <Link href={`/${locale}`}>{labels.back}</Link>
        </div>
      </header>

      <section className="tokens-section" aria-labelledby="palette-heading">
        <div id="palette-heading">
          <SectionHeading title={labels.palette} intro={labels.paletteIntro} />
        </div>
        <div className="token-grid">
          {palette.map((definition) => (
            <ColorToken
              key={definition.token}
              definition={definition}
              contrastLabel={labels.contrast}
            />
          ))}
        </div>
      </section>

      <section className="tokens-section" aria-labelledby="semantic-heading">
        <div id="semantic-heading">
          <SectionHeading title={labels.semantic} intro={labels.semanticIntro} />
        </div>
        <div className="token-grid">
          {semantic.map((definition) => (
            <ColorToken
              key={definition.token}
              definition={definition}
              contrastLabel={labels.contrast}
            />
          ))}
        </div>
      </section>

      <section className="tokens-section" aria-labelledby="status-heading">
        <div id="status-heading">
          <SectionHeading title={labels.statuses} intro={labels.statusesIntro} />
        </div>
        <div className="status-grid">
          {statusTokens.map(([token, icon, label]) => (
            <article
              className="status-card"
              key={token}
              style={{ "--status-color": `var(${token})` } as CSSProperties}
            >
              <span className="status-symbol" aria-hidden="true">
                {icon}
              </span>
              <div>
                <strong>{label}</strong>
                <code>{token}</code>
              </div>
            </article>
          ))}
        </div>
        <div className="token-grid status-token-grid">
          {statusDefinitions.map((definition) => (
            <ColorToken
              key={definition.token}
              definition={definition}
              contrastLabel={labels.contrast}
            />
          ))}
        </div>
      </section>

      <section className="tokens-section" aria-labelledby="type-heading">
        <div id="type-heading">
          <SectionHeading title={labels.typography} intro={labels.typographyIntro} />
        </div>
        <div className="type-columns">
          <div lang="en" dir="ltr">
            <h3 className="type-label">{labels.latin}</h3>
            {typeRows.map((type) => (
              <article className="type-row" key={type}>
                <code>.type-{type}</code>
                <p className={`type-${type}`}>
                  {type === "label" ? (
                    labels.latinLabel
                  ) : type === "data" ? (
                    <Ltr>{labels.dataSample}</Ltr>
                  ) : (
                    labels.latinSample
                  )}
                </p>
              </article>
            ))}
          </div>
          <div lang="ar" dir="rtl">
            <h3 className="type-label">{labels.arabic}</h3>
            {typeRows.map((type) => (
              <article className="type-row" key={type}>
                <code>.type-{type}</code>
                <p className={`type-${type}`}>
                  {type === "label" ? (
                    labels.arabicLabel
                  ) : type === "data" ? (
                    <Ltr>{labels.dataSample}</Ltr>
                  ) : (
                    labels.arabicSample
                  )}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="tokens-section metric-section" aria-labelledby="spacing-heading">
        <div id="spacing-heading">
          <SectionHeading title={labels.spacing} />
        </div>
        <div className="spacing-grid">
          {spacing.map((token) => (
            <article key={token}>
              <span
                className="spacing-sample"
                style={{ "--metric": `var(${token})` } as CSSProperties}
              />
              <code>{token}</code>
            </article>
          ))}
        </div>
      </section>

      <section className="tokens-section metric-section" aria-labelledby="radii-heading">
        <div id="radii-heading">
          <SectionHeading title={labels.radii} />
        </div>
        <div className="metric-grid">
          {radii.map((token) => (
            <article key={token}>
              <span className="radius-sample" style={{ borderRadius: `var(${token})` }} />
              <code>{token}</code>
            </article>
          ))}
        </div>
      </section>

      <section className="tokens-section metric-section" aria-labelledby="elevation-heading">
        <div id="elevation-heading">
          <SectionHeading title={labels.elevation} />
        </div>
        <div className="metric-grid elevation-grid">
          {elevations.map((token) => (
            <article key={token}>
              <span className="elevation-sample" style={{ boxShadow: `var(${token})` }} />
              <code>{token}</code>
            </article>
          ))}
        </div>
      </section>

      <section className="tokens-section" aria-labelledby="motion-heading">
        <div id="motion-heading">
          <SectionHeading title={labels.motion} />
        </div>
        <div className="motion-columns">
          <article className="motion-card product-motion-card">
            <span className="type-label">160–220 MS</span>
            <h3 className="type-h3">{labels.productMotion}</h3>
            <p>{labels.productMotionIntro}</p>
            <div className="product-motion-track" aria-hidden="true">
              <i />
            </div>
            <code>cubic-bezier(.2,.7,.3,1)</code>
          </article>
          <article className="motion-card pulse-motion-card">
            <span className="type-label">1.9–2.4 S</span>
            <h3 className="type-h3">{labels.pulseMotion}</h3>
            <p>{labels.pulseMotionIntro}</p>
            <div className="pulse-state-grid">
              {pulseStates.map(([state, label]) => (
                <div key={state}>
                  <PulseOrb state={state} size="large" />
                  <strong>{label}</strong>
                  <code>{state}</code>
                </div>
              ))}
            </div>
          </article>
        </div>
      </section>
    </main>
  );
}
