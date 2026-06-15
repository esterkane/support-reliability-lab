import { describe, expect, it } from "vitest";
import { checkPayloadSize, PAYLOAD_LIMIT_BYTES } from "./upload";

describe("checkPayloadSize (payload-too-large incident)", () => {
  it("accepts a body under the limit", () => {
    const r = checkPayloadSize(PAYLOAD_LIMIT_BYTES - 1);
    expect(r.ok).toBe(true);
    expect(r.status).toBe(200);
  });

  it("accepts a body exactly at the limit", () => {
    const r = checkPayloadSize(PAYLOAD_LIMIT_BYTES);
    expect(r.ok).toBe(true);
    expect(r.status).toBe(200);
  });

  it("rejects a body over the limit with 413", () => {
    const r = checkPayloadSize(PAYLOAD_LIMIT_BYTES + 1);
    expect(r.ok).toBe(false);
    expect(r.status).toBe(413);
    expect(r.limit).toBe(PAYLOAD_LIMIT_BYTES);
  });

  it("honors a custom limit", () => {
    expect(checkPayloadSize(500, 1000).ok).toBe(true);
    expect(checkPayloadSize(1500, 1000).status).toBe(413);
  });
});
