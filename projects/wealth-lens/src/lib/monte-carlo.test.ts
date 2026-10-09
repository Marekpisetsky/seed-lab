import { describe, expect, it } from "vitest";
import sp500 from "@/data/sp500-real-returns.json";
import { INDEXES, SERIES } from "./indexes";
import { mulberry32, successRate, successRates, survives, yearsLasting } from "./monte-carlo";

const HISTORICAL_REAL_RETURNS = INDEXES.sp500.years.map((entry) => entry.realReturn);

describe("S&P 500 dataset", () => {
  it("covers 1928 onwards, one entry per year, with a source", () => {
    const years = sp500.years.map((entry) => entry.year);
    expect(years[0]).toBe(1928);
    expect(years).toEqual(years.map((_, index) => 1928 + index));
    expect(sp500.source).toMatch(/Shiller/);
  });

  it("matches well-known years", () => {
    const byYear = new Map(sp500.years.map((entry) => [entry.year, entry.realReturn]));
    expect(byYear.get(1931)).toBeLessThan(-0.3); // Great Depression
    expect(byYear.get(2008)).toBeLessThan(-0.3); // Financial crisis
    expect(byYear.get(2013)).toBeGreaterThan(0.2);
  });

  it("has a long-run average real return of about 6-7 % a year (geometric) over 1928–2022", () => {
    const logs = INDEXES.sp500.dataset.years.map((entry) => Math.log1p(entry.realReturn));
    const geometric = Math.expm1(logs.reduce((a, b) => a + b, 0) / logs.length);
    expect(geometric).toBeGreaterThan(0.06);
    expect(geometric).toBeLessThan(0.07);
  });
});

describe("mulberry32", () => {
  it("is reproducible for a seed and stays in [0, 1)", () => {
    const a = mulberry32(1);
    const b = mulberry32(1);
    const values = Array.from({ length: 1000 }, () => a());
    expect(values).toEqual(Array.from({ length: 1000 }, () => b()));
    expect(values.every((v) => v >= 0 && v < 1)).toBe(true);
    expect(mulberry32(2)()).not.toBe(values[0]);
  });
});

describe("survives", () => {
  it("lasts forever when growth covers the withdrawal", () => {
    // 4 % out, then +7 %: (1 − 0.04) × 1.07 = 1.0272 > 1, so the balance grows.
    expect(survives(Array(30).fill(0.07), 0.04)).toBe(true);
  });

  it("runs out when withdrawals are too large", () => {
    // With no growth, 4 % a year lasts exactly 25 years.
    expect(survives(Array(25).fill(0), 0.04)).toBe(false);
    expect(survives(Array(24).fill(0), 0.04)).toBe(true);
  });
});

describe("successRate", () => {
  it("is 100 % with a constant 7 % return and 4 % withdrawals", () => {
    expect(successRate({ withdrawalRate: 0.04, returns: [0.07] })).toBe(1);
  });

  it("is 0 % with a constant 7 % return and 15 % withdrawals", () => {
    expect(successRate({ withdrawalRate: 0.15, returns: [0.07] })).toBe(0);
  });

  it("is low with 15 % withdrawals over historical returns", () => {
    expect(successRate({ withdrawalRate: 0.15, returns: HISTORICAL_REAL_RETURNS })).toBeLessThan(0.1);
  });

  it("is high but not certain at 4 % over historical returns", () => {
    const rate = successRate({ withdrawalRate: 0.04, returns: HISTORICAL_REAL_RETURNS });
    expect(rate).toBeGreaterThan(0.85);
    expect(rate).toBeLessThan(1);
  });

  it("falls as the withdrawal rate rises", () => {
    const rates = [0.03, 0.04, 0.05, 0.07].map((withdrawalRate) => successRate({ withdrawalRate, returns: HISTORICAL_REAL_RETURNS }));
    expect([...rates].sort((a, b) => b - a)).toEqual(rates);
  });

  it("is reproducible with the same seed and stable across seeds", () => {
    expect(successRate({ withdrawalRate: 0.05, returns: HISTORICAL_REAL_RETURNS })).toBe(successRate({ withdrawalRate: 0.05, returns: HISTORICAL_REAL_RETURNS }));
    const other = successRate({ withdrawalRate: 0.05, returns: HISTORICAL_REAL_RETURNS, seed: 7 });
    expect(Math.abs(other - successRate({ withdrawalRate: 0.05, returns: HISTORICAL_REAL_RETURNS }))).toBeLessThan(0.03);
  });

  it("differs by history: US stocks' years last more often than gold's", () => {
    const returns = (id: keyof typeof SERIES) => SERIES[id].years.map((entry) => entry.realReturn);
    const stocks = successRate({ withdrawalRate: 0.05, returns: returns("sp500") });
    const gold = successRate({ withdrawalRate: 0.05, returns: returns("gold") });
    expect(stocks).toBeGreaterThan(gold);
  });

  it("rejects an empty pool of returns", () => {
    expect(() => successRate({ withdrawalRate: 0.04, returns: [] })).toThrow(RangeError);
  });
});

describe("successRates", () => {
  it("gives the same results as one simulation per rate", () => {
    const rates = [0.03, 0.04, 0.05];
    expect(successRates({ withdrawalRates: rates, returns: HISTORICAL_REAL_RETURNS })).toEqual(
      rates.map((withdrawalRate) => successRate({ withdrawalRate, returns: HISTORICAL_REAL_RETURNS })),
    );
  });
});

describe("yearsLasting: with no swings, how long withdrawals last", () => {
  it("is 1 ÷ rate years at no growth, longer with growth, shorter with a loss", () => {
    expect(yearsLasting(0.04, 0)).toBeCloseTo(25, 9);
    expect(yearsLasting(0.04, 0.01)).toBeGreaterThan(25);
    expect(yearsLasting(0.04, -0.005)).toBeLessThan(25);
    expect(Math.floor(yearsLasting(0.04, 1.015 / 1.02 - 1))).toBe(23);
  });

  it("never runs out when growth pays for the withdrawals, and agrees with survives", () => {
    expect(yearsLasting(0.03, 0.04)).toBe(Infinity);
    for (const [rate, growth] of [[0.04, -0.005], [0.05, 0.02], [0.03, 0]]) {
      expect(survives(new Array(30).fill(growth), rate)).toBe(yearsLasting(rate, growth) > 30);
    }
  });
});
