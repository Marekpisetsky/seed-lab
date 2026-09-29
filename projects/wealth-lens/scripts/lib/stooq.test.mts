import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { interpretStooqResponse, stooqQuoteCurrency, stooqUrl } from "./stooq.mts";

/** A sample in Stooq's daily CSV format (Date,Open,High,Low,Close,Volume). */
const VUAA = readFileSync(new URL("./__fixtures__/stooq-vuaa-de.csv", import.meta.url), "utf8");

describe("interpretStooqResponse", () => {
  it("reads the closes and takes the currency from the market suffix", () => {
    expect(interpretStooqResponse(200, VUAA, "vuaa.de")).toEqual({
      ok: true,
      currency: "EUR",
      points: [
        { time: "2026-09-23", close: 112.64 },
        { time: "2026-09-24", close: 113.08 },
        { time: "2026-09-25", close: 112.35 },
        { time: "2026-09-28", close: 113.71 },
        { time: "2026-09-29", close: 113.96 },
      ],
    });
  });

  it("skips rows without a valid date or a positive close", () => {
    const csv = "Date,Open,High,Low,Close,Volume\n2026-09-24,1,1,1,10,5\nbad,1,1,1,11,5\n2026-09-25,1,1,1,-2,5\n2026-09-26,1,1,1,12,5";
    const result = interpretStooqResponse(200, csv, "aapl.us");
    expect(result.ok && result.points.map((point) => point.close)).toEqual([10, 12]);
  });

  it.each([
    [200, "No data", "NOT_FOUND"],
    [200, "", "NOT_FOUND"],
    [200, "Exceeded the daily hits limit", "RATE_LIMITED"],
    [200, "<!DOCTYPE html><html><body>Please verify you are human</body></html>", "VERIFICATION_REQUIRED"],
    [200, "Get your apikey: https://stooq.com/q/d/?s=aapl.us&get_apikey", "VERIFICATION_REQUIRED"],
    [200, "Symbol;Value\naapl;1", "UNEXPECTED_FORMAT"],
    [503, "Service Unavailable", "UPSTREAM_ERROR"],
  ])("classifies HTTP %i %j as %s", (status, body, code) => {
    const result = interpretStooqResponse(status, body, "aapl.us");
    expect(!result.ok && result.error.code).toBe(code);
  });
});

describe("Stooq symbols", () => {
  it("builds the documented download URL", () => {
    expect(stooqUrl("aapl.us")).toBe("https://stooq.com/q/d/l/?s=aapl.us&i=d");
  });

  it("knows the quote currency of common markets", () => {
    expect(stooqQuoteCurrency("aapl.us")).toBe("USD");
    expect(stooqQuoteCurrency("vwce.de")).toBe("EUR");
    expect(stooqQuoteCurrency("vusa.uk")).toBe("GBX");
    expect(stooqQuoteCurrency("^spx")).toBeNull();
    expect(stooqQuoteCurrency("abc.zz")).toBeNull();
  });
});
