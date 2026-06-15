# Observability & local tracing

On Vercel, `@vercel/otel` (registered in [`instrumentation.ts`](../instrumentation.ts))
lights up infrastructure spans (routing/middleware/cache), fetch spans, and framework
spans automatically; `@vercel/speed-insights` reports Core Web Vitals. Locally, you can
get the same trace view with the bundled OpenTelemetry stack.

## Bring up the local stack
```bash
docker compose -f infra/otel/docker-compose.yml up -d
```
This starts an OTel Collector plus three backends:

| Backend | URL | Use |
|---|---|---|
| Jaeger | http://localhost:16686 | Trace timelines, span waterfalls |
| Zipkin | http://localhost:9411 | Alternative trace view |
| Prometheus | http://localhost:9090 | Metrics from the collector |

## Point the app at the collector
```bash
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318 npm run dev
```
`@vercel/otel` reads `OTEL_EXPORTER_OTLP_ENDPOINT` and exports OTLP/HTTP to the collector,
which fans traces out to Jaeger + Zipkin and metrics to Prometheus. With the var unset,
tracing is a no-op — the app runs normally.

## Generate traces to look at
```bash
# A clean trace (fast upstream span):
curl -s -H "Host: healthy.localhost:3000" http://127.0.0.1:3000/ >/dev/null

# A trace where one fetch span owns the whole timeline then aborts (serverless-timeout):
curl -s -H "Host: slow-api.localhost:3000" http://127.0.0.1:3000/ >/dev/null
```
Open Jaeger, select service **support-reliability-lab**, and find the request. The
`serverless-timeout` trace shows the outbound `/api/upstream` fetch span consuming the
full ~2.5 s tolerance — exactly the "look at the longest fetch span" step in the
`trace-debug` skill.

## Tear down
```bash
docker compose -f infra/otel/docker-compose.yml down
```

## Notes
- Context propagation across the mock upstreams is configured in `instrumentation.ts`
  (`fetch.propagateContextUrls`). The `broken-trace` incident is what happens when an
  upstream is left off that list — the downstream span disconnects.
- If you also wire an external APM (Sentry/Datadog), set Sentry up to coexist with
  `@vercel/otel` rather than registering its own OTel SDK, to avoid duplicate tracers.
