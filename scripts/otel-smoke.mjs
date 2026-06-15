// End-to-end observability smoke test: prove a request to the app produces a trace
// that lands in Jaeger via the local OpenTelemetry collector.
//
// Prereqs:
//   docker compose -f infra/otel/docker-compose.yml up -d
//   OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318 PORT=3100 npm run start
//   node scripts/otel-smoke.mjs
//
// Exits 0 if a trace for the service appears in Jaeger, 1 otherwise.
const APP = process.env.BASE_URL || "http://127.0.0.1:3100";
const JAEGER = process.env.JAEGER_URL || "http://localhost:16686";
const SERVICE = "support-reliability-lab";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function generateTraffic() {
  for (let i = 0; i < 5; i++) {
    await fetch(`${APP}/`, { headers: { host: "healthy.localhost:3100" } }).catch(
      () => {},
    );
  }
  console.log("generated traffic against", APP);
}

async function findTrace() {
  // Spans flush on an interval; poll Jaeger for up to ~45s.
  for (let attempt = 1; attempt <= 15; attempt++) {
    const res = await fetch(
      `${JAEGER}/api/traces?service=${SERVICE}&limit=20`,
    ).catch(() => null);
    if (res?.ok) {
      const json = await res.json();
      const traces = json.data ?? [];
      if (traces.length > 0) {
        const spans = traces.flatMap((t) => t.spans ?? []);
        const names = [...new Set(spans.map((s) => s.operationName))];
        console.log(`found ${traces.length} trace(s), ${spans.length} span(s)`);
        console.log("operations:", names.slice(0, 12).join(", "));
        return true;
      }
    }
    console.log(`  no trace yet (attempt ${attempt}/15), waiting…`);
    await generateTraffic();
    await sleep(3000);
  }
  return false;
}

await generateTraffic();
const ok = await findTrace();
if (!ok) {
  console.error(
    "FAIL: no trace for the service in Jaeger. Is the collector up and " +
      "OTEL_EXPORTER_OTLP_ENDPOINT set when starting the app?",
  );
  process.exit(1);
}
console.log("PASS: request trace is visible in Jaeger.");
