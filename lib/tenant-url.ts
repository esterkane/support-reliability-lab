import { ROOT_DOMAIN } from "./subdomain";

/**
 * Link to open a tenant. Path-based by default (`/s/<sub>`), which works in every
 * environment: local dev, *.vercel.app, and custom domains.
 *
 * Once a wildcard custom domain is in place, set TENANT_SUBDOMAIN_LINKS=1 (and
 * ROOT_DOMAIN to that domain) to link to the real `<sub>.<domain>` host instead.
 * Local dev with ROOT_DOMAIN=localhost:3000 then yields `http://<sub>.localhost:3000`,
 * which Chrome/Firefox resolve automatically.
 */
export function tenantHref(subdomain: string): string {
  if (process.env.TENANT_SUBDOMAIN_LINKS === "1") {
    const proto = ROOT_DOMAIN.includes("localhost") ? "http" : "https";
    return `${proto}://${subdomain}.${ROOT_DOMAIN}`;
  }
  return `/s/${subdomain}`;
}
