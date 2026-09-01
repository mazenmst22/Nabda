# Frontend-to-backend gap register

The ASP.NET Core service does not yet exist. The frontend currently supplies equivalent behavior through MSW and in-process Next.js route handlers. Every item below is therefore a backend delivery requirement, not evidence that a production capability exists.

## Cross-cutting contract

- Implement versioned JSON routing under `/v1` and ISO 8601 UTC timestamps.
- Validate `Authorization: Bearer`, tenant-scope every operation from `X-Clinic-Id`, and reject cross-clinic access without confirming whether a record exists.
- Propagate `X-Correlation-Id`; deduplicate every POST, PATCH and DELETE by `Idempotency-Key`; enforce `If-Match` on PATCH/PUT with atomic version increments.
- Localize safe error detail from `Accept-Language: ar|en` and return the documented error envelope. Implement all explicit codes: `SLOT_TAKEN`, `HOLD_EXPIRED`, `VERSION_CONFLICT`, `CONSENT_REQUIRED`, `CONSENT_REVOKED`, `NOT_AUTHORIZED`, `CLINIC_SCOPE_VIOLATION`, `EXTRACTION_INVALID_JSON`, `PROVIDER_UNAVAILABLE`, and `RATE_LIMITED`.
- Persist audit events for every sensitive read and mutation, including actor, tenant, correlation ID, entity/version, time and outcome.
- Supply production OIDC discovery, token issuance/renewal, role and clinic claims, expiry, safe renewal, and step-up authentication for privileged configuration and secret reveal.

## HTTP endpoint worklist

All 45 contract operations are mocked and must be implemented with responses matching `src/lib/schemas`.

