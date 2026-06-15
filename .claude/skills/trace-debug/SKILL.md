---
name: trace-debug
description: Debug with observability — runtime logs and OpenTelemetry traces. Use when a request is slow or 504s, when downstream spans are missing/disconnected, when investigating cache status (HIT/MISS/STALE), or when the user asks to trace a request, correlate logs, or root-cause with evidence instead of guessing.
---

# Trace & log debugging

Treat observability as a debugging *system*, not a dashboard. The goal is a contiguous
evidentiary path from the customer-facing symptom to the offending span.

## Setup in this repo
- `instrumentation.ts` registers `@vercel/otel` with `serviceName: support-reliability-lab`
  and fetch context propagation for the mock upstreams.
- Locally, point traces at the OTel collector dev setup (Jaeger `:16686`, Zipkin `:9411`,
  Prometheus `:9090`) or read the console exporter.
- On Vercel: runtime logs + traces; `@vercel/speed-insights` for Core Web Vitals.

## Procedure

1. **Start at the request, not the code.** In runtime logs, filter by **Host**, **Route**,
   **Deployment**, and **Cache**. Grab the request/trace ID.
2. **Follow the trace.** Inspect spans top-down:
   - infrastructure spans → routing / middleware / cache
   - fetch spans → outgoing HTTP (where timeouts usually hide)
   - framework + custom spans → render / data work
3. **Localize the time or the break.** For latency, find the span that owns the wall
   clock. For a *missing* span, you have a propagation problem, not a logic problem.
4. **Cache questions** → compare `x-vercel-cache` (`HIT`/`MISS`/`STALE`) against whether
   render work actually ran in the trace. Mismatch = the cache bug.
5. **Broken trace correlation** → check `traceparent` propagation. Restore propagation in
   `instrumentation.ts` (`fetch.propagateContextUrls`) for the intended upstreams and
   re-run until the trace is contiguous. Fixing the evidence path is the deliverable.

## Mapping symptoms → first signal
| Symptom | Look here first |
|---|---|
| 504 / stall | Trace timeline → longest fetch span; route `maxDuration` |
| Stale content | `x-vercel-cache` + runtime-log Cache filter; trace render presence |
| Missing downstream data in trace | `traceparent` propagation; ignored URL patterns |
| Wrong tenant rendered | Middleware routing span vs. rendered tenant; Host header |

## Output
Write the root cause as: *"<signal> shows <where>, therefore <cause>."* Then add a
custom span or log field if the evidence was hard to find, so the next person finds it
faster. Hand the narrative to `runbook-writer`.
