# Postmortem — stale content on `stale-cache` after publish

**Date:** 2026-06-15 · **Severity:** SEV-3 (single tenant, no data loss) · **Status:** resolved
**Authors:** Support Engineering · **Blameless:** yes — focus on the system, not the person.

## Summary
For ~40 minutes, the `stale-cache` tenant kept serving an old content revision after the
customer published an update. Other tenants were unaffected. Root cause was a cache key
that omitted the content version, so a publish never invalidated the entry.

## Impact
- One tenant (`stale-cache`) served revision v1 while v2 was the published version.
- No errors, no data loss; the stale content was internally consistent, which delayed
  detection because nothing alarmed.

## Timeline (UTC)
| Time | Event |
|---|---|
| 12:00 | Customer publishes revision v2 via the admin console. |
| 12:05 | Customer reports the site "still shows the old version." |
| 12:12 | Support reproduces on `/s/stale-cache`: page shows `cache: STALE`, served v1, current v2. |
| 12:20 | Root cause identified: cache key is the subdomain only — no version dimension. |
| 12:35 | Fix deployed: version added to the cache key (`<subdomain>:v<version>`). |
| 12:40 | Verified: publish now bumps the served revision on the next request. Resolved. |

## Root cause
The read-through cache keyed entries on the tenant subdomain alone. Because the key did
not vary with the content version, publishing a new revision produced a cache **HIT** on
the old entry forever. The platform served exactly what it was told to cache — the bug was
the key, not the cache.

## Detection
Customer-reported. There was no signal that "served version < published version," so the
stale state was invisible to monitoring. This is the most important gap.

## What went well
- Reproduction was deterministic and fast once the tenant was known.
- The `cache: STALE` indicator (served vN vs current vM) made the diagnosis unambiguous.

## What went wrong / where we got lucky
- The cache key bug shipped without a test exercising "publish → next read is fresh."
- We were lucky the stale content was harmless; a stale price or permission could have
  been a SEV-1.

## Action items
| # | Action | Owner | Status |
|---|---|---|---|
| 1 | Add the content version to the cache key | Eng | ✅ done (`lib/cache.ts` usage) |
| 2 | Regression test: buggy key serves stale, versioned key busts | Eng | ✅ done (`lib/cache.test.ts`) |
| 3 | Emit a `served_version` vs `published_version` log field for alerting | Eng | ☐ open |
| 4 | Add "what can change the output?" to the cache-key review checklist | Support | ☐ open |

## Lessons
Treat the cache key as a contract: every dimension that can change the output must be in
the key. And add the signal that would have caught this (served-vs-published) so the next
occurrence is detected by us, not the customer. See
[docs/incidents/cache-regression.md](../incidents/cache-regression.md).
