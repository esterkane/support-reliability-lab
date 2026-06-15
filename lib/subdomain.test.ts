import { describe, expect, it } from "vitest";
import { getSubdomain } from "./subdomain";

// ROOT_DOMAIN defaults to localhost:3000 in tests.
describe("getSubdomain", () => {
  it("returns null for the root domain and bare localhost", () => {
    expect(getSubdomain("localhost:3000")).toBeNull();
    expect(getSubdomain("localhost")).toBeNull();
  });

  it("extracts a tenant subdomain on localhost (any port)", () => {
    expect(getSubdomain("slow-api.localhost:3000")).toBe("slow-api");
    expect(getSubdomain("healthy.localhost:8080")).toBe("healthy");
  });

  it("treats reserved subdomains as root", () => {
    expect(getSubdomain("www.localhost:3000")).toBeNull();
    expect(getSubdomain("admin.localhost:3000")).toBeNull();
    expect(getSubdomain("api.localhost:3000")).toBeNull();
  });

  it("rejects multi-level and empty subdomains", () => {
    expect(getSubdomain("a.b.localhost:3000")).toBeNull();
    expect(getSubdomain(".localhost:3000")).toBeNull();
  });

  it("is case-insensitive and trims input", () => {
    expect(getSubdomain("  SLOW-API.LOCALHOST:3000 ")).toBe("slow-api");
  });

  it("returns null for null/undefined/empty host", () => {
    expect(getSubdomain(null)).toBeNull();
    expect(getSubdomain(undefined)).toBeNull();
    expect(getSubdomain("")).toBeNull();
  });

  // The core multi-tenant safety property: a request for tenant A's host must
  // never resolve to tenant B's subdomain.
  it("never resolves one tenant's host to another tenant", () => {
    expect(getSubdomain("tenant-a.localhost:3000")).toBe("tenant-a");
    expect(getSubdomain("tenant-a.localhost:3000")).not.toBe("tenant-b");
  });
});
