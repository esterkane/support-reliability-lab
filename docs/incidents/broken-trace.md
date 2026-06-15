# Incident: Broken trace correlation

**Tenant:** `missing-trace` · **Catalog key:** `broken-trace` · **Status:** implemented

## Symptom
A request shows up in the logs, but its downstream work has no connected spans — the
trace "ends" at the edge and the rest of the work is invisible. Debugging stalls because
the evidence path is broken, not because the request failed.

## Reproduce
Deterministic. Open `http://missing-trace.localhost:3000` (or `…/s/missing-trace` on
Vercel). The page issues two identical upstream calls with the same trace id:
- one **propagating** `traceparent` → the upstream reports `traced: true` (CONNECTED)
- one **dropping** it → the upstream reports `traced: false` (ORPHANED)

The orphaned call still succeeds — that's what makes this subtle. Nothing errors; the
*evidence* is just missing.

```bash
TP="00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01"
# Propagated -> {"traced":true,...}
curl -s -H "traceparent: $TP" http://127.0.0.1:3000/api/upstream | grep -o '"traced":[a-z]*'
# Dropped -> {"traced":false,...}
curl -s http://127.0.0.1:3000/api/upstream | grep -o '"traced":[a-z]*'
```

## Where to look first
**`traceparent` propagation.** Confirm the top-level request span exists, then check
whether the outgoing call carried the trace context. A present top span with a missing
downstream span = a propagation problem, not a logic problem.

## Root cause
The trace context header is not forwarded to the downstream call (the upstream is left
off the propagation allow-list, or an ignored URL pattern strips it), so the downstream
span starts a new, disconnected trace.

## Fix / mitigation
- Restore propagation for the intended upstreams in
  [`instrumentation.ts`](../../instrumentation.ts) via
  `instrumentationConfig.fetch.propagateContextUrls`.
- In app code, forward `traceparent` on outgoing calls (see `lib/trace.ts`
  `buildPropagationHeaders`). Re-run the scenario until the trace is contiguous.

## Verify
- The propagated call reports `traced: true`; after the fix the real call does too.
- `lib/trace.test.ts` covers parse/generate/propagation, including the dropped-header case.

## Prevent
Treat the evidentiary path as part of the fix: when a span is hard to find, add a custom
span or propagate context so the next person finds it immediately. Keep the propagation
allow-list in one place and review it when adding an upstream.
