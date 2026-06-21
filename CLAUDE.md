# Support Reliability Lab — Claude Code Instructions

## Project
A multi-tenant Next.js app on Vercel, reframed as a support engineer's **incident lab**.
One deployment serves many tenants via host-based routing; an admin console toggles
deterministic, reproducible, observable, documented incidents. Built as a portfolio
project for a Vercel Senior Customer Support Engineer role. See `docs/ARCHITECTURE.md`.

## Architecture in 5 lines
1. One Next.js 15 (App Router) deployment serves many tenants; `middleware.ts` reads the
   `Host` header, parses the subdomain (`lib/subdomain.ts`), and rewrites to `/s/[subdomain]`.
2. Tenants and their active incidents live in an in-memory seeded store (`lib/tenants.ts`),
   driven by the incident catalog source of truth (`lib/incidents.ts`).
3. `/admin` toggles incidents; faults inject on the tenant path / mock upstream
   (`app/api/upstream/route.ts`) — deterministically, behind the catalog, never via scattered checks.
4. Observability is `@vercel/otel` (`instrumentation.ts`) + `@vercel/speed-insights`, with an
   optional local OTel stack (`infra/otel`) exporting to Jaeger/Zipkin/Prometheus.
5. No DB or external service is required to run; only Vercel `scripts/*` (domains/DNS) read
   secrets, and only from env.

## Stack
| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router, RSC) + React 19 |
| Language | TypeScript (strict) |
| Routing | `middleware.ts` host-based tenant rewrite |
| Tenant store | In-memory module (`lib/tenants.ts`), swappable for Redis/Edge Config |
| Observability | `@vercel/otel` (`instrumentation.ts`), `@vercel/speed-insights` |
| Tests | Vitest (unit), Playwright (e2e, future), k6 (perf smoke) |
| Domains/DNS | `scripts/dns-check.sh`, `@vercel/sdk` (`scripts/add-domain.ts`) |
| CI/CD | GitHub Actions + Vercel preview deployments + Deployment Checks |

## Directory layout
```
support-reliability-lab/
├── app/
│   ├── layout.tsx              # root layout + Speed Insights
│   ├── page.tsx                # landing (root domain)
│   ├── admin/                  # incident console (server actions)
│   ├── s/[subdomain]/          # tenant pages (rewritten target)
│   └── api/upstream/           # mock upstream with injectable faults
├── lib/
│   ├── tenants.ts              # tenant + incident store (seed data)
│   ├── incidents.ts            # incident catalog (source of truth)
│   └── subdomain.ts            # host → subdomain parser (+ tests)
├── middleware.ts               # host-based routing
├── instrumentation.ts          # @vercel/otel registration
├── scripts/                    # dns-check, add-domain
├── perf/                       # k6 smoke tests
└── docs/                       # architecture, incidents, troubleshooting
```

## Commands
| Task | Command |
|---|---|
| Dev server | `npm run dev` |
| Build | `npm run build` |
| Type-check | `npm run typecheck` |
| Lint | `npm run lint` |
| Unit tests | `npm test` (Vitest, 7 unit/integration test files) |
| Browser e2e | `npm run test:e2e` (Playwright; `npx playwright install chromium` once) |
| OTel smoke | `npm run otel:smoke` (asserts a request produces a Jaeger trace) |
| DNS triage | `bash scripts/dns-check.sh <domain>` |

**Quality gate (CI `.github/workflows/ci.yml`, job `quality`, the required check):**
runs `npm ci` → `npm run lint` → `npm run typecheck` → `npm test` → `npm run build` on Node 22.
The `e2e` and `performance-smoke` (k6) jobs run on PRs but are non-blocking. `codeql.yml`
runs CodeQL (javascript-typescript) on push/PR and weekly. There is no Python; the
type-checker is `tsc --noEmit` via `npm run typecheck`.

Local multi-tenant testing uses subdomains of `localhost`, e.g.
`http://slow-api.localhost:3000`. (Chrome/Firefox resolve `*.localhost` automatically;
otherwise pass a Host header: `curl -H "Host: slow-api.localhost:3000" http://127.0.0.1:3000/`.)

