import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

async function importFresh() {
  // Re-import so module-level ROOT_DOMAIN picks up stubbed env.
  vi.resetModules();
  return (await import("./tenant-url")).tenantHref;
}

describe("tenantHref", () => {
  it("defaults to a path-based link (works everywhere)", async () => {
    vi.stubEnv("TENANT_SUBDOMAIN_LINKS", "");
    const tenantHref = await importFresh();
    expect(tenantHref("slow-api")).toBe("/s/slow-api");
  });

  it("uses an http subdomain link for a localhost ROOT_DOMAIN when enabled", async () => {
    vi.stubEnv("TENANT_SUBDOMAIN_LINKS", "1");
    vi.stubEnv("ROOT_DOMAIN", "localhost:3000");
    const tenantHref = await importFresh();
    expect(tenantHref("slow-api")).toBe("http://slow-api.localhost:3000");
  });

  it("uses an https subdomain link for a real ROOT_DOMAIN when enabled", async () => {
    vi.stubEnv("TENANT_SUBDOMAIN_LINKS", "1");
    vi.stubEnv("ROOT_DOMAIN", "example.com");
    const tenantHref = await importFresh();
    expect(tenantHref("slow-api")).toBe("https://slow-api.example.com");
  });
});
