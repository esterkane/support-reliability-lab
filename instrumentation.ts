import { registerOTel } from "@vercel/otel";

/**
 * OpenTelemetry registration. On Vercel this lights up infrastructure spans
 * (routing/middleware/cache), fetch spans, and framework spans automatically.
 * Locally, point an OTLP collector at the app (Jaeger :16686 / Zipkin :9411)
 * via the Vercel OpenTelemetry dev setup.
 *
 * fetch.propagateContextUrls keeps the trace contiguous across our mock
 * upstreams. The "broken-trace" incident is what happens when an upstream is
 * left OFF this list — see docs/incidents (broken-trace).
 */
export function register() {
  registerOTel({
    serviceName: "support-reliability-lab",
    instrumentationConfig: {
      fetch: {
        propagateContextUrls: ["localhost", "mock-upstream.internal"],
      },
    },
  });
}
