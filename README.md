# Support Reliability Lab

A multi-tenant **Next.js** application on Vercel, reframed as a support engineer's
**incident lab**. One deployment serves many tenants via host-based routing; an admin
console toggles deterministic, reproducible, observable, documented incidents — so you
can demonstrate the full support loop: reproduce → observe → root-cause → fix →
regression test → runbook.

Built as a portfolio project for a **Vercel Senior Customer Support Engineer** role.
See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the design. (The underlying
strategy notes are kept locally and are not part of this repo.)

## Why this is relevant to the role
It exercises the exact terrain of Vercel support tickets — host routing, custom domains
and wildcard DNS, serverless timeouts, cache behavior, and trace-based debugging — and
pairs each failure with a customer-facing runbook. It demonstrates building internal
tooling/scripts and writing durable docs, the two things the role calls out most.

## Quick start
```bash
npm install
npm run dev
# open http://localhost:3000  (tenant list)
#      http://slow-api.localhost:3000  (a wired incident: 504)
#      http://localhost:3000/admin     (toggle incidents)
```
Chrome/Firefox resolve `*.localhost` automatically. Otherwise use a Host header:
```bash
curl -i -H "Host: slow-api.localhost:3000" http://127.0.0.1:3000/
```

### Deployed on `*.vercel.app`?
Tenant **subdomain** routing needs a wildcard custom domain. On the default Vercel URL,
reach tenants by **path** instead: `…vercel.app/s/slow-api`, `/s/stale-cache`,
`/s/big-upload`, `/s/missing-trace`. The landing page, `/admin`, and the APIs work
normally. Set `ROOT_DOMAIN` to a wildcard domain you own to enable real subdomain
routing — see [docs/DEPLOY.md](docs/DEPLOY.md).

## How it works
| Piece | File |
|---|---|
| Host → tenant routing | [`middleware.ts`](middleware.ts), [`lib/subdomain.ts`](lib/subdomain.ts) |
| Tenant + incident store (seeded, in-memory) | [`lib/tenants.ts`](lib/tenants.ts) |
| Incident catalog (source of truth) | [`lib/incidents.ts`](lib/incidents.ts) |
| Fault injection | [`app/api/upstream/route.ts`](app/api/upstream/route.ts) |
| Tenant page (wires serverless-timeout) | [`app/s/[subdomain]/page.tsx`](app/s/[subdomain]/page.tsx) |
| Incident console | [`app/admin/page.tsx`](app/admin/page.tsx) |
| Observability | [`instrumentation.ts`](instrumentation.ts) + Speed Insights |

## Incident scenarios
Toggle any incident in `/admin`. Four are fully wired — `serverless-timeout` (504),
`cache-regression` (stale cache after publish), `payload-too-large` (413), and
`broken-trace` (orphaned downstream spans) — each with a regression test and a playbook.
The rest have catalog entries and evidence paths. See
[`docs/incidents/`](docs/incidents/) and the per-incident table in the admin console.

## Observability & evidence
`@vercel/otel` registers tracing (infrastructure / fetch / framework spans);
`@vercel/speed-insights` reports Core Web Vitals. For local traces, bring up the bundled
OpenTelemetry stack and point the app at it:
```bash
docker compose -f infra/otel/docker-compose.yml up -d
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318 npm run dev
# Jaeger http://localhost:16686 · Zipkin http://localhost:9411 · Prometheus http://localhost:9090
```
See [docs/observability.md](docs/observability.md) for the full walkthrough; the
`trace-debug` skill documents the symptom → first-signal mapping.

## DNS & domain troubleshooting
`bash scripts/dns-check.sh <domain>` runs the `dig`/`openssl` checks Vercel's domain
docs recommend; `scripts/add-domain.ts` onboards a domain via `@vercel/sdk`. The
`dns-triage` skill classifies failures (invalid config, pending TXT, wildcard SSL).

## CI/CD & release safety
[`.github/workflows/ci.yml`](.github/workflows/ci.yml) runs lint, typecheck, test,
build, and a k6 smoke test on PRs. Gate production promotion on these via Vercel
Deployment Checks; every incident links to a preview URL.

## Performance testing
[`perf/smoke.js`](perf/smoke.js) encodes the support SLOs (healthy-tenant p95 latency,
zero 5xx under light load). Pair k6 numbers with Speed Insights and `x-vercel-cache`.

## Claude Code skills
This repo ships custom skills under [`.claude/skills/`](.claude/skills/) that encode the
support loop: `incident-repro`, `trace-debug`, `dns-triage`, `runbook-writer`.

## Commands
| Task | Command |
|---|---|
| Dev | `npm run dev` |
| Build | `npm run build` |
| Type-check | `npm run typecheck` |
| Lint | `npm run lint` |
| Unit tests | `npm test` |

## Open limitations
- Tenant store is in-memory (documented swap point for Redis/Edge Config).
- External APM (Sentry/Datadog) and log drains are documented, not wired.
- Some Vercel features are plan-gated (multi-tenant preview URLs, drains, adjustable
  memory) — noted in `docs/ARCHITECTURE.md` and the local strategy notes.

## Tip: reduce permission prompts
`.claude/settings.json` ships protective `deny` rules only. To let Claude run the dev
commands without prompting, add an `allow` list (e.g. `Bash(npm run:*)`, `Bash(dig:*)`)
yourself — or run `/fewer-permission-prompts`.
