/**
 * Incident catalog — the single source of truth for what can break in the lab.
 * Each incident is deterministic, reproducible via one tenant toggle, observable,
 * and documented under docs/incidents/<key>.md.
 *
 * Adding an incident: add an entry here, attach it to a seed tenant in
 * lib/tenants.ts, write the playbook, and add a regression test.
 */

export type IncidentKey =
  | "none"
  | "serverless-timeout"
  | "invalid-domain"
  | "wrong-tenant"
  | "payload-too-large"
  | "cache-regression"
  | "broken-trace";

export type IncidentStatus = "implemented" | "documented" | "guarded";

export interface Incident {
  key: IncidentKey;
  title: string;
  /** One-line customer-facing symptom. */
  symptom: string;
  /** Where a reviewer should look first (the best signal). */
  evidencePath: string;
  status: IncidentStatus;
  /** Path to the full playbook, relative to repo root. */
  doc?: string;
}

export const INCIDENTS: Record<IncidentKey, Incident> = {
  none: {
    key: "none",
    title: "Healthy",
    symptom: "Renders fast, traces are clean.",
    evidencePath: "Control tenant — nothing to debug.",
    status: "implemented",
  },
  "serverless-timeout": {
    key: "serverless-timeout",
    title: "Serverless timeout on slow upstream",
    symptom: "Customer sees a 504 or a stalled response.",
    evidencePath:
      "Trace timeline → longest fetch span; route maxDuration; upstream mock logs.",
    status: "implemented",
    doc: "docs/incidents/serverless-timeout.md",
  },
  "invalid-domain": {
    key: "invalid-domain",
    title: "Invalid custom domain configuration",
    symptom: "Tenant domain shows invalid configuration or missing SSL.",
    evidencePath: "dig output, _vercel TXT state, nameserver + cert inspection.",
    status: "documented",
  },
  "wrong-tenant": {
    key: "wrong-tenant",
    title: "Wrong tenant resolved from middleware",
    symptom: "A request to one host renders another tenant's content.",
    evidencePath: "Middleware routing span, Host header inspection, request ID.",
    status: "guarded",
  },
  "payload-too-large": {
    key: "payload-too-large",
    title: "413 payload too large",
    symptom: "Upload or API request fails above a size threshold.",
    evidencePath: "Runtime logs, captured payload size, Blob alternative path.",
    status: "implemented",
    doc: "docs/incidents/payload-too-large.md",
  },
  "cache-regression": {
    key: "cache-regression",
    title: "Stale cache / cache-miss regression",
    symptom: "Content stays stale or TTFB regresses on one tenant.",
    evidencePath: "x-vercel-cache, runtime-log Cache filter, Speed Insights, k6.",
    status: "implemented",
    doc: "docs/incidents/cache-regression.md",
  },
  "broken-trace": {
    key: "broken-trace",
    title: "Broken trace correlation",
    symptom: "Request log exists but downstream spans are missing.",
    evidencePath: "traceparent propagation, instrumentation.ts, drain output.",
    status: "documented",
  },
};

export function getIncident(key: IncidentKey): Incident {
  return INCIDENTS[key];
}

export function listIncidents(): Incident[] {
  return Object.values(INCIDENTS);
}