| Area         | Method and path                              | Required behavior                                                                                |
| ------------ | -------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Directory    | `GET /v1/public/clinics`                     | Search/paginate clinic directory by query, city and district.                                    |
| Directory    | `GET /v1/public/clinics/{slug}`              | Clinic profile, hours, location and optional white-label theme.                                  |
| Directory    | `GET /v1/public/specialties`                 | Localized specialty catalogue.                                                                   |
| Directory    | `GET /v1/public/doctors`                     | All documented filters/sorts with current fee and next availability.                             |
| Directory    | `GET /v1/public/doctors/{slug}`              | Bilingual profile scoped to member clinics.                                                      |
| Directory    | `GET /v1/public/doctors/{id}/availability`   | Source-of-truth `DaySlots[]` for the UTC range.                                                  |
| Scheduling   | `POST /v1/appointments/holds`                | Atomically hold a slot and return server `expiresAt`; conflict atomically.                       |
| Scheduling   | `DELETE /v1/appointments/holds/{holdId}`     | Idempotently release an active hold.                                                             |
| Scheduling   | `POST /v1/appointments`                      | Idempotent commit; success only after scheduling storage commits.                                |
| Scheduling   | `GET /v1/appointments`                       | Filter by patient/doctor, UTC range and status with ownership checks.                            |
| Scheduling   | `GET /v1/appointments/{id}`                  | Non-disclosing tenant/subject authorization.                                                     |
| Scheduling   | `PATCH /v1/appointments/{id}`                | Atomic cancel/status/reschedule with `If-Match`; reschedule holds new slot before releasing old. |
| Queue        | `GET /v1/queue`                              | Clinic-owned queue position and schedule-derived wait estimate.                                  |
| Queue        | `PATCH /v1/queue/{entryId}`                  | Versioned waiting/called/in-room/done/skipped transition.                                        |
| Patients     | `GET /v1/patients`                           | Authorized search and pagination.                                                                |
| Patients     | `POST /v1/patients`                          | Idempotent quick-create/registration with duplicate handling.                                    |
| Patients     | `GET /v1/patients/{id}`                      | Authorized patient aggregate header.                                                             |
| Patients     | `PATCH /v1/patients/{id}`                    | Versioned profile, locale, numeral and notification preference updates.                          |
| Patients     | `GET /v1/patients/{id}/timeline`             | Aggregate appointments, encounters and approved prescriptions; never expose drafts to patients.  |
| Consent      | `POST /v1/consents`                          | Record actor, purpose, current text version and timestamp.                                       |
| Consent      | `DELETE /v1/consents/{id}`                   | Immediate revocation event consumable by active capture sessions.                                |
| Encounters   | `POST /v1/encounters`                        | Create a versioned encounter linked to authorized patient/appointment/doctor.                    |
| Audio        | `POST /v1/encounters/{id}/audio/upload-url`  | Signed, short-lived upload URL and stable `audioKey`.                                            |
| Audio        | `POST /v1/encounters/{id}/audio/complete`    | Idempotently verify key/checksum/duration and enqueue transcription.                             |
| Jobs         | `GET /v1/jobs/{jobId}`                       | Authoritative job state and monotonic progress.                                                  |
| Transcript   | `GET /v1/encounters/{id}/transcript`         | Latest authorized speaker-segment version.                                                       |
| Transcript   | `PATCH /v1/encounters/{id}/transcript`       | Append a new version; preserve history and editor attribution.                                   |
| Extraction   | `POST /v1/encounters/{id}/extraction`        | Enqueue extraction; return invalid JSON honestly without partial payloads.                       |
| Prescription | `GET /v1/encounters/{id}/prescriptions`      | Full clinical version history for authorized clinicians only.                                    |
| Prescription | `POST /v1/encounters/{id}/prescriptions`     | Validate the exact extraction payload and create a draft version.                                |
| Prescription | `POST /v1/prescriptions/{id}/approve`        | Clinician-only approval creating a new immutable version with actor/time.                        |
| Pulse        | `POST /v1/pulse/conversations`               | Tenant/session-scoped conversation creation.                                                     |
| Pulse        | `POST /v1/pulse/conversations/{id}/messages` | Stream safe responses and proposed tool calls; apply clinical refusal/emergency policies.        |
| Pulse        | `POST /v1/pulse/conversations/{id}/confirm`  | Confirm/cancel a proposal; booking confirmation must reuse scheduling commit.                    |
| Pulse        | `POST /v1/pulse/conversations/{id}/handoff`  | Assign staff and make the conversation state human.                                              |
| Admin        | `GET /v1/admin/settings`                     | Authorized tenant settings.                                                                      |
| Admin        | `PATCH /v1/admin/settings`                   | Step-up protected, versioned settings update.                                                    |
| Admin        | `GET /v1/admin/providers`                    | Provider/model/region/timeout/threshold/retention with masked secrets.                           |
| Admin        | `PATCH /v1/admin/providers/{id}`             | Step-up protected versioned provider configuration.                                              |
| Admin        | `GET /v1/admin/flags`                        | Tenant feature flags.                                                                            |
| Admin        | `PATCH /v1/admin/flags/{key}`                | Versioned flag mutation with audit event.                                                        |
| Admin        | `GET /v1/admin/prompts`                      | Prompt template version history.                                                                 |
| Admin        | `POST /v1/admin/prompts`                     | Publish a new immutable prompt version.                                                          |
| Admin        | `GET /v1/admin/audit`                        | Actor/entity/date filters and server pagination suitable for 10,000+ rows.                       |
| Admin        | `GET /v1/admin/health`                       | API, database, queue, storage and per-provider status plus latency/failure metrics.              |

## Realtime, storage and external integrations

- Host SignalR at `/hubs/jobs`; emit sequenced `jobProgress`, `jobCompleted`, and `jobFailed` events. Replays after reconnect must retain sequence so clients can deduplicate by `jobId + sequence`; REST job state wins on disagreement.
- Publish consent-revocation events with enough latency and reliability to stop an active browser capture immediately.
- Provide private object storage with signed upload URLs, checksum verification, retention/deletion enforcement and no public audio access. Confirmed uploads must be safe to retry with the same `audioKey`.
- Connect configured STT and LLM adapters, enforce region/timeout/confidence/retention settings, validate extraction against the exact prescription JSON contract, and retain provider/model/version provenance.
- Integrate SMS, email and WhatsApp delivery for all six notification events, clinic templates, mandatory-preference policy, delivery receipts, retry/dead-letter behavior and per-channel send logs.
- Generate reminder schedules in Africa/Cairo while storing execution timestamps in UTC; handle Egyptian timezone rule changes without browser-timezone dependence.
- Supply deployment-controlled emergency guidance and phone numbers. Pulse must never return diagnosis, medication recommendation or severity estimation content for rendering.

## Acceptance contract

Backend readiness is complete only when the existing 45-case schema suite can target an isolated API tenant without MSW, the two bilingual golden paths pass against it, idempotency/concurrency race tests are repeatable, and draft prescriptions remain unreachable through every patient-scoped endpoint.
