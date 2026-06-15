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

## Plan notes
Multi-tenant **preview** URLs are Enterprise-only; ordinary preview deployments are broadly
available. Log Drains are Pro/Enterprise. Adjustable function memory is dashboard-configurable
on Pro/Enterprise; Hobby uses defaults. See `deep-research-report.md` for the full list.
