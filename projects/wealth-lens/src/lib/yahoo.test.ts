import { describe, expect, it } from "vitest";
import notFound from "./__fixtures__/yahoo-chart-not-found.json";
import vwce from "./__fixtures__/yahoo-chart-vwce-de.json";
import { interpretYahooResponse, normalizeYahooCurrency, normalizeYahooSymbol, yahooChartUrl } from "./yahoo";

const body = (value: unknown) => JSON.stringify(value);

describe("interpretYahooResponse", () => {
  it("reads daily closes and the currency from a chart answer", () => {
    const result = interpretYahooResponse(200, body(vwce));
    expect(result).toEqual({
      ok: true,
      currency: "EUR",
      points: [
        { time: "2026-09-21", close: 139.12 },
        { time: "2026-09-22", close: 140.5 },
        // 2026-09-23 has a null close and is skipped.
        { time: "2026-09-24", close: 141.02 },
        { time: "2026-09-25", close: 141.58 },
        { time: "2026-09-28", close: 140.9 },
        { time: "2026-09-29", close: 141.3 },
      ],
    });
  });

  it("uses the exchange offset to date each bar on its local trading day", () => {
    // A bar stamped 23:30 UTC on the 24th is the 25th in Tokyo (UTC+9).
    const tokyo = {
      chart: {
        result: [
          {
            meta: { currency: "JPY", gmtoffset: 32400 },
            timestamp: [Date.UTC(2026, 8, 24, 23, 30) / 1000],
            indicators: { quote: [{ close: [2800] }] },
          },
        ],
        error: null,
      },
    };
    const result = interpretYahooResponse(200, body(tokyo));
    expect(result.ok && result.points).toEqual([{ time: "2026-09-25", close: 2800 }]);
  });

  it("maps Yahoo's 'Not Found' error to NOT_FOUND", () => {
    const result = interpretYahooResponse(404, body(notFound));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("NOT_FOUND");
  });

  it("treats a symbol without history as NOT_FOUND", () => {
    const empty = { chart: { result: [{ meta: { currency: "EUR" }, indicators: { quote: [{}] } }], error: null } };
    const result = interpretYahooResponse(200, body(empty));
    expect(!result.ok && result.error.code).toBe("NOT_FOUND");
  });

  it.each([
    [429, "Too Many Requests", "RATE_LIMITED"],
    [200, "<!doctype html><html>consent</html>", "VERIFICATION_REQUIRED"],
    [503, "Service Unavailable", "UPSTREAM_ERROR"],
    [200, "not json", "UNEXPECTED_FORMAT"],
    [200, body({ something: "else" }), "UNEXPECTED_FORMAT"],
    [500, body({ chart: { result: null, error: { code: "Internal", description: "boom" } } }), "UPSTREAM_ERROR"],
  ])("classifies HTTP %i %j as %s", (status, text, code) => {
    const result = interpretYahooResponse(status, text);
    expect(!result.ok && result.error.code).toBe(code);
  });
});

describe("Yahoo symbols and currencies", () => {
  it("normalizes and validates symbols", () => {
    expect(normalizeYahooSymbol(" vwce.de ")).toBe("VWCE.DE");
    expect(normalizeYahooSymbol("^GSPC")).toBe("^GSPC");
    expect(normalizeYahooSymbol("BRK-B")).toBe("BRK-B");
    expect(normalizeYahooSymbol("AAPL?range=max")).toBeNull();
    expect(normalizeYahooSymbol("../x")).toBeNull();
    expect(normalizeYahooSymbol("")).toBeNull();
  });

  it("builds the chart URL with a 5-year daily range", () => {
    expect(yahooChartUrl("VWCE.DE")).toBe(
      "https://query1.finance.yahoo.com/v8/finance/chart/VWCE.DE?range=5y&interval=1d",
    );
  });

  it("maps London pence and upper-cases codes", () => {
    expect(normalizeYahooCurrency("GBp")).toBe("GBX");
    expect(normalizeYahooCurrency("eur")).toBe("EUR");
    expect(normalizeYahooCurrency(undefined)).toBeNull();
  });
});
