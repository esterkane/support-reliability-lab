import { describe, expect, it } from "vitest";
import {
  diagnoseDomain,
  getDomainDiagnosis,
  type DnsFixture,
} from "./domain";

const VALID: DnsFixture = {
  wildcard: false,
  vercelNameservers: true,
  apexPointsToVercel: true,
  cnamePointsToVercel: true,
  ownershipRequired: false,
  txtVerified: true,
  sslIssued: true,
};

describe("diagnoseDomain", () => {
  it("reports a valid domain", () => {
    expect(diagnoseDomain(VALID)).toMatchObject({ state: "valid", ok: true });
  });

  it("flags a wildcard domain not on Vercel nameservers first", () => {
    const d = diagnoseDomain({ ...VALID, wildcard: true, vercelNameservers: false });
    expect(d.state).toBe("wildcard-needs-nameservers");
    expect(d.ok).toBe(false);
  });

  it("flags pending ownership verification", () => {
    const d = diagnoseDomain({ ...VALID, ownershipRequired: true, txtVerified: false });
    expect(d.state).toBe("verification-pending");
  });

  it("flags invalid configuration when no records point at Vercel", () => {
    const d = diagnoseDomain({
      ...VALID,
      apexPointsToVercel: false,
      cnamePointsToVercel: false,
    });
    expect(d.state).toBe("invalid-configuration");
  });

  it("flags SSL still pending when records are correct", () => {
    expect(diagnoseDomain({ ...VALID, sslIssued: false }).state).toBe("ssl-pending");
  });

  it("checks the wildcard blocker before SSL", () => {
    // Both wildcard-NS and SSL are unmet; root cause is the nameservers.
    const d = diagnoseDomain({
      ...VALID,
      wildcard: true,
      vercelNameservers: false,
      sslIssued: false,
    });
    expect(d.state).toBe("wildcard-needs-nameservers");
  });
});

describe("getDomainDiagnosis", () => {
  it("returns a diagnosis for the broken-domain tenant", () => {
    const result = getDomainDiagnosis("broken-domain");
    expect(result).not.toBeNull();
    expect(result!.domain).toBe("*.broken-domain.app");
    expect(result!.diagnosis.state).toBe("wildcard-needs-nameservers");
  });

  it("returns null for tenants without a configured domain", () => {
    expect(getDomainDiagnosis("healthy")).toBeNull();
  });
});
