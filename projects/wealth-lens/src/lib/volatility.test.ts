import { describe, expect, it } from "vitest";
import { calculate, type CalculatorPlan } from "./calculator";
import { parseIsoDate } from "./dates";
import { annualizedReturn, INDEXES } from "./indexes";
import { assumptionLines, fromStock, resolveInvestment } from "./investment";
import { instrumentById, MARKET } from "./market-data";
import { successRates } from "./monte-carlo";
import { wealthPercentiles } from "./simulation";
import { FALLBACK_FACTOR, indexVolatility, logStats, MIN_DATA_YEARS, scaleVolatility, stockVolatility } from "./volatility";

const today = parseIsoDate("2026-09-29");
const plan = (investment: CalculatorPlan["investment"]): CalculatorPlan => ({
  invested: 10_000,
  monthlyContribution: 300,
  investment,
  years: 20,
  withdrawalRate: 0.04,
  goals: [],
});

describe("scaling an index's years to a stock's volatility", () => {
  const nasdaq = INDEXES.nasdaq100.years.map((entry) => entry.realReturn);

  it("keeps the geometric average and multiplies the spread", () => {
    const scaled = scaleVolatility(nasdaq, 1.7);
    expect(annualizedReturn(scaled)).toBeCloseTo(annualizedReturn(nasdaq), 12);
    expect(logStats(scaled).deviation).toBeCloseTo(logStats(nasdaq).deviation * 1.7, 12);
    // Good years get better and bad years worse, in the same order.
    const best = nasdaq.indexOf(Math.max(...nasdaq));
    const worst = nasdaq.indexOf(Math.min(...nasdaq));
    expect(scaled[best]).toBeGreaterThan(nasdaq[best]);
    expect(scaled[worst]).toBeLessThan(nasdaq[worst]);
    expect(scaled.every((value) => value > -1)).toBe(true);
  });
});

describe("NVIDIA against the Nasdaq-100, same plan", () => {
  const nvidia = resolveInvestment({ kind: "stock", id: "NVDA" }, []);
  const nasdaq = resolveInvestment({ kind: "index", index: "nasdaq100" }, []);
  const band = (investment: typeof nvidia) =>
    wealthPercentiles({ start: 10_000, monthly: 300, returns: investment.returns, years: 20, key: investment.key });

  it("uses NVIDIA's own volatility, measured from its daily closes", () => {
    const stats = MARKET.prices.NVDA.stats;
    expect(nvidia.stock).toMatchObject({ id: "NVDA", index: "nasdaq100", fallback: false, volatility: stats?.volatility });
    expect(nvidia.stock?.volatility).toBeGreaterThan(nvidia.stock?.indexVolatility ?? Infinity);
  });

  it("grows at the Nasdaq-100's average: the same projection", () => {
    expect(nvidia.realReturn).toBe(nasdaq.realReturn);
    expect(nvidia.growthSource).toBe("Nasdaq-100");
    expect(calculate(plan(nvidia.investment), [], today).result.total).toBeCloseTo(calculate(plan(nasdaq.investment), [], today).result.total, 6);
  });

  it("has the same middle outcome but a much wider band", () => {
    const own = band(nvidia);
    const index = band(nasdaq);
    // A sum invested once: the same median, within 2%.
    const once = (investment: typeof nvidia) => wealthPercentiles({ start: 10_000, monthly: 0, returns: investment.returns, years: 20, key: investment.key });
    expect(once(nvidia).p50[20] / once(nasdaq).p50[20]).toBeCloseTo(1, 1);
    expect(Math.abs(once(nvidia).p50[20] / once(nasdaq).p50[20] - 1)).toBeLessThan(0.02);
    // Adding money every month lifts the middle a little with the wider spread (years bought low weigh more), never down.
    expect(own.p50[20] / index.p50[20]).toBeGreaterThan(1);
    expect(own.p50[20] / index.p50[20]).toBeLessThan(1.25);
    expect(own.p90[20] - own.p10[20]).toBeGreaterThan(1.5 * (index.p90[20] - index.p10[20]));
    // More chance of ending far down.
    expect(own.p10[20]).toBeLessThan(index.p10[20] * 0.8);
  });

  it("lasts less often at the same withdrawal rate", () => {
    const [own] = successRates({ withdrawalRates: [0.04], returns: nvidia.returns });
    const [index] = successRates({ withdrawalRates: [0.04], returns: nasdaq.returns });
    expect(own).toBeLessThan(index - 0.05);
    expect(calculate(plan(nvidia.investment), [], today).result.lasted).toBe(own);
  });

  it("says exactly which model the figures come from", () => {
    expect(nvidia.modelText).toBe(`simulations using Nasdaq-100 years scaled to NVIDIA's volatility (${Math.round((nvidia.stock?.volatility ?? 0) * 100)}% a year)`);
    expect(nasdaq.modelText).toBe("Nasdaq-100 histories");
    const lines = assumptionLines(nvidia);
    expect(lines[0]).toMatch(/^Growth: Nasdaq-100 average, 9\.9% a year after inflation, 1988–2022 average .*One stock's future can't be predicted\.$/);
    expect(lines[1]).toMatch(/^Ups and downs: NVIDIA's own, \d+% a year \(daily closes 2016–2026\), against \d+% for the Nasdaq-100\.$/);
    expect(lines[2]).toMatch(/^Past 10 years: \+\d+% a year \(price, before inflation\)\. Past, not a forecast\.$/);
  });
});

describe("a stock with little data", () => {
  const nvda = instrumentById("NVDA");
  const short = {
    ...MARKET,
    prices: {
      ...MARKET.prices,
      NVDA: { ...MARKET.prices.NVDA, stats: { from: "2025-06-02", to: "2026-09-29", volatility: 0.9, years: {} }, growth: { from: "2025-06-02", perYear: 1.2 } },
    },
  };

  it(`under ${MIN_DATA_YEARS} years, swings ${FALLBACK_FACTOR} times as much as its index, and says so`, () => {
    if (!nvda) throw new Error("NVDA is in the catalogue");
    const own = stockVolatility(nvda, short);
    expect(own).toMatchObject({ fallback: true, volatility: indexVolatility("nasdaq100") * FALLBACK_FACTOR });
    const resolved = fromStock(nvda, { kind: "stock", id: "NVDA" }, short);
    expect(resolved.modelText).toMatch(/twice its ups and downs \(too little data for NVIDIA\)/);
    expect(assumptionLines(resolved)[1]).toMatch(/^Ups and downs: only 16 months of closes for NVIDIA, so they are taken as twice the Nasdaq-100's/);
  });

  it("with no data at all, still has a figure", () => {
    if (!nvda) throw new Error("NVDA is in the catalogue");
    const none = { ...MARKET, prices: {} };
    expect(stockVolatility(nvda, none)).toMatchObject({ fallback: true, dataYears: 0 });
    expect(fromStock(nvda, { kind: "stock", id: "NVDA" }, none).stock?.past).toBeNull();
  });
});
