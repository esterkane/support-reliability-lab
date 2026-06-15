# Deploying to Vercel

The project is a standard Next.js App Router app — no `vercel.json` required.

## 1. Push to GitHub
```bash
gh repo create support-reliability-lab --public --source=. --remote=origin --push
# or, with an existing remote:
git remote add origin git@github.com:<you>/support-reliability-lab.git
git push -u origin main
```

## 2. Connect Vercel
```bash
npm i -g vercel        # if not installed
vercel login
vercel link            # link this dir to a Vercel project
vercel env pull        # pull project env vars into .env.local
```
Pushing to GitHub after linking gives you **automatic preview deployments** for every
non-production branch and PR, and a production deploy on `main`.

## 3. Gate production with Deployment Checks
Wire the `quality` (and `performance-smoke`) jobs in
[`.github/workflows/ci.yml`](../.github/workflows/ci.yml) as required checks so a failing
lint/typecheck/test/build/k6 run blocks production promotion. Each incident can then link
to a preview URL plus the passing/failing workflow.

## 4. Multi-tenant domains
- Add a wildcard domain (`*.your-domain.com`) in the Vercel dashboard; wildcards require
  the apex to use **Vercel nameservers** so Vercel can complete DNS-01 for the cert.
- Set `ROOT_DOMAIN` (env) to your production domain so `lib/subdomain.ts` resolves tenants.
- Onboard individual custom domains programmatically with
  [`scripts/add-domain.ts`](../scripts/add-domain.ts) (`@vercel/sdk`, needs `VERCEL_TOKEN`).
- Triage domain/SSL tickets with `bash scripts/dns-check.sh <domain>` and the
  `dns-triage` skill.

## Running on the Hobby (free) plan
This project is built to run fully on **Hobby**. What that means in practice:

**Works on Hobby**
- Production + automatic preview deployments (per branch/PR).
- Custom domains, including a wildcard `*.example.com` — wildcards require the apex on
  **Vercel nameservers** so Vercel can issue the cert (a DNS requirement, not a plan gate).
- Speed Insights and Web Analytics (free tier — limited data points / retention).
- Every incident in the lab — they're self-contained app logic, no paid features.

**Limited on Hobby**
- Runtime **log retention is short**; there's no full trace/observability dashboard.
  For trace inspection use the local OTel stack (`infra/otel/`, `npm run otel:smoke`),
  not the Vercel dashboard.

**Not available on Hobby (documented, not wired)**
- **Log Drains** (Pro/Enterprise) — so external APM ingestion from Vercel is out of scope.
- **Multi-tenant preview URLs** (Enterprise).
- **Adjustable function memory** (Pro/Enterprise); Hobby uses defaults. Our routes stay
  within Hobby's function duration limit (the timeout incident aborts at ~2.5s anyway).

**Don't load-test the live Hobby deployment** — it counts against usage and Hobby is for
non-commercial use. The `performance-smoke` job runs k6 against a **local** production
build for that reason; keep it that way unless you move to Pro.
