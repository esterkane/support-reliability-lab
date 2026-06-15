import { NextRequest, NextResponse } from "next/server";
import { parseTraceparent } from "@/lib/trace";

/**
 * Mock upstream service with injectable faults. This is the one place faults
 * live; tenant pages call it and the fault is driven by query params derived
 * from the tenant's active incident.
 *
 *   ?delayMs=8000   -> deterministic slow response (serverless-timeout repro)
 *   ?fail=500       -> upstream 5xx
 *
 * It also reports whether it received a `traceparent` (the broken-trace incident):
 * a propagated header correlates this span to the caller; a dropped one orphans it.
 *
 * Real handlers would set `maxDuration` to bound this; we keep the upstream
 * itself slow so the failure is reproducible regardless of route config.
 */
export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const delayMs = Math.min(Number(params.get("delayMs") ?? 0) || 0, 30_000);
  const fail = Number(params.get("fail") ?? 0) || 0;

  const trace = parseTraceparent(req.headers.get("traceparent"));

  if (delayMs > 0) {
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }

  if (fail >= 400) {
    return NextResponse.json(
      { error: `upstream returned ${fail}`, delayMs },
      { status: fail },
    );
  }

  return NextResponse.json({
    ok: true,
    delayMs,
    traced: trace != null,
    traceId: trace?.traceId ?? null,
    servedAt: new Date().toISOString(),
    message: "mock upstream payload",
  });
}
