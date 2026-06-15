# Incident: Wrong tenant resolved from middleware

**Catalog key:** `wrong-tenant` · **Status:** guarded (proven impossible by test)

Unlike the other incidents, this one is not a toggle — it's the **isolation guarantee**.
A request for one tenant's host must never render another tenant's data. We keep it from
regressing with tests rather than reproducing it on demand.

## How it's guarded
- All host parsing lives in one place: [`lib/subdomain.ts`](../../lib/subdomain.ts)
  (unit-tested in `lib/subdomain.test.ts`).
- The real middleware is exercised end-to-end in
  [`tests/middleware.integration.test.ts`](../../tests/middleware.integration.test.ts):
  a tenant host only ever rewrites to its own `/s/<subdomain>`, never another tenant's;
  reserved/root hosts pass through; the request path is preserved.

## If it ever regressed — debugging playbook
1. **Reproduce** by requesting the affected host (locally with a Host header, or via the
   tenant's domain) and confirming the rendered tenant differs from the requested one.
2. **Where to look first:** the middleware routing decision. Compare what the middleware
   resolved (the `x-tenant` response header it sets) against what the page rendered.
   Inspect the Host header and the routing span; grab the request id.
3. **Root cause** is almost always host normalization: a case/whitespace/port edge case,
   a too-loose suffix match, or a fallback that defaults to the wrong tenant.
4. **Fix** in `lib/subdomain.ts` only, then add the failing host as a new case to the
   unit + integration tests so the exact regression can never return.

## Prevent
Never parse the host outside `lib/subdomain.ts` / `middleware.ts`. Pages and components
must resolve tenants through `lib/tenants.ts`. Every new host edge case becomes a test.
