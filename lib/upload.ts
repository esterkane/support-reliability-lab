/**
 * Payload-size policy for the upload route — the lab analog of the platform's
 * request-body limit. Kept as a pure function so the 413 boundary is unit-tested
 * without standing up the route.
 *
 * The real Vercel limit is larger; the lab uses a small, explicit threshold so a
 * 413 is easy to reproduce with a tiny request.
 */

/** Maximum accepted request body size, in bytes (100 KB). */
export const PAYLOAD_LIMIT_BYTES = 100_000;

export interface PayloadCheck {
  ok: boolean;
  status: 200 | 413;
  size: number;
  limit: number;
}

export function checkPayloadSize(
  size: number,
  limit: number = PAYLOAD_LIMIT_BYTES,
): PayloadCheck {
  const ok = size <= limit;
  return { ok, status: ok ? 200 : 413, size, limit };
}
