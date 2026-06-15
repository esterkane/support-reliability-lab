/**
 * Host -> subdomain parsing. This is the ONLY place the raw Host header is
 * interpreted. Components and pages must resolve tenants via lib/tenants.ts,
 * never by re-parsing the host. Keeping this isolated is what lets the
 * "wrong-tenant" regression test guarantee one tenant can't render another's data.
 */

/** Root domain (no protocol). Override per-environment with ROOT_DOMAIN. */
export const ROOT_DOMAIN = process.env.ROOT_DOMAIN ?? "localhost:3000";

/** Hosts that map to the root/marketing app rather than a tenant. */
const RESERVED_SUBDOMAINS = new Set(["www", "admin", "api"]);

function stripPort(host: string): string {
  // IPv6 hosts are bracketed; we only care about hostnames here.
  const portIndex = host.lastIndexOf(":");
  return portIndex === -1 ? host : host.slice(0, portIndex);
}

/**
 * Returns the tenant subdomain for a Host header, or null when the host is the
 * root domain, a bare hostname, a reserved subdomain, or unparseable.
 *
 * Examples (ROOT_DOMAIN=localhost:3000):
 *   "slow-api.localhost:3000" -> "slow-api"
 *   "localhost:3000"          -> null
 *   "www.localhost:3000"      -> null  (reserved)
 *   "healthy.example.com"     -> "healthy" (when ROOT_DOMAIN=example.com)
 */
export function getSubdomain(host: string | null | undefined): string | null {
  if (!host) return null;

  const hostname = stripPort(host.trim().toLowerCase());
  const rootHostname = stripPort(ROOT_DOMAIN.toLowerCase());

  if (hostname === rootHostname || hostname === "localhost") return null;

  // Tenant subdomains are "<sub>.<rootHostname>". Also accept "<sub>.localhost"
  // so local dev works regardless of the configured port.
  const suffixes = [`.${rootHostname}`, ".localhost"];
  for (const suffix of suffixes) {
    if (hostname.endsWith(suffix)) {
      const sub = hostname.slice(0, -suffix.length);
      // Reject multi-level / empty subdomains and reserved names.
      if (!sub || sub.includes(".") || RESERVED_SUBDOMAINS.has(sub)) return null;
      return sub;
    }
  }

  return null;
}
