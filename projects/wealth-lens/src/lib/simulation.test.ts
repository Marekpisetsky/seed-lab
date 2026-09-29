import { describe, expect, it } from "vitest";
import { INDEXES } from "./indexes";
import { successRate } from "./monte-carlo";
import { cachedSuccessRate, percentile, wealthPercentiles } from "./simulation";

const sp500 = INDEXES.sp500.years.map((entry) => entry.realReturn);

describe("percentile", () => {
  it("interpolates between neighbours", () => {
    expect(percentile([1, 2, 3, 4, 5], 0.5)).toBe(3);
    expect(percentile([0, 10], 0.1)).toBeCloseTo(1, 12);
    expect(percentile([7], 0.9)).toBe(7);
  });
});

describe("wealthPercentiles", () => {
  it("matches the formula when every year returns the same", () => {
    // 5 % a year, EUR 100/month: (B + 600) × 1.05 + 600 each year.
    const { p10, p50, p90 } = wealthPercentiles({ start: 1000, monthly: 100, returns: [0.05], years: 2 });
    const year1 = (1000 + 600) * 1.05 + 600;
    const year2 = (year1 + 600) * 1.05 + 600;
    [1000, year1, year2].forEach((expected, year) => {
      expect(p50[year]).toBeCloseTo(expected, 8);
      expect(p10[year]).toBeCloseTo(expected, 8);
      expect(p90[year]).toBeCloseTo(expected, 8);
    });
  });

  it("spreads out with real history, low below middle below high", () => {
    const { p10, p50, p90 } = wealthPercentiles({ start: 10_000, monthly: 200, returns: sp500, years: 20 });
    expect(p10).toHaveLength(21);
    for (let year = 1; year <= 20; year++) {
      expect(p10[year]).toBeLessThan(p50[year]);
      expect(p50[year]).toBeLessThan(p90[year]);
    }
    // The band widens with time.
    expect(p90[20] - p10[20]).toBeGreaterThan(p90[5] - p10[5]);
  });

  it("is reproducible with the same seed", () => {
    const options = { start: 1000, monthly: 50, returns: sp500, years: 10 };
    expect(wealthPercentiles(options)).toEqual(wealthPercentiles(options));
  });

  it("gives the same answer from cached paths, for any amounts", () => {
    for (const [start, monthly] of [[1000, 50], [50_000, 1000], [0, 300]]) {
      const options = { start, monthly, returns: sp500, years: 10 };
      const fresh = wealthPercentiles(options);
      const cached = wealthPercentiles({ ...options, key: "index:sp500" });
      fresh.p50.forEach((value, year) => expect(cached.p50[year]).toBeCloseTo(value, 6));
      fresh.p10.forEach((value, year) => expect(cached.p10[year]).toBeCloseTo(value, 6));
    }
  });
});

describe("cachedSuccessRate", () => {
  it("gives the same answer as the simulation, and reuses it", () => {
    const first = cachedSuccessRate("index:sp500", sp500, 0.04);
    expect(first).toBe(successRate({ withdrawalRate: 0.04, returns: sp500 }));
    // A different pool under the same key returns the cached value: the key identifies the history.
    expect(cachedSuccessRate("index:sp500", [0.5], 0.04)).toBe(first);
  });
});
