/**
 * Custom-domain configuration diagnoser — the offline, deterministic half of the
 * invalid-domain incident. Given a snapshot of a domain's DNS/verification state,
 * it returns the same classification a support engineer reaches with `dig` and the
 * Vercel dashboard (see the dns-triage skill and scripts/dns-check.sh for the live
 * half against a real domain).
 */

export interface DnsFixture {
  /** Is this a wildcard domain (*.example.com)? */
  wildcard: boolean;
  /** Apex uses Vercel nameservers (required for wildcard DNS-01 SSL). */
  vercelNameservers: boolean;
  /** Apex A record points at Vercel's documented target. */
  apexPointsToVercel: boolean;
  /** www CNAME points at Vercel. */
  cnamePointsToVercel: boolean;
  /** Domain is already in use elsewhere, so ownership must be proven. */
  ownershipRequired: boolean;
  /** _vercel TXT ownership verification completed. */
  txtVerified: boolean;
  /** SSL certificate has been issued. */
  sslIssued: boolean;
}

export type DomainState =
  | "valid"
  | "wildcard-needs-nameservers"
  | "verification-pending"
  | "invalid-configuration"
  | "ssl-pending";

export interface DomainDiagnosis {
  state: DomainState;
  ok: boolean;
  summary: string;
  remediation: string;
}

/**
 * Classify a domain's state. Order matters: the most specific, blocking issues are
 * checked first so the diagnosis names the actual root cause, not a downstream symptom.
 */
export function diagnoseDomain(fx: DnsFixture): DomainDiagnosis {
  if (fx.wildcard && !fx.vercelNameservers) {
    return {
      state: "wildcard-needs-nameservers",
      ok: false,
      summary:
        "Wildcard domain can't issue SSL: the apex is not on Vercel nameservers.",
      remediation:
        "Move the apex domain to Vercel nameservers so Vercel can complete DNS-01 validation for the wildcard certificate.",
    };
  }

  if (fx.ownershipRequired && !fx.txtVerified) {
    return {
      state: "verification-pending",
      ok: false,
      summary:
        "Ownership verification is pending — the domain is in use on another account.",
      remediation:
        "Add the _vercel TXT record and complete verification to prove ownership.",
    };
  }

  if (!fx.apexPointsToVercel && !fx.cnamePointsToVercel) {
    return {
      state: "invalid-configuration",
      ok: false,
      summary:
        "Invalid Configuration: neither the apex A record nor the www CNAME points at Vercel.",
      remediation:
        "Point the apex A record and/or www CNAME at Vercel's documented targets, then allow DNS propagation.",
    };
  }

  if (!fx.sslIssued) {
    return {
      state: "ssl-pending",
      ok: false,
      summary: "Records look correct; SSL has not been issued yet.",
      remediation:
        "Wait for propagation and certificate issuance; re-check with openssl until issuer/dates are valid.",
    };
  }

  return {
    state: "valid",
    ok: true,
    summary: "Domain is configured correctly and SSL is issued.",
    remediation: "No action needed.",
  };
}

/** Deterministic DNS snapshots per tenant, for the lab. */
const FIXTURES: Record<string, DnsFixture> = {
  // The broken-domain tenant: a wildcard domain whose apex is NOT on Vercel
  // nameservers — the classic wildcard-SSL blocker.
  "broken-domain": {
    wildcard: true,
    vercelNameservers: false,
    apexPointsToVercel: true,
    cnamePointsToVercel: true,
    ownershipRequired: false,
    txtVerified: true,
    sslIssued: false,
  },
};

export interface TenantDomain {
  domain: string;
  diagnosis: DomainDiagnosis;
}

/** Diagnosis for a tenant's custom domain, or null if it has none configured. */
export function getDomainDiagnosis(subdomain: string): TenantDomain | null {
  const fixture = FIXTURES[subdomain];
  if (!fixture) return null;
  return {
    domain: fixture.wildcard ? `*.${subdomain}.app` : `${subdomain}.app`,
    diagnosis: diagnoseDomain(fixture),
  };
}
