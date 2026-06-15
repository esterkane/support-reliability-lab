---
name: dns-triage
description: Diagnose Vercel custom-domain and DNS problems — invalid configuration, missing/pending TXT verification, wildcard subdomains, nameservers, SSL/TLS issuance, and propagation. Use when a tenant domain shows "invalid configuration", SSL is missing, a wildcard domain won't issue a cert, or the user asks to debug a domain/DNS/CNAME/nameserver/SSL ticket.
---

# DNS & custom-domain triage

The exact terrain of Vercel domain tickets: verify the current DNS state with commands,
locate the misconfiguration, prescribe the correct records, and confirm SSL issues after
propagation.

## 1. Establish ground truth (don't trust the dashboard alone)

```bash
bash scripts/dns-check.sh <domain>      # wrapper around the dig calls below
dig ns   <apex-domain>                  # are Vercel nameservers in use?
dig a    <apex-domain>                  # apex A record
dig cname www.<apex-domain>             # subdomain CNAME
dig txt  _vercel.<apex-domain>          # ownership / verification TXT
```

TLS inspection once a record exists:
```bash
openssl s_client -servername <domain> -connect <domain>:443 </dev/null \
  | openssl x509 -noout -issuer -subject -dates
```

## 2. Classify the failure

| Symptom | Likely cause | Fix |
|---|---|---|
| "Invalid Configuration" | Apex `A` / `CNAME` points elsewhere or is stale | Point records at Vercel's documented targets; wait for propagation |
| Verification pending | Domain already in use on another Vercel account | Complete the `_vercel` **TXT** verification to prove ownership |
| Wildcard cert won't issue | Wildcard requires DNS-01 control | Move the apex to **Vercel nameservers** so Vercel can complete DNS-01 |
| Works then breaks | Propagation / TTL / cached negative answer | Confirm TTL, re-query authoritative NS, allow propagation window |
| Syntax-y mismatch | Trailing dot / `@` / host field error in the record `name` | Correct the record `name` field exactly |

## 3. Prescribe and verify
- State the corrected records explicitly (type, name, value).
- For wildcards (`*.example.com`), confirm nameservers are Vercel's — CNAME alone can't
  pass DNS-01 for a wildcard.
- Re-run the `dig` checks against the authoritative nameserver, then re-check SSL with
  `openssl` until issuer/subject/dates are valid.

## 4. Reproduce locally without owning the domain
Host-header routing reproduces the *app-side* behavior without DNS:
```bash
curl -i -H "Host: broken-domain.localhost:3000" http://127.0.0.1:3000/
```
Use this for the routing half; use a domain you actually control for the DNS/SSL half.

## Notes
- Sanitize any user-supplied domain before passing it to a shell command.
- Programmatic onboarding lives in `scripts/add-domain.ts` (`@vercel/sdk`); it needs
  `VERCEL_TOKEN` from env and must never log the token.
