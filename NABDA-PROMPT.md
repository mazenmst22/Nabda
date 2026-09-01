Build the complete frontend for **Nabda (نبضة)** — a clinic management system for small and medium clinics in Egypt, with a patient-facing booking layer and an embedded AI assistant called **Pulse**.

## PRODUCT

Nabda's organising principle is the **patient aggregate**: appointments, encounters, recordings, transcripts, prescriptions, billing and audit history all resolve to one patient identity inside one clinic's scope.

The market reference is Vezeeta. The difference matters: Vezeeta _lists_ doctors and estimates availability. Nabda _runs the clinic's schedule_, so its availability is the source of truth. Match Vezeeta's Egyptian conventions — **examination fee always visible before booking**, **"book free, pay at the clinic"** with no card required — and beat it on truthfulness of data.

Two doors into the same booking engine: a **Nabda-branded directory** across member clinics at `/search`, and a **white-label clinic page** at `/clinic/[slug]` rendered in that clinic's own accent colour, which the clinic links from its Facebook page and Google listing. Do not fork the booking flow.

## STACK — fixed, do not substitute

Next.js 15 App Router, React 19, TypeScript strict with `noUncheckedIndexedAccess`, pnpm. Tailwind CSS v4 consuming CSS custom properties. TanStack Query v5 for all server state (never `useEffect` + `fetch`). Zustand for transient UI state only. React Hook Form + Zod for every form. next-intl with `/[locale]` routing. MSW for the mocked API. Vitest + Testing Library, Playwright + `@axe-core/playwright`. `@microsoft/signalr` for job progress.

**No component library.** Build the primitives yourself in `src/components/ui`. The RTL and token requirements make generic kits a liability.

**Frontend only.** The real backend is ASP.NET Core + EF Core and does not exist yet. Every network call goes through one typed client in `src/lib/api/client.ts`, intercepted by MSW handlers, so swapping to the real API is a base-URL change. Every request carries `Authorization`, `X-Clinic-Id`, `X-Correlation-Id`, `Accept-Language`; every mutation carries `Idempotency-Key`; every update carries `If-Match` with the entity version. Parse errors into a discriminated union keyed on a stable `code`, and handle at minimum: `SLOT_TAKEN`, `HOLD_EXPIRED`, `VERSION_CONFLICT`, `CONSENT_REQUIRED`, `NOT_AUTHORIZED`, `EXTRACTION_INVALID_JSON`, `PROVIDER_UNAVAILABLE`.

## NON-NEGOTIABLES

**Arabic-first, RTL-first.** `ar` is the default locale; English is the toggle. Use CSS logical properties everywhere — `ms-`/`me-`/`ps-`/`pe-`/`start-`/`end-`, never `ml-`/`mr-`/`pl-`/`pr-`/`left-`/`right-`. Write a custom ESLint rule that fails the build on physical properties; without it the Arabic layout rots one component at a time. Never letter-space Arabic (it breaks the joins and the word falls apart). Never uppercase Arabic. Arabic type runs +8% size and +0.15 line-height against its Latin step. Times, prices, phone numbers and IDs are **always** wrapped in an LTR isolate (`direction:ltr; unicode-bidi:isolate`) or bidi reorders `09:30` into `30:09`. Western numerals by default, Eastern Arabic (٠–٩) as a user preference. Patient-facing Arabic is Egyptian colloquial; clinical and legal surfaces use Modern Standard. Address patients as حضرتك.

**Gold is Pulse and only Pulse.** `#E5A93C` marks the AI avatar, AI-authored content and AI suggestions. Never a CTA, never a promo, never a highlight. Users learn "if it glows, it's thinking" in one session. **When a human takes over from Pulse the gold must go** — the avatar cross-fades gold → teal and all motion stops, so a user can tell software from staff at a glance without reading.

**Never encode status in colour alone.** Every appointment state, confidence level and job state carries an icon and a text label as well as a colour.

