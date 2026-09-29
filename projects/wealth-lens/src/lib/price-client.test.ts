import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchFirstAvailable, forgetPriceSeries } from "./price-client";

function answer(symbol: string): Response {
  if (symbol === "xyz.us") {
    return Response.json({ symbol, source: "stooq", fetchedAt: "", points: [{ time: "2026-09-25", close: 10 }] });
  }
  if (symbol === "lim.de") return Response.json({ error: { code: "RATE_LIMITED", message: "limit" } }, { status: 429 });
  return Response.json({ error: { code: "NOT_FOUND", message: "no data" } }, { status: 404 });
}

describe("fetchFirstAvailable", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    ["xyz.de", "xyz.us", "lim.de", "nope.de", "nope.us"].forEach(forgetPriceSeries);
  });

  it("moves to the next candidate when a symbol has no data", async () => {
    const fetchMock = vi.fn(async (url: string) => answer(new URL(url, "http://x").searchParams.get("symbol") ?? ""));
    vi.stubGlobal("fetch", fetchMock);
    const result = await fetchFirstAvailable(["xyz.de", "xyz.us"]);
    expect(result.ok && result.symbol).toBe("xyz.us");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("stops at other errors instead of trying more symbols", async () => {
    const fetchMock = vi.fn(async (url: string) => answer(new URL(url, "http://x").searchParams.get("symbol") ?? ""));
    vi.stubGlobal("fetch", fetchMock);
    const result = await fetchFirstAvailable(["lim.de", "xyz.us"]);
    expect(result.ok).toBe(false);
    expect(!result.ok && result.error.code).toBe("RATE_LIMITED");
    expect(result.symbol).toBe("lim.de");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("reports the last error when no candidate has data", async () => {
    vi.stubGlobal("fetch", vi.fn(async (url: string) => answer(new URL(url, "http://x").searchParams.get("symbol") ?? "")));
    const result = await fetchFirstAvailable(["nope.de", "nope.us"]);
    expect(!result.ok && result.error.code).toBe("NOT_FOUND");
    expect(result.symbol).toBe("nope.us");
  });
});
