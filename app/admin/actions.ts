"use server";

import { revalidatePath } from "next/cache";
import { getTenant, setTenantIncident } from "@/lib/tenants";
import { publishUpdate } from "@/lib/content";
import { INCIDENTS, type IncidentKey } from "@/lib/incidents";

/**
 * Server action: set a tenant's active incident from the admin console.
 * Validates the incident key against the catalog before applying it.
 */
export async function updateIncident(formData: FormData) {
  const subdomain = String(formData.get("subdomain") ?? "");
  const incident = String(formData.get("incident") ?? "") as IncidentKey;

  if (!subdomain || !(incident in INCIDENTS)) {
    throw new Error("Invalid tenant or incident key");
  }

  await setTenantIncident(subdomain, incident);
  revalidatePath("/admin");
}

/**
 * Publish a new content revision for a tenant. A correctly-keyed tenant picks it
 * up immediately; the cache-regression tenant keeps serving the stale revision.
 */
export async function publishContent(formData: FormData) {
  const subdomain = String(formData.get("subdomain") ?? "");
  const tenant = await getTenant(subdomain);
  if (!tenant) {
    throw new Error("Unknown tenant");
  }

  publishUpdate(subdomain);
  revalidatePath("/admin");
}
