import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { getTenant } from "@/lib/tenants";
import { getIncident } from "@/lib/incidents";
import { getCurrentContent } from "@/lib/content";
import { getCached, type CacheStatus } from "@/lib/cache";

// On Vercel this bounds the function; locally we enforce the same tolerance with
// an AbortSignal so the serverless-timeout incident is reproducible everywhere.
export const maxDuration = 10;

// Always render per-request so cache-status and timeout behavior are live.
export const dynamic = "force-dynamic";

/** The wall-clock tolerance a tenant request is allowed before we treat it as a timeout. */
const TOLERANCE_MS = 2500;

interface UpstreamResult {
  ok: boolean;
  status: number;
  elapsedMs: number;
  body?: unknown;
  timedOut?: boolean;
}

async function callUpstream(
  origin: string,
  { delayMs = 0, fail = 0 }: { delayMs?: number; fail?: number },
): Promise<UpstreamResult> {
  const url = `${origin}/api/upstream?delayMs=${delayMs}&fail=${fail}`;
  const startedAt = performance.now();
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(TOLERANCE_MS),
      cache: "no-store",
    });
    return {
      ok: res.ok,
      status: res.status,
      elapsedMs: Math.round(performance.now() - startedAt),
      body: await res.json().catch(() => null),
    };
  } catch (err) {
    const elapsedMs = Math.round(performance.now() - startedAt);
    const timedOut = err instanceof Error && err.name === "TimeoutError";
    return { ok: false, status: timedOut ? 504 : 502, elapsedMs, timedOut };
  }
}

function TimeoutPanel({
  symptom,
  elapsedMs,
  timedOut,
}: {
  symptom: string;
  elapsedMs: number;
  timedOut: boolean;
}) {
  return (
    <div className="card">
      <h2 style={{ marginTop: 0, color: "var(--err)" }}>
        {timedOut ? "504 Gateway Timeout" : "Upstream error"}
      </h2>
      <p>{symptom}</p>
      <p className="muted">
        Upstream did not respond within the {TOLERANCE_MS} ms route tolerance
        (aborted after {elapsedMs} ms).
      </p>
    </div>
  );
}

/**
 * Content + cache view. The "broken" tenant uses a cache key that omits the
 * content version, so after a publish it keeps serving the old revision (STALE).
 * A correctly-keyed tenant busts the cache on every publish.
 */
function ContentPanel({ subdomain, buggy }: { subdomain: string; buggy: boolean }) {
  const current = getCurrentContent(subdomain);
  const cacheKey = buggy ? subdomain : `${subdomain}:v${current.version}`;
  const { value: served, status } = getCached(cacheKey, () =>
    getCurrentContent(subdomain),
  );

  const isStale = served.version !== current.version;
  const cacheStatus: CacheStatus | "STALE" = isStale ? "STALE" : status;
  const badge = cacheStatus === "STALE" ? "err" : "ok";

  return (
    <div className="card">
      <div className="row">
        <h2 style={{ marginTop: 0 }}>{served.headline}</h2>
        <span className={`badge ${badge}`}>cache: {cacheStatus}</span>
      </div>
      <p className="muted">
        Served revision v{served.version}
        {isStale && (
          <>
            {" "}
            — but the current published revision is{" "}
            <strong>v{current.version}</strong>. The cache key omits the version,
            so the update never reached this tenant.
          </>
        )}
      </p>
      <p className="muted" style={{ fontSize: "0.85rem" }}>
        Publish a new revision from <code>/admin</code> and reload to see the
        difference between a correctly-keyed tenant and this one.
      </p>
    </div>
  );
}

export default async function TenantPage({
  params,
}: {
  params: Promise<{ subdomain: string }>;
}) {
  const { subdomain } = await params;
  const tenant = await getTenant(subdomain);
  if (!tenant) notFound();

  const incident = getIncident(tenant.incident);

  // --- serverless-timeout: drive the upstream past the route tolerance ---
  let timeout: UpstreamResult | null = null;
  if (tenant.incident === "serverless-timeout") {
    const h = await headers();
    const host = h.get("host") ?? "localhost:3000";
    const proto = host.includes("localhost") ? "http" : "https";
    timeout = await callUpstream(`${proto}://${host}`, { delayMs: 8000 });
  }

  const failed = timeout != null && !timeout.ok;

  return (
    <main>
      <div className="row">
        <h1>{tenant.name}</h1>
        <span className={`badge ${failed ? "err" : "ok"}`}>
          {failed ? `HTTP ${timeout!.status}` : "HTTP 200"}
        </span>
      </div>
      <p className="muted">
        {tenant.subdomain}.localhost · plan: {tenant.plan} · incident:{" "}
        <strong>{incident.title}</strong>
      </p>

      {timeout ? (
        <TimeoutPanel
          symptom={incident.symptom}
          elapsedMs={timeout.elapsedMs}
          timedOut={Boolean(timeout.timedOut)}
        />
      ) : (
        <ContentPanel
          subdomain={tenant.subdomain}
          buggy={tenant.incident === "cache-regression"}
        />
      )}

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Where to look first</h3>
        <p className="muted">{incident.evidencePath}</p>
        {incident.doc && (
          <p className="muted">
            Playbook: <code>{incident.doc}</code>
          </p>
        )}
      </div>
    </main>
  );
}
