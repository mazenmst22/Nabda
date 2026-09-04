# Local mock runbook

## Mock surfaces

Nabda has two intentionally separate mock surfaces:

- **Vitest / typed-client contract tests:** `src/mocks/server.ts` starts the MSW Node server with all 45 contract handlers.
- **Browser and Playwright:** Next.js route handlers under `src/app/v1` preserve state across browser requests. Test-only reset/control routes live under `src/app/api/testing`.

Reset state before an isolated browser scenario:

```bash
curl -X DELETE http://localhost:3000/api/testing/booking
curl -X DELETE http://localhost:3000/api/testing/reception
curl -X DELETE http://localhost:3000/api/testing/doctor
curl -X DELETE http://localhost:3000/api/testing/developer
```

These endpoints are local test infrastructure and must not be deployed with the real API.

## Latency and offline controls

MSW exposes deterministic process-local controls from `src/mocks/controls.ts`:

```ts
import { resetMockControls, setMockLatency, setMockOffline } from "@/mocks/controls";

setMockLatency(800); // delay every mock JSON response by 800 ms
setMockOffline(true); // return a network error from every mock JSON response
resetMockControls(); // latency 0, online
```

Always reset controls in `afterEach`; otherwise one test can contaminate the next. For browser-level offline behavior, Playwright uses `context.setOffline(true)` around the intended request and restores it in `finally`. Browser latency should use request routing or Chrome network emulation so the production client, retry logic and loading UI are all exercised.

## Reproducing contract errors

| Code                      | Local reproduction                                                                                                                                                           |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `SLOT_TAKEN`              | Open `/{locale}/doctor/mariam-fouad?bookingScenario=slot-taken`, then hold the 10:00 fixture slot. MSW also returns it when `slotStart` contains `T10:00:00`.                |
| `HOLD_EXPIRED`            | Open the doctor page with `?bookingScenario=hold-expired`; commit after the hold step. In direct API tests, commit `holdId: "hold-expired"`.                                 |
| `VERSION_CONFLICT`        | Open `/{locale}/reception?appointmentConflict=1` and move an appointment. Direct MSW updates fail when `If-Match` is not the current version.                                |
| `CONSENT_REQUIRED`        | Start capture in the doctor workspace without accepting the current consent text. The UI must stay in `consent-required`.                                                    |
| `CONSENT_REVOKED`         | Revoke the active consent through `DELETE /v1/consents/{id}` during capture; capture must stop immediately.                                                                  |
| `NOT_AUTHORIZED`          | Set the `nabda-session` cookie to a role outside the route policy and request a guarded page. The response is the same non-disclosing 403 for missing and forbidden records. |
| `CLINIC_SCOPE_VIOLATION`  | In an API integration test, send an `X-Clinic-Id` that does not own the requested fixture. This remains a backend-required scenario.                                         |
| `EXTRACTION_INVALID_JSON` | Configure the doctor test state with `POST /api/testing/doctor` and `{ "extractionInvalid": true }`, then run extraction.                                                    |
| `PROVIDER_UNAVAILABLE`    | In MSW, request extraction for encounter `provider-unavailable`, or create a hold whose doctor is `provider-unavailable`.                                                    |
| `RATE_LIMITED`            | Override an MSW handler with HTTP 429 and the standard envelope. The production backend must add an integration fixture for this code.                                       |

The envelope is always JSON with `type`, `title`, `status`, stable `code`, safe localized `detail`, and `correlationId`; field `errors` is reserved for 422 responses.

## Golden-path diagnostics

- Run one locale quickly: `pnpm exec playwright test e2e/golden-paths.spec.ts --grep "ar"`.
- Keep traces from a failure under `test-results/playwright`; open one with `pnpm exec playwright show-trace <trace.zip>`.
- Update RTL screenshots only after an intentional visual review: `pnpm test:visual:update`, then rerun `pnpm test:visual` without the update flag.
- Lighthouse reports are written to `artifacts/lighthouse`; the per-route JavaScript report is `artifacts/bundle-report.md`.
