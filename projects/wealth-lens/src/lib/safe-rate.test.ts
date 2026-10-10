import { describe, expect, it } from "vitest";
import { maxRate, safeRate } from "@seed-kit/withdrawal-rate.ts";
import { SERIES } from "./indexes";
import { resolveInvestment, STANDARD_SETTINGS } from "./investment";
import { assetSafeRate, earlyFall, floorRate, RETIREMENT_YEARS, safeRateFor, similarAsset, worstFall } from "./safe-rate";
import { STANDARD_ASSUMPTIONS } from "./types";

const resolve = (investment: Parameters<typeof resolveInvestment>[0], assumptions = STANDARD_ASSUMPTIONS) => resolveInvestment(investment, { ...STANDARD_SETTINGS, assumptions });

describe("the most that lasted 30 years, for each investment", () => {
  it("US stocks: their whole history from 1928, 30 years from every start, the worst in 1929", () => {
    const info = safeRateFor(resolve({ kind: "asset", asset: "sp500" }));
    expect(info.kind).toBe("history");
    if (info.kind !== "history") return;
    expect(info.from).toBe(SERIES.sp500.dataset.firstYear);
    expect(info.years).toBe(RETIREMENT_YEARS);
    expect(info.periods).toBe(SERIES.sp500.dataset.years.length - RETIREMENT_YEARS + 1);
    expect(info.few).toBe(false);
    expect(info.worstStart).toBe(1929);
    // For 100 % US stocks with Shiller's data: a little under the "about 4 %" Bengen found for 50–75 % stocks.
    expect(info.rate).toBeGreaterThan(0.035);
    expect(info.rate).toBeLessThan(0.04);
  });

  it("bonds and gold: data from 1988 only, so few periods, and it says so", () => {
    for (const asset of ["bonds", "gold"] as const) {
      const info = safeRateFor(resolve({ kind: "asset", asset }));
      expect(info.kind).toBe("history");
      if (info.kind !== "history") continue;
      expect(info.few).toBe(true);
      expect(info.periods).toBeLessThan(10);
    }
  });

  it("is the same as the engine on the asset's own years, made once", () => {
    expect(assetSafeRate("gold")).toEqual(safeRate(SERIES.gold.dataset.years, RETIREMENT_YEARS));
    expect(assetSafeRate("gold")).toBe(assetSafeRate("gold"));
  });

  it("a savings account: the same growth every year, one answer", () => {
    const savings = resolve({ kind: "asset", asset: "savings" });
    const info = safeRateFor(savings);
    expect(info).toEqual({ kind: "steady", rate: floorRate(maxRate(Array(RETIREMENT_YEARS).fill(savings.realReturn))), years: RETIREMENT_YEARS });
  });

  it("a mix: its parts back to their weights each year, over the years they share", () => {
    const mix = resolve({ kind: "mix", parts: [{ asset: "sp500", weight: 60 }, { asset: "bonds", weight: 40 }], rebalance: true });
    const info = safeRateFor(mix);
    expect(info.kind).toBe("history");
    if (info.kind !== "history") return;
    expect(info.from).toBe(1988);
    const sp = new Map(SERIES.sp500.dataset.years.map((entry) => [entry.year, entry.realReturn]));
    const bonds = new Map(SERIES.bonds.dataset.years.map((entry) => [entry.year, entry.realReturn]));
    const years = [...bonds.keys()].filter((year) => sp.has(year));
    const expected = safeRate(years.map((year) => ({ year, realReturn: 0.6 * sp.get(year)! + 0.4 * bonds.get(year)! })), RETIREMENT_YEARS);
    expect(info.rate).toBe(floorRate(expected.rate));
  });

  it("my own growth: no history; the most similar asset's rate as a start, and its worst year", () => {
    const own = resolve({ kind: "custom" }, { ...STANDARD_ASSUMPTIONS, growth: 0.05 });
    const info = safeRateFor(own);
    expect(info.kind).toBe("own");
    if (info.kind !== "own") return;
    expect(info.similar).toBe("sp500");
    expect(info.rate).toBe(floorRate(assetSafeRate("sp500").rate));
    expect(info.start).toBe("sp500");
    expect(info.fall).toEqual(worstFall("sp500"));
    expect(info.fall.change).toBeLessThan(-0.3);
  });

  it("my own growth with no ups and downs: one answer, like savings", () => {
    const flat = resolve({ kind: "custom" }, { ...STANDARD_ASSUMPTIONS, growth: 0.03, volatility: 0 });
    expect(safeRateFor(flat)).toMatchObject({ kind: "steady" });
  });

  it("finds the asset with the nearest swings", () => {
    expect(similarAsset({ realReturn: 0.05, volatility: 0.17 })).toBe("sp500");
    expect(similarAsset({ realReturn: 0.02, volatility: 0.05 })).not.toBe("sp500");
  });
});