## Code rules
- TypeScript strict; no `any` without a comment explaining why.
- Tenant pages must resolve tenants through `lib/tenants.ts` — never parse the host
  ad hoc in a component. Host parsing lives only in `middleware.ts` / `lib/subdomain.ts`.
- Every incident must be: deterministic, reproducible via a single toggle, observable
  (logs/traces), and documented under `docs/incidents/<key>.md`.
- Fault injection lives behind the incident catalog. Do not scatter `if (broken)` checks
  through unrelated code.
- A new incident requires: catalog entry in `lib/incidents.ts`, a seed tenant, a doc
  playbook, and a regression test proving the fix.
- Never let one tenant render another tenant's data. The `subdomain` guard is covered by
  a test; keep it green.
- No dead code; no commented-out code.

## Security rules
- No secrets in the repo. Use `.env.local` (gitignored); document vars in `.env.example`.
- `VERCEL_TOKEN` / `VERCEL_TEAM_ID` are only read by `scripts/*` and must come from env.
- Sanitize any user-supplied value before it reaches a domain/DNS command or a fetch URL.

## Implementation prompt format
Every prompt that changes code **must end** with:
```
Files changed:
- path/to/file  (added|modified|deleted)

Commands run:
- <exact command and exit code>

Verification status:
- typecheck: PASS / FAIL
- test: PASS / FAIL (N passed, N failed)
- build: PASS / FAIL
- Manual smoke test: <description or N/A>
```
Do not mark a task complete until verification status is filled in.

## Conventions
- Root domain in dev is `localhost:3000`; configured via `ROOT_DOMAIN` env (default `localhost:3000`).
- The default seed tenants are defined in `lib/tenants.ts`. Do not hardcode tenant lists elsewhere.
- LLM/agent work, if any, goes through documented APIs; never embed provider keys.

## Invariants I must never break
1. **Determinism of the incident pipeline.** Every incident is deterministic, reproducible via a
   single `/admin` toggle, and injected only behind the incident catalog (`lib/incidents.ts`) on
   the tenant request path / mock upstream — never scattered `if (broken)` checks. (This repo's
   analog of "planner determinism": the catalog *is* the planner.)
2. **The quality gate stays green.** `npm run lint`, `npm run typecheck` (`tsc --noEmit`),
   `npm test`, and `npm run build` must all pass — that is exactly the CI `quality` job.
   TypeScript stays strict; no `any` without an explanatory comment.
3. **Provenance / evidence on every incident.** Each incident carries its evidence trail: a catalog
   entry, a seed tenant, runtime logs/traces via `@vercel/otel`, and a documented playbook under
   `docs/incidents/<key>.md` with a regression test proving the fix. (This repo's analog of
   "provenance on every chunk" — there are no RAG chunks; the unit is an incident + its runbook.)
4. **No secrets in git.** Secrets live in `.env.local` (gitignored); document vars in `.env.example`.
   `VERCEL_TOKEN` / `VERCEL_TEAM_ID` are read only by `scripts/*`, only from env. `.claude/settings.json`
   denies reading `.env*`.
5. **Tenant isolation.** One tenant must never render another tenant's data; host parsing lives only
   in `middleware.ts` / `lib/subdomain.ts`. The `wrong-tenant` guard is covered by a test — keep it green.

## Definition of done
- [ ] `npm test` passes (Vitest).
- [ ] `npm run typecheck` passes (`tsc --noEmit`).
- [ ] `npm run lint` and `npm run build` pass (completes the CI `quality` gate; CodeQL clean).
- [ ] If an incident changed/added: catalog entry, seed tenant, traces/logs, `docs/incidents/<key>.md`
      playbook, and a regression test are all present (provenance/evidence intact).
- [ ] Tenant isolation preserved; `wrong-tenant` guard test still green.
- [ ] README / relevant `docs/` updated.
- [ ] No secrets added; `.env.example` updated if a new env var was introduced.
