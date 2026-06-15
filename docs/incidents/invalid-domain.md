# Incident: Invalid custom domain configuration

**Tenant:** `broken-domain` · **Catalog key:** `invalid-domain` · **Status:** implemented

## Symptom
A tenant's custom domain shows "Invalid Configuration" or never gets an SSL certificate.
The site is unreachable on the custom domain even though the deployment is healthy.

## Reproduce
The lab models a deterministic DNS snapshot for `broken-domain`: a **wildcard** domain
(`*.broken-domain.app`) whose apex is **not** on Vercel nameservers. Open
`http://broken-domain.localhost:3000` (or `…/s/broken-domain`) — the Domain panel shows
state **wildcard needs nameservers** with the root cause and fix.

For the live half against a domain you actually own:
```bash
bash scripts/dns-check.sh your-domain.com
```

## Where to look first
**Nameservers, then records, then the cert** — in that order. The diagnoser
(`lib/domain.ts`) checks the most blocking issue first so the verdict names the real root
cause instead of a downstream symptom (e.g. "SSL pending" when the true problem is the
nameservers).

Classification (mirrors the `dns-triage` skill):
| State | Root cause | Fix |
|---|---|---|
| `wildcard-needs-nameservers` | Wildcard cert needs DNS-01; apex not on Vercel NS | Move apex to Vercel nameservers |
| `verification-pending` | Domain in use elsewhere; ownership unproven | Complete the `_vercel` TXT verification |
| `invalid-configuration` | Apex A / www CNAME don't point at Vercel | Point records at Vercel; await propagation |
| `ssl-pending` | Records correct, cert not issued yet | Wait for propagation/issuance; re-check with `openssl` |

## Root cause (this fixture)
A wildcard domain cannot complete DNS-01 validation unless Vercel controls DNS, so the
certificate never issues while the apex is on third-party nameservers.

## Fix / mitigation
Move the apex domain to **Vercel nameservers** so Vercel can answer the DNS-01 challenge
and issue the wildcard certificate. Then re-verify:
```bash
dig ns broken-domain.app
openssl s_client -servername x.broken-domain.app -connect x.broken-domain.app:443 </dev/null \
  | openssl x509 -noout -issuer -dates
```

## Verify
- The Domain panel reports state `valid` once nameservers and SSL are correct.
- `lib/domain.test.ts` covers each classification branch and the precedence order.

## Prevent
Keep the diagnosis logic in one place (`lib/domain.ts`) and unit-test the precedence so a
new check can't mask an existing root cause. Document the wildcard-nameserver requirement
prominently — it's the most common wildcard-SSL surprise.
