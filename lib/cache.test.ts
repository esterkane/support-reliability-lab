import { beforeEach, describe, expect, it } from "vitest";
import { clearCache, getCached } from "./cache";
import { getCurrentContent, publishUpdate } from "./content";

beforeEach(clearCache);

describe("cache + content (cache-regression incident)", () => {
  it("is a MISS on first access, HIT thereafter for the same key", () => {
    const r1 = getCached("k1", () => 42);
    const r2 = getCached("k1", () => 99);
    expect(r1.status).toBe("MISS");
    expect(r2.status).toBe("HIT");
    expect(r2.value).toBe(42); // loader not re-run on HIT
  });

  it("CORRECT key includes the version, so a publish busts the cache (fresh)", () => {
    const sub = "ct-correct";
    let cur = getCurrentContent(sub);
    const before = getCached(`${sub}:v${cur.version}`, () => getCurrentContent(sub));
    expect(before.status).toBe("MISS");

    publishUpdate(sub);
    cur = getCurrentContent(sub);
    const after = getCached(`${sub}:v${cur.version}`, () => getCurrentContent(sub));

    expect(after.status).toBe("MISS"); // new version -> new key -> refetch
    expect(after.value.version).toBe(cur.version); // serves the current revision
  });

  it("BUGGY key omits the version, so a publish leaves stale content served", () => {
    const sub = "ct-buggy";
    const v0 = getCurrentContent(sub).version;
    const before = getCached(sub, () => getCurrentContent(sub)); // cache key = subdomain only
    expect(before.value.version).toBe(v0);

    publishUpdate(sub);
    const current = getCurrentContent(sub);
    const after = getCached(sub, () => getCurrentContent(sub));

    expect(after.status).toBe("HIT");
    expect(after.value.version).toBe(v0); // STALE: still the old revision
    expect(current.version).not.toBe(after.value.version); // proves the regression
  });
});
