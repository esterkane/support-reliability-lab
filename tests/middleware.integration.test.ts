import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { middleware } from "../middleware";

// Exercises the real middleware end-to-end: a host comes in, a rewrite goes out.
// This is the guard for the wrong-tenant incident — a request for one tenant's host
// must only ever be rewritten to that tenant's /s/<subdomain> path.
function run(host: string, path = "/") {
  const req = new NextRequest(`http://${host}${path}`);
  return middleware(req);
}

describe("middleware host routing (wrong-tenant isolation)", () => {
  it("rewrites a tenant host to its own /s/<subdomain> path", () => {
    const res = run("tenant-a.localhost:3000");
    expect(res.headers.get("x-middleware-rewrite")).toContain("/s/tenant-a");
    expect(res.headers.get("x-tenant")).toBe("tenant-a");
  });

  it("never rewrites one tenant's host to another tenant", () => {
    const res = run("tenant-a.localhost:3000");
    const rewrite = res.headers.get("x-middleware-rewrite") ?? "";
    expect(rewrite).toContain("/s/tenant-a");
    expect(rewrite).not.toContain("/s/tenant-b");
    expect(res.headers.get("x-tenant")).not.toBe("tenant-b");
  });

  it("preserves the requested path under the tenant rewrite", () => {
    const res = run("slow-api.localhost:3000", "/settings");
    expect(res.headers.get("x-middleware-rewrite")).toContain("/s/slow-api/settings");
  });

  it("passes through the root domain and reserved hosts without rewriting", () => {
    for (const host of [
      "localhost:3000",
      "www.localhost:3000",
      "admin.localhost:3000",
    ]) {
      const res = run(host);
      expect(res.headers.get("x-middleware-rewrite")).toBeNull();
      expect(res.headers.get("x-tenant")).toBeNull();
    }
  });

  it("does not double-rewrite a request already targeting /s/", () => {
    const res = run("tenant-a.localhost:3000", "/s/tenant-a");
    expect(res.headers.get("x-middleware-rewrite")).toBeNull();
  });
});
