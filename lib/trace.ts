/**
 * Minimal W3C `traceparent` handling for the broken-trace incident. The point is
 * the propagation decision: forward the header to a downstream call and its span
 * correlates to this request; drop it and the downstream span is orphaned. That
 * dropped-header case is the bug the incident reproduces.
 *
 * Format: 00-<32 hex trace-id>-<16 hex span-id>-<2 hex flags>
 */

const TRACEPARENT_RE = /^00-([0-9a-f]{32})-([0-9a-f]{16})-[0-9a-f]{2}$/;

export interface TraceContext {
  traceId: string;
  spanId: string;
}

function randomHex(bytes: number): string {
  const arr = new Uint8Array(bytes);
  crypto.getRandomValues(arr);
  return Array.from(arr, (b) => b.toString(16).padStart(2, "0")).join("");
}

/** Generate a fresh, valid traceparent (16-byte trace id, 8-byte span id, sampled). */
export function generateTraceparent(): string {
  return `00-${randomHex(16)}-${randomHex(8)}-01`;
}

/** Parse a traceparent header, or null if missing/malformed. */
export function parseTraceparent(
  value: string | null | undefined,
): TraceContext | null {
  if (!value) return null;
  const match = TRACEPARENT_RE.exec(value.trim().toLowerCase());
  if (!match) return null;
  return { traceId: match[1], spanId: match[2] };
}

/**
 * Headers to forward to a downstream call. When `propagate` is false (the
 * broken-trace bug), the traceparent is dropped and the downstream span cannot
 * be correlated back to this request.
 */
export function buildPropagationHeaders(
  traceparent: string,
  { propagate }: { propagate: boolean },
): Record<string, string> {
  return propagate ? { traceparent } : {};
}
