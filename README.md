# Nabda web client

Nabda is a bilingual, multi-clinic healthcare web client. Arabic is the default locale and renders RTL; English renders LTR. The repository currently runs against deterministic local mocks while preserving the HTTP contract expected from the future ASP.NET Core API.

## Repository layout

Application code and design/research material are kept strictly apart. Code is under `src/`, `public/`, `e2e/`, `scripts/`, `eslint-rules/` and `messages/`; everything else is source material or documentation.

| Path                                | Contents                                                                       |
| ----------------------------------- | ------------------------------------------------------------------------------ |
| `src/`                              | All application code — App Router, components, domain libraries, mocks, styles |
| `public/`                           | Runtime-served assets: optimised `.woff2` subsets, the app mark, web workers   |
| `messages/`                         | ICU Arabic and English catalogues                                              |
| `e2e/`                              | Playwright journeys, accessibility and visual release gates                    |
| `scripts/`                          | Dev server, bundle budget report, preview shots, git hook setup                |
| `eslint-rules/`                     | The local `nabda` ESLint plugin (logical-properties enforcement)               |
| [`docs/`](docs/README.md)           | Engineering documentation, by discipline                                       |
| [`research/`](research/README.md)   | Source briefs, specifications and archives, kept unedited                      |
| [`ux-ui/`](ux-ui/README.md)         | Prototypes, design system, wireframes, flows and token sources                 |
| [`assets/`](assets/README.md)       | Design-time source assets — brand marks, font sources, exports                 |
| [`.github/`](.github/README.md)     | CI workflows and repository automation                                         |
| [`artifacts/`](artifacts/README.md) | Generated build and CI output (git-ignored)                                    |

`assets/` is never imported by application code; anything the browser loads is exported into `public/` first.

## Requirements

- Node.js 22
- pnpm 11.19
- Chromium for Playwright and Lighthouse (`pnpm exec playwright install --with-deps chromium`)

## Setup

```bash
pnpm install --frozen-lockfile
pnpm dev
```

Open `http://localhost:3000/ar` or `http://localhost:3000/en`. The locale middleware redirects `/` to Arabic.

## Scripts

| Command                     | Purpose                                                                  |
| --------------------------- | ------------------------------------------------------------------------ |
| `pnpm dev`                  | Start the Next.js development server                                     |
| `pnpm build` / `pnpm start` | Build and serve the production application                               |
| `pnpm lint`                 | ESLint, including `nabda/no-physical-properties`                         |
| `pnpm format:check`         | Check Prettier formatting                                                |
| `pnpm typecheck`            | Strict TypeScript validation                                             |
| `pnpm test`                 | Vitest unit and API-contract tests                                       |
| `pnpm test:e2e`             | Complete Playwright release suite against deterministic local mocks      |
| `pnpm test:golden`          | Patient and clinical golden paths in both locales                        |
| `pnpm test:a11y`            | Axe sweep of every application page in both locales                      |
| `pnpm test:visual`          | RTL snapshots at 390 px and 1280 px                                      |
| `pnpm test:visual:update`   | Deliberately regenerate visual baselines                                 |
| `pnpm preview:shots`        | Export every preview state as PNGs and an HTML contact sheet             |
| `pnpm bundle:check`         | Enforce the 120 KB gzip JavaScript budget per route and write the report |
| `pnpm lighthouse`           | Enforce Slow 4G LCP and the route-owned JavaScript budget                |

## Architecture

```text
Next.js App Router
  /[locale]
    (public)       directory, clinic pages, shared booking, Pulse
    (patient)      appointments, records, preferences, profile
    (reception)    schedule, queue, patient and billing operations
    (doctor)       encounter, capture, transcript and prescription review
    (developer)    tenant configuration, templates, audit and health

src/components     shared UI, layout and domain components
src/lib/api         typed fetch client and TanStack Query hooks
src/lib/schemas     Zod boundary schemas, one per aggregate
src/lib/auth|rbac   replaceable session adapter and permission policy
src/mocks           MSW handlers, Egyptian fixtures and fault controls
src/app/v1          deterministic in-process HTTP mock used by browser tests
messages            ICU Arabic and English catalogues
e2e                 journeys, accessibility and visual release gates
```

The client treats API responses as untrusted. Every successful body is parsed through Zod; development fails loudly, while production reports a schema failure and only degrades where a caller supplied a safe fallback. Mutations carry stable idempotency and correlation identifiers across retries, and updates require `If-Match`.

## Switching from mocks to the real API

1. Implement the worklist in [`docs/backend/GAPS.md`](docs/backend/GAPS.md), including headers, error envelopes, concurrency and streaming semantics.
2. Configure the application API base URL at the single `ApiClient` composition point. The client already accepts `baseUrl`; keep all call sites on relative `/v1/...` paths.
3. Replace the mock session implementation in `src/lib/auth/session.ts` with the OIDC adapter. No role checks should move into page components.
4. Do not start `src/mocks/browser.ts` outside local/mock mode, and remove or disable the Next.js `src/app/v1` and `src/app/api/testing` mock routes in the deployment build.
5. Run `pnpm test` against MSW for contract compatibility, then run `pnpm test:e2e` against an isolated backend tenant seeded with the same fixture identities.

Mock controls and fault reproduction are documented in [`docs/testing/RUNBOOK.md`](docs/testing/RUNBOOK.md).

## Developer preview harness

`pnpm dev` enables the local-only preview at `/ar/dev/preview` and `/en/dev/preview`. The inventory is generated from `src/app/[locale]`, embeds each real route in an iframe, and seeds the existing mock-session cookie at the route's own scope so the normal authentication and RBAC guards still run. The route returns 404 unless both development mode and `NEXT_PUBLIC_ENABLE_PREVIEW=1` are active; it is also excluded from robots.

Run `pnpm preview:shots` to capture the generated inventory in Arabic and English, light and dark, at 390 px and 1280 px. PNGs are written to the ignored `preview/shots/` directory and [`preview/index.html`](preview/index.html) is regenerated as a portable contact sheet. For a local diagnostic subset, set `PREVIEW_SHOTS_MATCH` to an entry-id regular expression or `PREVIEW_SHOTS_LIMIT` to a positive count.

The rail lists unsupported scenario states as **Blocked** instead of substituting preview-only markup. These are routes whose current product implementation is fed by server fixtures and does not expose loading, empty, or error behavior through the existing MSW boundary; their exported image remains the real baseline route and the blocked reason is included in the contact-sheet caption.
