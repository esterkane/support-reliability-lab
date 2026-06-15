# Support Reliability Lab — Claude Code Instructions

## Project
A multi-tenant Next.js app on Vercel, reframed as a support engineer's **incident lab**.
One deployment serves many tenants via host-based routing; an admin console toggles
deterministic, reproducible, observable, documented incidents. Built as a portfolio
project for a Vercel Senior Customer Support Engineer role. See `docs/ARCHITECTURE.md`.

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
| Unit tests | `npm test` |
| DNS triage | `bash scripts/dns-check.sh <domain>` |

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
