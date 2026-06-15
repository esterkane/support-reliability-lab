import { describe, expect, it } from "vitest";
import {
  buildPropagationHeaders,
  generateTraceparent,
  parseTraceparent,
} from "./trace";

describe("trace propagation (broken-trace incident)", () => {
  it("parses a valid traceparent", () => {
    const ctx = parseTraceparent(
      "00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01",
    );
    expect(ctx).toEqual({
      traceId: "0af7651916cd43dd8448eb211c80319c",
      spanId: "b7ad6b7169203331",
    });
  });

  it("returns null for missing or malformed values", () => {
    expect(parseTraceparent(null)).toBeNull();
    expect(parseTraceparent(undefined)).toBeNull();
    expect(parseTraceparent("")).toBeNull();
    expect(parseTraceparent("not-a-traceparent")).toBeNull();
    expect(parseTraceparent("00-short-b7ad6b7169203331-01")).toBeNull();
  });

  it("generates a traceparent that round-trips through the parser", () => {
    const tp = generateTraceparent();
    const ctx = parseTraceparent(tp);
    expect(ctx).not.toBeNull();
    expect(ctx!.traceId).toHaveLength(32);
    expect(ctx!.spanId).toHaveLength(16);
  });

  it("propagates the header only when propagate is true", () => {
    const tp = generateTraceparent();
    expect(buildPropagationHeaders(tp, { propagate: true })).toEqual({
      traceparent: tp,
    });
    // The broken-trace bug: header dropped -> downstream span orphaned.
    expect(buildPropagationHeaders(tp, { propagate: false })).toEqual({});
  });
});
