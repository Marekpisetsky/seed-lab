import { describe, expect, it } from "vitest";
import { decadeYears, DECADE_YEARS, FAMOUS_DECADE, historicalDecade } from "./decade";
import { futureValueWithContributions } from "./finance";
import { SERIES, type SeriesId } from "./indexes";
import { CUSTOM_BASE, resolveInvestment } from "./investment";
import { STANDARD_ASSUMPTIONS } from "./types";

const yearsOf = (asset: SeriesId) => new Map(SERIES[asset].years.map((entry) => [entry.year, entry.realReturn]));
const asset = (id: SeriesId) => resolveInvestment({ kind: "asset", asset: id });
/** The plan's balances through given yearly growths, a year at a time, the monthly amount at each month's end. */
const through = (start: number, monthly: number, growths: readonly number[]) =>
  growths.reduce((head, growth) => [...head, futureValueWithContributions(head[head.length - 1], monthly, growth, 1)], [start]);
const logMean = (values: readonly number[]) => values.reduce((sum, value) => sum + Math.log1p(value), 0) / values.length;

describe("which decade", () => {
  it("is 2000–2009 for US stocks: a bad decade for them", () => {
    expect(decadeYears(asset("sp500"), 20)).toEqual([...FAMOUS_DECADE]);
  });

  it("is the worst ten years in a row where 2000–2009 was a good decade: German bonds and gold, named with their years", () => {
    expect(decadeYears(asset("bonds"), 20)).toEqual([2013, 2022]);
    expect(decadeYears(asset("gold"), 20)).toEqual([1988, 1997]);
    // 2000–2009 grew more than the average for both.
    for (const id of ["bonds", "gold"] as const) {
      const decade = Array.from({ length: 10 }, (_, index) => yearsOf(id).get(2000 + index) ?? NaN);
      expect(logMean(decade)).toBeGreaterThan(logMean(SERIES[id].years.map((entry) => entry.realReturn)));
    }
  });

  it("lasts the plan's years when they are fewer than ten", () => {
    expect(decadeYears(asset("sp500"), 6)).toEqual([2000, 2005]);
    expect(historicalDecade(asset("sp500"), 1000, 100, 6)?.head).toHaveLength(7);
  });

  it("does not exist with no ups and downs", () => {
    expect(historicalDecade(asset("savings" as SeriesId), 1000, 100, 20)).toBeNull();
    const fixed = resolveInvestment({ kind: "custom" }, { pricesOf: "NL", assumptions: { ...STANDARD_ASSUMPTIONS, growth: 0.05, volatility: 0 } });
    expect(historicalDecade(fixed, 1000, 100, 20)).toBeNull();
    expect(decadeYears(fixed, 20)).toBeNull();
  });
});

describe("what the decade does to the plan", () => {
  it("takes an asset's real years, one after the other", () => {
    const years = yearsOf("sp500");
    const growths = Array.from({ length: DECADE_YEARS }, (_, index) => years.get(2000 + index) ?? NaN);
    const decade = historicalDecade(asset("sp500"), 1100, 100, 20);
    expect(decade?.from).toBe(2000);
    expect(decade?.to).toBe(2009);
    through(1100, 100, growths).forEach((value, index) => expect(decade?.head[index]).toBeCloseTo(value, 6));
  });

  it("gives Custom growth US stocks' years, moved to the typed growth with their ups and downs kept", () => {
    const custom = resolveInvestment({ kind: "custom" }, { pricesOf: "NL", assumptions: { ...STANDARD_ASSUMPTIONS, growth: 0.05 } });
    const stocks = yearsOf(CUSTOM_BASE as SeriesId);
    const average = logMean(SERIES.sp500.years.map((entry) => entry.realReturn));
    const growths = Array.from({ length: DECADE_YEARS }, (_, index) => Math.expm1(Math.log1p(0.05) + Math.log1p(stocks.get(2000 + index) ?? NaN) - average));
    const decade = historicalDecade(custom, 1100, 100, 20);
    expect(decade?.from).toBe(2000);
    through(1100, 100, growths).forEach((value, index) => expect(decade?.head[index]).toBeCloseTo(value, 6));
    // Moved down from US stocks' own: a 5% average is below their 7.5%.
    expect(decade?.head[10]).toBeLessThan(historicalDecade(asset("sp500"), 1100, 100, 20)?.head[10] ?? -Infinity);
  });

  it("stretches the same years to ups and downs the user typed: bigger ones, a worse bad decade", () => {
    const at = (volatility: number) =>
      historicalDecade(resolveInvestment({ kind: "custom" }, { pricesOf: "NL", assumptions: { ...STANDARD_ASSUMPTIONS, growth: 0.05, volatility } }), 10_000, 0, 20)?.head[10] ?? NaN;
    expect(at(0.3)).toBeLessThan(at(0.18));
    expect(at(0.18)).toBeLessThan(at(0.05));
  });

  it("weights a mix's parts the same year, back at their weights each January or drifting", () => {
    const parts = [{ asset: "sp500" as const, weight: 60 }, { asset: "bonds" as const, weight: 40 }];
    const world = yearsOf("sp500");
    const bonds = yearsOf("bonds");
    const rebalanced = resolveInvestment({ kind: "mix", parts, rebalance: true });
    const growths = Array.from({ length: DECADE_YEARS }, (_, index) => 0.6 * (world.get(2000 + index) ?? NaN) + 0.4 * (bonds.get(2000 + index) ?? NaN));
    // 60/40 lost less than US stocks alone in 2000–2009, but it was still below its own average.
    expect(decadeYears(rebalanced, 20)).toEqual([2000, 2009]);
    through(1000, 100, growths).forEach((value, index) => expect(historicalDecade(rebalanced, 1000, 100, 20)?.head[index]).toBeCloseTo(value, 6));
    const drifting = historicalDecade(resolveInvestment({ kind: "mix", parts, rebalance: false }), 1000, 100, 20);
    const stocks = through(600, 60, Array.from({ length: 10 }, (_, index) => world.get(2000 + index) ?? NaN));
    const bondPart = through(400, 40, Array.from({ length: 10 }, (_, index) => bonds.get(2000 + index) ?? NaN));
    expect(drifting?.head[10]).toBeCloseTo(stocks[10] + bondPart[10], 6);
  });
});
