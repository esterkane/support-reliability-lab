# What to collect before opening a support ticket

Having these ready resolves most tickets in one round trip instead of three.

## Always include
- **URL** that failed (the full address, including the subdomain).
- **Timestamp + timezone** of when you saw it.
- **Request / trace ID** — visible in runtime logs and response headers.
- **Deployment URL** (the `*.vercel.app` URL of the affected deployment).
- **What you expected vs. what happened**, in one or two sentences.

## Grab the response headers
```bash
curl -i https://<your-domain>/<path-that-failed>
```
Copy the whole header block. The useful ones:
- `x-vercel-id` — request/trace correlation.
- `x-vercel-cache` — `HIT` / `MISS` / `STALE` (essential for "stale content" reports).
- HTTP status line (e.g. `HTTP/2 504`).

## For domain / SSL problems
```bash
dig ns <domain>
dig a <domain>
dig cname www.<domain>
dig txt _vercel.<domain>
```
Paste the output. See `docs/` and the `dns-triage` workflow for what each one tells us.

## For slow / timeout problems
- Note whether it's consistent or intermittent.
- Include the trace ID so we can find the slow span directly.

## For "wrong content" problems
- The exact subdomain you requested and the content you got instead.
- This is usually a routing issue; the Host header + trace pin it down.

> The fastest tickets are the ones where the evidence is already attached. If you're
> unsure what to grab, send the `curl -i` output above and the timestamp.
