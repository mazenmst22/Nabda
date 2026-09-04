# `ux-ui/`

Design deliverables: prototypes, specifications, wireframes, flows and tokens.

These are the design-side source of truth. Their _implementation_ — the CSS custom properties, the primitives in `src/components/ui`, the RTL lint rules — lives in the app. When the two disagree, the disagreement is a bug in one of them; record which in [`../docs/ux-ui/README.md`](../docs/ux-ui/README.md).

## Layout

| Folder            | Contents                                                                                                                                                 |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `prototypes/`     | Interactive HTML prototypes — the clinical system and the marketing site. Open directly in a browser; they are standalone and load nothing from the app. |
| `specifications/` | The design system: components, states, spacing, typography scale, interaction rules.                                                                     |
| `wireframes/`     | Structural layouts and the UI board (component inventory).                                                                                               |
| `user-flows/`     | Journey and flow diagrams — patient, doctor, reception, admin. _(Empty; add flows here.)_                                                                |
| `design-tokens/`  | The brand system and token source that `src/styles/tokens.css` implements.                                                                               |

## Index

- [`prototypes/nabda-clinical-system.html`](prototypes/nabda-clinical-system.html) — clinical workspace prototype.
- [`prototypes/nabda-marketing-site.html`](prototypes/nabda-marketing-site.html) — public marketing site prototype.
- [`specifications/nabda-design-system.html`](specifications/nabda-design-system.html) — design system specification.
- [`wireframes/nabda-ui-board.html`](wireframes/nabda-ui-board.html) — UI board / component inventory.
- [`design-tokens/nabda-brand-system.html`](design-tokens/nabda-brand-system.html) — brand system and design tokens.

Raster exports of this work live in [`../assets/images/ux-ui/`](../assets/images/ux-ui). Logos and marks live in [`../assets/images/brand/`](../assets/images/brand).

## Rules

1. Bilingual by default. Every screen is designed Arabic-first (RTL) and verified in English (LTR).
2. Spacing, borders and alignment are expressed as **logical** properties (`inline-start`, not `left`). The `eslint-rules/nabda/no-physical-properties` rule enforces this in code; design should not ask for what the code cannot express.
3. Colour, spacing and type come from tokens. A prototype that hardcodes a hex value is a token request, not a design decision.
4. Prototypes are disposable; the design system is not. Keep the system current and let prototypes go stale.