describe("a fall at the start, for my own growth", () => {
  it("lasts less with a high rate than with a low one", () => {
    const info = safeRateFor(resolve({ kind: "custom" }, { ...STANDARD_ASSUMPTIONS, growth: 0.05 }));
    if (info.kind !== "own") throw new Error("expected own growth");
    const low = earlyFall(info, 0.03, 0.05);
    const high = earlyFall(info, 0.07, 0.05);
    expect(low.lastsAll).toBe(true);
    expect(high.lastsAll).toBe(false);
    expect(high.lasted).toBeLessThan(RETIREMENT_YEARS);
  });
});

describe("the plan's withdrawal rate", () => {
  it("is the data's for its investment until the user picks one, and the calculation uses it", async () => {
    const { calculate } = await import("./calculator");
    const { planWithdrawalRate } = await import("./safe-rate");
    const { SP500_PLAN } = await import("./sp500-plan");
    const today = new Date(Date.UTC(2026, 9, 9));
    const stocks = { ...SP500_PLAN, withdrawalRate: null };
    expect(planWithdrawalRate(stocks)).toBe(floorRate(assetSafeRate("sp500").rate));
    expect(calculate(stocks, today).scenario.withdrawalRate).toBe(floorRate(assetSafeRate("sp500").rate));
    expect(calculate({ ...stocks, investment: { kind: "asset", asset: "gold" } }, today).scenario.withdrawalRate).toBe(floorRate(assetSafeRate("gold").rate));
    expect(calculate({ ...stocks, withdrawalRate: 0.05 }, today).scenario.withdrawalRate).toBe(0.05);
    // A "What if…?" changes the look, not the data's rate.
    expect(calculate(stocks, today, "grow-more").scenario.withdrawalRate).toBe(floorRate(assetSafeRate("sp500").rate));
  });
});

describe("the figures research/wealth-lens/tasa-de-retiro.md quotes (a data update that moves them must update the sheet)", () => {
  it("US stocks, bonds, gold, 60/40 and savings", () => {
    const pct = (rate: number) => Math.round(rate * 10_000) / 100;
    expect([pct(assetSafeRate("sp500").rate), assetSafeRate("sp500").worstStart, assetSafeRate("sp500").periods]).toEqual([3.78, 1929, 66]);
    expect([pct(assetSafeRate("bonds").rate), assetSafeRate("bonds").worstStart, assetSafeRate("bonds").periods]).toEqual([5.56, 1994, 8]);
    expect([pct(assetSafeRate("gold").rate), assetSafeRate("gold").worstStart, assetSafeRate("gold").periods]).toEqual([2.22, 1988, 8]);
    const mix = safeRateFor(resolve({ kind: "mix", parts: [{ asset: "sp500", weight: 60 }, { asset: "bonds", weight: 40 }], rebalance: true }));
    expect(mix.kind === "history" ? [pct(mix.rate), mix.worstStart, mix.periods] : null).toEqual([7.58, 1990, 6]);
    expect(pct(safeRateFor(resolve({ kind: "asset", asset: "savings" })).rate)).toBe(3.1);
  });

  it("rounds a rate down to a hundredth of a percent", () => {
    expect(floorRate(0.037819)).toBe(0.0378);
    expect(floorRate(0.05)).toBe(0.05);
    // Noise a float leaves below a round rate is not a hundredth of a percent less.
    expect(floorRate(0.0499999999999999)).toBe(0.05);
    expect(floorRate(0.04989)).toBe(0.0498);
  });
});
