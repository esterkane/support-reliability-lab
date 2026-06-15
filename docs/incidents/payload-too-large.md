# Incident: 413 payload too large

**Tenant:** `big-upload` · **Catalog key:** `payload-too-large` · **Status:** implemented

## Symptom
A customer's upload or API request fails once the body crosses a size threshold. Small
requests succeed; large ones get a `413`.

## Reproduce
Deterministic at a fixed threshold (`PAYLOAD_LIMIT_BYTES`, 100 KB in the lab):
```bash
# Under the limit -> 200
head -c 50000 /dev/zero | curl -s -o /dev/null -w "%{http_code}\n" \
  -X POST --data-binary @- http://127.0.0.1:3000/api/upload

# Over the limit -> 413
head -c 200000 /dev/zero | curl -s -o /dev/null -w "%{http_code}\n" \
  -X POST --data-binary @- http://127.0.0.1:3000/api/upload
```
Or open `http://big-upload.localhost:3000` and use the **Reproduce the upload** buttons.

## Where to look first
**Runtime logs + the captured payload size.** The 413 response body reports the `size`
and the `limit`, so the gap is explicit. On Vercel, confirm the request never reached
your handler logic — the platform/body limit rejected it first.

## Root cause
The request body exceeds the accepted limit. This is expected platform behavior, not a
bug: very large bodies are not meant to flow through a serverless request body.

## Fix / mitigation
Two remediations, by traffic type:
1. **Ordinary API traffic** — reduce body size: paginate, compress, or send a reference
   instead of inlining data.
2. **Large file uploads** — upload **directly from the client to Blob storage** so the
   file bypasses the serverless request-body limit entirely, then pass the resulting URL
   to your API. This is the "explain the correct mental model, then redirect to the right
   architecture" answer.

## Verify
- A body at/under the limit returns 200; over the limit returns 413 with `size`/`limit`.
- `lib/upload.test.ts` covers the boundary (under, exactly-at, over, custom limit).

## Prevent
Keep the threshold in one place (`lib/upload.ts`) and unit-test the boundary. Document the
limit so customers know it before they design an upload flow.
