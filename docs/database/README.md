# Database documentation

Not yet written. No database exists yet — the frontend runs against MSW and in-process route handlers.

Belongs here: the schema behind the patient aggregate, clinic-scoped tenancy and how it is enforced, optimistic concurrency (`If-Match` / version columns), audit event storage, and retention/erasure policy for clinical data.

See [`../backend/GAPS.md`](../backend/GAPS.md) for the contract the backend must satisfy.
