import { describe, expect, it } from "vitest";
import { createTtlCache } from "./ttl-cache";

describe("createTtlCache", () => {
  it("returns values until they expire", () => {
    let now = 0;
    const cache = createTtlCache<string>({ ttlMs: 1000, maxEntries: 10, now: () => now });
    cache.set("a", "1");
    now = 999;
    expect(cache.get("a")).toBe("1");
    now = 1000;
    expect(cache.get("a")).toBeUndefined();
  });

  it("evicts the oldest entries beyond the size cap", () => {
    const cache = createTtlCache<number>({ ttlMs: 1000, maxEntries: 2, now: () => 0 });
    cache.set("a", 1);
    cache.set("b", 2);
    cache.set("a", 10); // refreshes "a", so "b" is now the oldest
    cache.set("c", 3);
    expect(cache.get("b")).toBeUndefined();
    expect(cache.get("a")).toBe(10);
    expect(cache.get("c")).toBe(3);
  });
});
