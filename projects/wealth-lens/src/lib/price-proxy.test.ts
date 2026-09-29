import { describe, expect, it, vi } from "vitest";
import notFound from "../../scripts/lib/__fixtures__/yahoo-chart-not-found.json";
import vwce from "../../scripts/lib/__fixtures__/yahoo-chart-vwce-de.json";
import { createPriceProxy } from "./price-proxy";
import type { PriceErrorResponse, PriceSeriesResponse } from "./prices";

const STOOQ_CSV = "Date,Open,High,Low,Close,Volume\n2026-09-25,1,1,1,228.4,10\n2026-09-26,1,1,1,229.9,10";
const request = (symbol: string) => new Request(`http://localhost/api/prices?symbol=${encodeURIComponent(symbol)}`);

type Route = { yahoo?: () => Response | Promise<Response>; stooq?: () => Response | Promise<Response> };

function setup(route: Route) {
  const fetchImpl = vi.fn<typeof fetch>(async (input) => {
    const url = String(input);
    const answer = url.includes("finance.yahoo.com") ? route.yahoo : url.includes("stooq.com") ? route.stooq : undefined;
    if (!answer) throw new Error(`unexpected request: ${url}`);
    return answer();
  });
  const handler = createPriceProxy({ fetchImpl, now: () => new Date("2026-09-29T10:00:00Z") });
  const urls = () => fetchImpl.mock.calls.map(([input]) => String(input));
  return { fetchImpl, handler, urls };
}

const json = (value: unknown, status = 200) => Response.json(value, { status });

describe("price proxy (GET /api/prices)", () => {
  it("gets daily closes and the currency from Yahoo first", async () => {
    const { handler, urls } = setup({ yahoo: () => json(vwce) });
    const response = await handler(request("vwce.de"));

    expect(urls()).toEqual(["https://query1.finance.yahoo.com/v8/finance/chart/VWCE.DE?range=5y&interval=1d"]);
    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toMatch(/s-maxage=21600/);
    const body = (await response.json()) as PriceSeriesResponse;
    expect(body).toMatchObject({ symbol: "VWCE.DE", source: "yahoo", currency: "EUR", fetchedAt: "2026-09-29T10:00:00.000Z" });
    expect(body.points.at(-1)).toEqual({ time: "2026-09-29", close: 141.3 });
  });

  it("falls back to Stooq when Yahoo fails, reporting the listing's currency", async () => {
    const { handler, urls } = setup({ yahoo: () => new Response("Too Many Requests", { status: 429 }), stooq: () => new Response(STOOQ_CSV) });
    const response = await handler(request("AAPL"));
    expect(urls()[1]).toBe("https://stooq.com/q/d/l/?s=aapl.us&i=d");
    const body = (await response.json()) as PriceSeriesResponse;
    expect(body).toMatchObject({ symbol: "AAPL", source: "stooq", currency: "USD" });
    expect(body.points).toHaveLength(2);
  });

  it("uses the Xetra line on Stooq for Euronext symbols", async () => {
    const { handler, urls } = setup({ yahoo: () => json(notFound, 404), stooq: () => new Response(STOOQ_CSV) });
    await handler(request("ASML.AS"));
    expect(urls()[1]).toBe("https://stooq.com/q/d/l/?s=asme.de&i=d");
  });

  it("reports Yahoo's error when the fallback fails too", async () => {
    const { handler } = setup({ yahoo: () => json(notFound, 404), stooq: () => new Response("No data") });
    const response = await handler(request("NOPE"));
    expect(response.status).toBe(404);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(((await response.json()) as PriceErrorResponse).error.code).toBe("NOT_FOUND");
  });

  it("skips the fallback when Stooq has no equivalent listing", async () => {
    const { handler, urls } = setup({ yahoo: () => new Response("Too Many Requests", { status: 429 }) });
    const response = await handler(request("NESN.SW"));
    expect(urls()).toHaveLength(1);
    expect(response.status).toBe(429);
  });

  it("serves repeated requests from its cache", async () => {
    const { fetchImpl, handler } = setup({ yahoo: () => json(vwce) });
    await handler(request("VWCE.DE"));
    const second = await handler(request("vwce.de"));
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(second.headers.get("X-Price-Cache")).toBe("HIT");
  });

  it("never caches errors", async () => {
    const { fetchImpl, handler } = setup({ yahoo: () => json(notFound, 404), stooq: () => new Response("No data") });
    await handler(request("NOPE"));
    await handler(request("NOPE"));
    expect(fetchImpl).toHaveBeenCalledTimes(4);
  });

  it("rejects invalid symbols without calling any source", async () => {
    const { fetchImpl, handler } = setup({});
    const response = await handler(request("AAPL?range=max"));
    expect(response.status).toBe(400);
    expect(((await response.json()) as PriceErrorResponse).error.code).toBe("INVALID_SYMBOL");
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("reports network failures and timeouts", async () => {
    const failing = setup({
      yahoo: () => {
        throw new TypeError("fetch failed");
      },
      stooq: () => {
        throw new TypeError("fetch failed");
      },
    });
    const failed = await failing.handler(request("AAPL"));
    expect(failed.status).toBe(502);
    expect(((await failed.json()) as PriceErrorResponse).error.code).toBe("UPSTREAM_ERROR");

    const slow = setup({
      yahoo: () => {
        throw new DOMException("The operation timed out.", "TimeoutError");
      },
    });
    const timedOut = await slow.handler(request("NESN.SW"));
    expect(timedOut.status).toBe(504);
    expect(((await timedOut.json()) as PriceErrorResponse).error.code).toBe("TIMEOUT");
  });
});
