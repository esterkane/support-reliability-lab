# Incident: Serverless timeout on slow upstream

**Tenant:** `slow-api` · **Catalog key:** `serverless-timeout` · **Status:** implemented

## Symptom
The customer loads their tenant page and sees a **504 Gateway Timeout** (or a long
stall that eventually errors). Other tenants are fine.

## Reproduce
Deterministic — the mock upstream is delayed past the route's tolerance every time.

```bash
# Browser
open http://slow-api.localhost:3000

# Or via header (no DNS needed)
curl -i -H "Host: slow-api.localhost:3000" http://127.0.0.1:3000/
```

Toggle it on/off from `/admin` (set `slow-api` to `serverless-timeout` / `none`).

Mechanics: the tenant page calls `/api/upstream?delayMs=8000`, but the request is
bounded by a `TOLERANCE_MS` (2500 ms) `AbortSignal`. The upstream never answers in
time, so the fetch aborts and the page renders 504. On Vercel the same bound is
expressed as the route's `maxDuration`.

## Where to look first
**Trace timeline → the longest fetch span.** The outbound call to `/api/upstream`
owns essentially the entire wall clock and never completes. Confirm in runtime logs
filtered by Host=`slow-api...` and Route, and check the request/trace ID.

## Root cause
The upstream's response time exceeds the route's tolerance, so the function is
aborted before it can return — the platform is healthy; the dependency is slow.

## Fix / mitigation
Pick the one that matches the real workload:
1. **Faster upstream path** — cache, paginate, or precompute so the call returns
   within tolerance.
2. **Bounded retry / fallback** — short timeout + degraded response instead of a hard
   504.
3. **Architectural** — stream the response, or move genuinely long work to a queue /
   background function rather than a request-path fetch.

Plan note: function `maxDuration` and memory tuning are runtime/plan-specific
(dashboard-configurable on Pro/Enterprise; Hobby uses defaults).

## Verify
- The repro command returns 200 within tolerance after the fix.
- The trace shows the fetch span completing inside `TOLERANCE_MS`.

## Prevent
Add a regression test asserting the tenant resolves to the right subdomain and that a
within-tolerance upstream renders healthy. Keep the upstream's injectable delay behind
the incident catalog so the fault can't leak into unrelated routes.