**Three safety invariants that are UI requirements.** A booking is not confirmed until the scheduling transaction commits — never render success optimistically. An extracted prescription is not clinical truth until a clinician approves it — extraction output is always visibly marked unapproved and never reaches a patient surface. Pulse never diagnoses, recommends medication, estimates severity, or claims to be human; emergency language stops automation entirely and renders the configured emergency numbers with no dismiss-and-continue. Consent gates recording with no bypass, not even in dev.

**Accessibility is a release gate.** 44×44px minimum touch targets, 16px minimum body text, visible focus rings, full keyboard operation, 200% zoom without horizontal scroll, live regions for async progress, `prefers-reduced-motion` honoured. Every route passes axe with zero violations.

**Performance is a brand promise.** The user is on a mid-range Android on a patchy Cairo connection. LCP under 1.8s on Slow 4G, under 120KB critical-path JS per route. Self-host fonts subset to Latin + Arabic with `font-display:swap` and a real Arabic fallback (Segoe UI, Noto Sans Arabic) so the layout never jumps. No hero video, no carousel.

## DESIGN TOKENS

Palette: Nabda Teal `#0E7C74` (primary actions, links, active), Deep Pulse `#063A38` (dark surfaces, headings), Ink `#04191A` (body text, dark ground — teal-biased, never neutral black), Faience `#3FB6A8` (dark-mode primary), Mint `#8FD9CD` (tints), Mist `#E3EEEC` (cards, dividers), Paper `#F4F8F7` (page ground), Pulse Gold `#E5A93C` (Pulse only), Gold Glow `#F6D08A`, Gold Deep `#8A5E10` (the only gold permitted for text on light — `#E5A93C` on paper is 1.95:1 and fails), Lapis `#12305C` (data viz and B2B only, never a CTA), Carnelian `#BE4224` (destructive), Slate `#5B7472` (secondary text).

Define the complete light palette on bare `:root`; redefine only the tokens under `@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) }` and again under `:root[data-theme="dark"]`. Never declare a colour whose only definition lives inside a media or `[data-theme]` block. Components consume semantic tokens (`--action-primary-bg`), never raw hex.

Type: **Readex Pro** for display and wordmark (variable, use 200–600, never 700), **IBM Plex Sans Arabic** for interface and body (300–600), **IBM Plex Mono** for data, times, prices and uppercase labels (Latin only — the uppercase mono label style switches to Plex Arabic 500 at normal case in Arabic).

Spacing 4px base, 8px rhythm: 4 · 8 · 12 · 16 · 24 · 40 · 72. Radii: 8px chips and inputs, 10px buttons, 13px cards, 999px avatars and Pulse. Motion has two registers: 160–220ms `cubic-bezier(.2,.7,.3,1)` with opacity and 4–8px translate for the product — no bounce, no spring; and continuous 1.9–2.4s breathing for Pulse, which is the only element allowed to animate while idle.

Pulse avatar states: idle (core dot breathing), listening (three rings expanding outward), thinking (one 30° arc rotating), speaking (five bars), acting (gold sweep line), done (one hard beat), **handoff (gold → teal cross-fade, all motion stops)**.

## WHAT TO BUILD

**Public directory** — home where the search field is the hero above the fold at 390px and the headline states an outcome not a value proposition; search results with filters for specialty, sub-specialty, district, availability, fee range, gender and title, filter state in the URL, as a bottom sheet on mobile and a sidebar at ≥1024; doctor profile with fee and next slot above the fold; white-label clinic page; specialty browse; for-clinics band in lapis; help, about and legal with full clinic-registration details.

Doctor card order: name · title · specialty tags · district · **fee in EGP** · rating · real next slot · a primary button naming the actual slot (`احجز ٩:٣٠` / `Book 09:30`), never "Book now".

