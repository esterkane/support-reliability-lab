# Incident: Stale cache / cache-miss regression

**Tenant:** `stale-cache` · **Catalog key:** `cache-regression` · **Status:** implemented

## Symptom
The customer publishes a change but their site keeps showing the old content. Other
tenants update fine. ("I deployed/published an hour ago and it's still stale.")

## Reproduce
Deterministic:
1. Open `http://stale-cache.localhost:3000` — note the served revision (e.g. v1) and
   the `cache: HIT/MISS` badge.
2. In `/admin`, click **Publish update** on `stale-cache` (version bumps to v2).
3. Reload `stale-cache` → it still serves **v1** with a `cache: STALE` badge and a note
   that the current revision is v2.
4. Compare with a correctly-keyed tenant (set `healthy` and publish): it serves the new
   revision immediately.

Mechanics: the broken tenant's cache key is the subdomain alone, so it never varies when
content changes. The fix is to include the content version in the key
(`<subdomain>:v<version>`), which the other tenants do.

```bash
curl -i -H "Host: stale-cache.localhost:3000" http://127.0.0.1:3000/   # body shows cache: STALE
```

## Where to look first
**Cache status vs. render work.** On Vercel: filter runtime logs by **Cache** and compare
`HIT`/`MISS`/`STALE`, and confirm in traces whether render work actually ran. A `HIT` that
returns content older than the latest publish is the tell — the cache key is missing a
dimension. In the lab, the `cache: STALE` badge and the "served vN, current vM" line say
the same thing.

## Root cause
The cache key omits a dimension that the content depends on (here, the content version),
so a publish never invalidates the entry — the platform served exactly what it was asked
to cache.

## Fix / mitigation
- **Include every varying dimension in the cache key** (version/tenant/locale as
  applicable). See `lib/cache.ts` + the keying in `app/s/[subdomain]/page.tsx`.
- Or revalidate on publish (ISR / tag-based revalidation) so the entry is purged.
- Quantify user-facing impact before/after with Speed Insights and a k6 run.

## Verify
- After the fix, publishing bumps the served revision on the next request (`MISS` then
  fresh `HIT`).
- `lib/cache.test.ts` proves the buggy key serves stale and the versioned key busts.

## Prevent
Keep the cache key construction in one place and unit-test it. Treat "what can change the
output?" as the checklist for what must be in the key.
