import { describe, expect, it } from "vitest";
import { SERIES } from "./indexes";
import { instrumentById, MARKET } from "./market-data";
import { FALLBACK_FACTOR, indexVolatility, logStats, MIN_DATA_YEARS, stockVolatility } from "./volatility";

describe("logStats", () => {
  it("gives the mean and spread of log returns", () => {
    const { mean, deviation } = logStats([0.1, -0.1, 0.1, -0.1]);
    expect(mean).toBeCloseTo((2 * Math.log(1.1) + 2 * Math.log(0.9)) / 4, 12);
    expect(deviation).toBeGreaterThan(0.1);
    expect(logStats([0.03]).deviation).toBe(0);
  });
});

describe("indexVolatility", () => {
  it("is each asset's spread over the common period", () => {
    for (const id of ["sp500", "bonds", "gold"] as const) {
      expect(indexVolatility(id), id).toBeCloseTo(logStats(SERIES[id].years.map((entry) => entry.realReturn)).deviation, 12);
    }
    expect(indexVolatility("bonds")).toBeLessThan(indexVolatility("sp500"));
  });
});

describe("a stock's own volatility (used in My portfolio)", () => {
  const nvda = instrumentById("NVDA");

  it("comes from its daily closes", () => {
    if (!nvda) throw new Error("NVDA is in the catalogue");
    expect(stockVolatility(nvda, MARKET)).toMatchObject({ fallback: false, volatility: MARKET.prices.NVDA.stats?.volatility });
    expect(stockVolatility(nvda, MARKET).volatility).toBeGreaterThan(indexVolatility("nasdaq100"));
  });

  it(`under ${MIN_DATA_YEARS} years, is ${FALLBACK_FACTOR} times its index's`, () => {
    if (!nvda) throw new Error("NVDA is in the catalogue");
    const short = {
      ...MARKET,
      prices: { ...MARKET.prices, NVDA: { ...MARKET.prices.NVDA, stats: { from: "2025-06-02", to: "2026-09-29", volatility: 0.9, years: {} } } },
    };
    expect(stockVolatility(nvda, short)).toMatchObject({ fallback: true, volatility: indexVolatility("nasdaq100") * FALLBACK_FACTOR });
    // Against the index it was assigned to, when the user changed it.
    expect(stockVolatility(nvda, short, "sp500").volatility).toBeCloseTo(indexVolatility("sp500") * FALLBACK_FACTOR, 12);
  });

  it("with no data at all, still has a figure", () => {
    if (!nvda) throw new Error("NVDA is in the catalogue");
    expect(stockVolatility(nvda, { ...MARKET, prices: {} })).toMatchObject({ fallback: true, dataYears: 0 });
  });
});