**Booking** — slot picker → hold with a visible countdown warning at 60s → identify or register patient → price confirmation naming doctor, date, time, fee and where payment happens → commit with an idempotency key reused across retries → confirmation with add-to-calendar and "what happens next". Handle `SLOT_TAKEN` by offering three alternatives with the same doctor, `HOLD_EXPIRED` by returning to the picker with the selection preserved, and preserve the intended slot through a sign-in redirect.

**Patient workspace** — appointments upcoming and past, reschedule (hold the new slot before releasing the old), cancel with a confirmation naming doctor and time, prescriptions (approved versions only — write a test proving drafts never reach a patient surface), encounter summaries, notification preferences as a channel × event matrix for SMS/email/WhatsApp, profile with language and numeral preference.

**Receptionist workspace** — day schedule grid with doctors as columns and time as rows, drag to move with optimistic concurrency and real `VERSION_CONFLICT` recovery; queue board (waiting / called / in-room / done / skipped) showing the real wait computed from the clinic's own schedule; patient search and quick-create; billing-lite. **Keyboard-first is a hard requirement**: `/` focuses search, `n` new appointment, `j`/`k` through the queue, `Enter` calls next, `?` shortcut help. The front desk will not reach for a mouse.

**Doctor workspace** — my schedule; patient chart as one page representing the patient aggregate; start encounter → consent gate → AudioCapture owning idle, requesting-permission, consent-required, recording, paused, stopping, uploading, upload-failed-retryable, done and device-error, using MediaRecorder with a live waveform, discarding browser-held audio as soon as upload confirms; transcript editor with speaker tags and per-segment confidence where edits create a new version rather than mutating; extraction review showing each medication's normalised value **beside its original `rawText`**, with per-field confidence, where anything below 0.85 renders with an uncertainty treatment and blocks approval until explicitly acknowledged; approve and sign producing a versioned prescription with history and diff.

**Developer workspace** — tenant settings, STT and LLM provider configuration with secrets masked until step-up re-authentication, feature flags, prompt template versions with diff, audit log viewer, and a health dashboard with queue depth, p50/p95 job latency and failure rate. This role configures the system and **must not** read clinical records — build the guard and write the test that proves it.

**Pulse** — docked panel at ≥1024, full-screen sheet below, plus a `/pulse` route. Streamed responses, the seven-state avatar, and **tool-confirmation cards**: when Pulse proposes a booking, render a card naming doctor, date, time and fee with explicit Confirm and Cancel, and commit nothing until the user confirms and the API returns a committed appointment — reusing the same booking commit path, not a second one. Pulse is also the empty-state recovery everywhere in the product: "No cardiologist in Maadi before Thursday — ask Pulse to widen the search?"

## BUILD ORDER

Scaffold and the RTL lint rule → design tokens, fonts and themes → i18n primitives and formatters → UI primitives → API layer, Zod schemas and MSW fixtures with realistic Egyptian data (Arabic and English doctor names, Cairo and Giza districts, EGP fees 250–900, clinic hours with a Friday gap, and handlers that deliberately return each error code) → auth, RBAC and the four app shells → public directory → booking → patient workspace → Pulse → receptionist → doctor and audio capture → transcript and extraction review → developer workspace → notifications → quality gate.

Work through this in that order, one coherent commit per stage. Do not start a stage until the one before it builds and its tests pass.

## DEFINITION OF DONE

`pnpm lint && pnpm typecheck && pnpm test && pnpm test:e2e && pnpm build` all pass. Plus, for every feature: correct in ar (RTL) and en (LTR); correct in light and dark; works at 320, 768, 1280 and 1920; a keyboard-only path through the whole flow; loading, empty, error and permission-denied states all designed; and every string in `messages/ar.json` and `messages/en.json` with **no hardcoded copy anywhere**.

Write real Arabic and English copy. No lorem ipsum, no placeholder strings, no emoji, no stock-photo doctors. Voice: plain never simplified, certain never boastful, warm never familiar, calm under bad news. Not "Oops! Something went wrong" but "We couldn't hold that slot — someone booked it 40 seconds ago. Here are three more with Dr. Farouk this week."
