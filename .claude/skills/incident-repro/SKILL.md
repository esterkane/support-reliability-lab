---
name: incident-repro
description: Reproduce, instrument, and document a Support Reliability Lab incident end-to-end. Use when adding a new incident fixture, reproducing a tenant failure (timeout, 5xx, stale cache, wrong-tenant, payload-too-large, broken trace), or when the user says "repro this incident", "add an incident", or names a seed tenant that is failing.
---

# Incident reproduction

Drive one incident through the full support loop: reproduce → observe → root-cause →
fix → regression test → runbook. Every incident in this repo must end up deterministic,
reproducible via a single toggle, observable, and documented.

## Workflow

1. **Identify the incident.** Find its entry in `lib/incidents.ts`. If it does not
   exist yet, add it there first — the catalog is the source of truth. Each entry needs
   a `key`, human title, the fault it injects, and the evidence path.
2. **Pick / create the seed tenant.** Map the incident to a tenant in `lib/tenants.ts`
   (e.g. `slow-api` → `serverless-timeout`). One tenant carries one incident.
3. **Reproduce locally.** Toggle the incident in the admin console (`/admin`) or set the
   tenant's `incident` field, then hit the tenant:
   - Browser: `http://<subdomain>.localhost:3000`
   - Header form: `curl -i -H "Host: <subdomain>.localhost:3000" http://127.0.0.1:3000/`
   Confirm the failure is **deterministic** — same input, same failure, every time.
4. **Capture evidence.** Note where the reviewer looks first per the catalog's evidence
   path (trace timeline, fetch spans, `x-vercel-cache`, runtime-log filters, request ID).
   On Vercel this is runtime logs + traces; locally it is the OTel collector / console.
5. **Form the root-cause hypothesis** in one sentence, tied to evidence — not a guess.
6. **Fix or mitigate.** Keep fault injection behind the incident catalog; never scatter
   `if (broken)` checks. Document the corrected mental model, not just the patch.
7. **Add a regression test** that fails before the fix and passes after. For routing
   incidents, prove one tenant can never render another's data.
8. **Write the runbook** — hand off to the `runbook-writer` skill for the customer-facing
   doc and `docs/incidents/<key>.md`.

## Definition of done
- Catalog entry + seed tenant + single toggle.
- Reproduction command documented and verified deterministic.
- Evidence path confirmed (you actually saw the signal).
- Regression test added and green.
- `docs/incidents/<key>.md` playbook published.

## Anti-patterns
- A repro that only fails "sometimes" — make it deterministic before anything else.
- Fixing the symptom without restoring the evidentiary path (esp. trace incidents).
- Hardcoding tenant/incident state outside `lib/tenants.ts` / `lib/incidents.ts`.
