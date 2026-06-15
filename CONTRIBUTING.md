# Contributing

Thanks for looking at the Support Reliability Lab. This repo doubles as a portfolio piece,
so the bar is "would a reviewer trust this in production?" — clear changes, tests, docs.

## Setup
```bash
npm install
npm run dev            # http://localhost:3000  (use a free port if 3000 is taken)
```

## Before you push
```bash
npm run lint
npm run typecheck
npm test               # unit + integration (vitest)
npm run build
npm run test:e2e       # browser e2e (needs: npx playwright install chromium)
```
The `quality` job (lint + typecheck + test + build) is a **required status check** on
`main`. PRs also run a browser `e2e` job and a k6 `performance-smoke` job.

## Adding an incident
Every incident must be deterministic, reproducible via a single toggle, observable, and
documented. A new one requires **all** of:
1. A catalog entry in [`lib/incidents.ts`](lib/incidents.ts) (the source of truth).
2. A seed tenant in [`lib/tenants.ts`](lib/tenants.ts) carrying it.
3. The fault behind the catalog — never scatter `if (broken)` checks through unrelated code.
4. A regression test that fails before the fix and passes after.
5. A playbook in `docs/incidents/<key>.md` (use the `runbook-writer` skill).

## Code rules
- TypeScript strict; no `any` without a comment explaining why.
- Host parsing lives only in `middleware.ts` / `lib/subdomain.ts`. Pages resolve tenants
  through `lib/tenants.ts` — never re-parse the host in a component.
- No dead or commented-out code.
- Keep the wrong-tenant isolation test green (`tests/middleware.integration.test.ts`).

## Commit & PR
- Branch off `main`; open a PR. Let the checks run; `quality` must pass to merge.
- Keep commits focused; describe what changed and how it was verified.

## Docs that explain the rest
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — design and request lifecycle
- [docs/observability.md](docs/observability.md) — tracing + `npm run otel:smoke`
- [docs/DEPLOY.md](docs/DEPLOY.md) — Vercel + wildcard domains
- `.claude/skills/` — the support-loop skills (incident-repro, dns-triage, trace-debug, runbook-writer)
