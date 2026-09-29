import { describe, expect, it, vi } from "vitest";
import { createPriceProxy } from "./price-proxy";
import type { PriceErrorResponse, PriceSeriesResponse } from "./prices";

const CSV = "Date,Open,High,Low,Close,Volume\n2026-09-25,1,1,1,228.4,10\n2026-09-26,1,1,1,229.9,10";
const request = (symbol: string) => new Request(`http://localhost/api/prices?symbol=${encodeURIComponent(symbol)}`);

function setup(respond: () => Promise<Response>) {
  const fetchImpl = vi.fn<typeof fetch>(respond);
  const handler = createPriceProxy({ fetchImpl, now: () => new Date("2026-09-29T10:00:00Z") });
  return { fetchImpl, handler };
}

describe("price proxy (GET /api/prices)", () => {
  it("fetches Stooq's daily CSV and returns JSON points with cache headers", async () => {
    const { fetchImpl, handler } = setup(async () => new Response(CSV));
    const response = await handler(request("AAPL.US"));

    expect(fetchImpl).toHaveBeenCalledWith("https://stooq.com/q/d/l/?s=aapl.us&i=d", expect.objectContaining({ cache: "no-store" }));
    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toMatch(/s-maxage=21600/);
    const body = (await response.json()) as PriceSeriesResponse;
    expect(body).toEqual({
      symbol: "aapl.us",
      source: "stooq",
      fetchedAt: "2026-09-29T10:00:00.000Z",
      points: [
        { time: "2026-09-25", close: 228.4 },
        { time: "2026-09-26", close: 229.9 },
      ],
    });
  });

  it("serves repeated requests from its cache", async () => {
    const { fetchImpl, handler } = setup(async () => new Response(CSV));
    await handler(request("aapl.us"));
    const second = await handler(request("aapl.us"));
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(second.headers.get("X-Price-Cache")).toBe("HIT");
  });

  it("rejects invalid symbols without calling Stooq", async () => {
    const { fetchImpl, handler } = setup(async () => new Response(CSV));
    const response = await handler(request("aapl.us&i=w"));
    expect(response.status).toBe(400);
    expect(((await response.json()) as PriceErrorResponse).error.code).toBe("INVALID_SYMBOL");
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("maps Stooq's error answers to explicit, uncached errors", async () => {
    const { fetchImpl, handler } = setup(async () => new Response("No data"));
    const response = await handler(request("nope.us"));
    expect(response.status).toBe(404);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(((await response.json()) as PriceErrorResponse).error.code).toBe("NOT_FOUND");

    // Errors are not cached: the next request tries Stooq again.
    await handler(request("nope.us"));
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it("reports rate limiting as 429", async () => {
    const { handler } = setup(async () => new Response("Exceeded the daily hits limit"));
    expect((await handler(request("aapl.us"))).status).toBe(429);
  });

  it("reports network failures and timeouts", async () => {
    const failing = setup(async () => {
      throw new TypeError("fetch failed");
    });
    const failed = await failing.handler(request("aapl.us"));
    expect(failed.status).toBe(502);
    expect(((await failed.json()) as PriceErrorResponse).error.code).toBe("UPSTREAM_ERROR");

    const slow = setup(async () => {
      throw new DOMException("The operation timed out.", "TimeoutError");
    });
    const timedOut = await slow.handler(request("aapl.us"));
    expect(timedOut.status).toBe(504);
    expect(((await timedOut.json()) as PriceErrorResponse).error.code).toBe("TIMEOUT");
  });
});
