/**
 * Tenant + incident store. In-memory and seeded so the lab runs offline with
 * zero external services. This is the documented swap point: replace the Map
 * with Redis / Upstash / Edge Config without changing callers — keep the
 * async signatures below.
 *
 * Tenants are resolved ONLY through this module. Do not parse the host or build
 * tenant lists anywhere else.
 */

import { type IncidentKey } from "./incidents";

export type Plan = "hobby" | "pro" | "enterprise";

export interface Tenant {
  subdomain: string;
  name: string;
  plan: Plan;
  /** The active incident for this tenant, or "none". */
  incident: IncidentKey;
}

const SEED: Tenant[] = [
  { subdomain: "healthy", name: "Healthy Co", plan: "pro", incident: "none" },
  {
    subdomain: "slow-api",
    name: "Slow API Inc",
    plan: "pro",
    incident: "serverless-timeout",
  },
  {
    subdomain: "broken-domain",
    name: "Broken Domain LLC",
    plan: "hobby",
    incident: "invalid-domain",
  },
  {
    subdomain: "stale-cache",
    name: "Stale Cache Ltd",
    plan: "enterprise",
    incident: "cache-regression",
  },
  {
    subdomain: "missing-trace",
    name: "Missing Trace GmbH",
    plan: "pro",
    incident: "broken-trace",
  },
  {
    subdomain: "big-upload",
    name: "Big Upload Co",
    plan: "hobby",
    incident: "payload-too-large",
  },
];

// Mutable in-memory store. Survives within a single server process (fine for the lab).
const store = new Map<string, Tenant>(SEED.map((t) => [t.subdomain, { ...t }]));

export async function listTenants(): Promise<Tenant[]> {
  return [...store.values()].sort((a, b) =>
    a.subdomain.localeCompare(b.subdomain),
  );
}

export async function getTenant(
  subdomain: string | null | undefined,
): Promise<Tenant | null> {
  if (!subdomain) return null;
  return store.get(subdomain) ?? null;
}

/** Toggle a tenant's active incident (used by the admin console). */
export async function setTenantIncident(
  subdomain: string,
  incident: IncidentKey,
): Promise<Tenant | null> {
  const tenant = store.get(subdomain);
  if (!tenant) return null;
  tenant.incident = incident;
  return tenant;
}
