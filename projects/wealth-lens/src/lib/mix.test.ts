import { describe, expect, it } from "vitest";
import { calculate } from "./calculator";
import { parseDataFile, serializeState } from "./data-file";
import { INITIAL_STATE } from "./app-store";
import { parseIsoDate } from "./dates";
import { SERIES } from "./indexes";
import { resolveInvestment } from "./investment";
import { instrumentById, MARKET } from "./market-data";
import {
  cholesky,
  indexCorrelation,
  mixModel,
  mixPercentiles,
  mixSuccessRates,
  mixVolatility,
  MIX_SIMULATIONS,
  MIX_YEARS,
  partReturns,
  splitEvenly,
  sumsTo100,
  TEMPLATES,
  templateOf,
  worstYear,
  type MixModel,
  type ModelInput,
} from "./mix";
import { mixFigures, successRatesFor } from "./projections";
import { cachedSuccessRate } from "./simulation";
import { DEFAULT_PLAN, parseInvestment } from "./validation";
import { logStats } from "./volatility";

const today = parseIsoDate("2026-09-29");
const model = (parts: ModelInput[], rebalance = false, savingsReturn = -0.005): MixModel => {
  const built = mixModel(parts, rebalance, { savingsReturn });
  if (!built) throw new Error("a valid mix");
  return built;
};
const stock = (id: string) => {
  const instrument = instrumentById(id);
  if (!instrument) throw new Error(`${id} is in the catalogue`);
  return instrument;
};
const amounts = { start: 10_000, monthly: 300, years: 30 };
const sixtyForty = TEMPLATES[2].parts.map((part) => ({ ...part }));

function logCorrelation(a: Float64Array, b: Float64Array): number {
  let sa = 0;
  let sb = 0;
  let sab = 0;
  let saa = 0;
  let sbb = 0;
  for (let i = 0; i < a.length; i++) {
    const x = Math.log1p(a[i]);
    const y = Math.log1p(b[i]);
    sa += x;
    sb += y;
    sab += x * y;
    saa += x * x;
    sbb += y * y;
  }
  const n = a.length;
  return (sab / n - (sa / n) * (sb / n)) / Math.sqrt((saa / n - (sa / n) ** 2) * (sbb / n - (sb / n) ** 2));
}

describe("weights", () => {
  it("must add up to 100%", () => {
    expect(sumsTo100([{ asset: "sp500", weight: 50 }, { asset: "world", weight: 50 }])).toBe(true);
    expect(sumsTo100([{ asset: "sp500", weight: 50 }, { asset: "world", weight: 40 }])).toBe(false);
    expect(sumsTo100([{ asset: "sp500", weight: 33.33 }, { asset: "world", weight: 33.33 }, { asset: "gold", weight: 33.34 }])).toBe(true);
    expect(sumsTo100([])).toBe(false);
  });

  it("split evenly in whole percent that add up to 100", () => {
    const parts = [{ asset: "sp500", weight: 70 }, { asset: "bonds", weight: 20 }, { asset: "gold", weight: 10 }];
    expect(splitEvenly(parts).map((part) => part.weight)).toEqual([34, 33, 33]);
    expect(splitEvenly(parts.slice(0, 2)).map((part) => part.weight)).toEqual([50, 50]);
    expect(sumsTo100(splitEvenly([...parts, { asset: "world", weight: 0 }, { asset: "savings", weight: 0 }, { asset: "nasdaq100", weight: 0 }]))).toBe(true);
  });

  it("set the growth: the weighted average of the parts, a savings part at its rate less inflation", () => {
    const mix = model([{ asset: "sp500", weight: 50 }, { asset: "bonds", weight: 30 }, { asset: "savings", weight: 20 }]);
    const expected = 0.5 * SERIES.sp500.averageReturn + 0.3 * SERIES.bonds.averageReturn + 0.2 * -0.005;
    expect(mix.realReturn).toBeCloseTo(expected, 12);
    const plan = { ...DEFAULT_PLAN, investment: { kind: "mix" as const, parts: [{ asset: "sp500" as const, weight: 50 }, { asset: "bonds" as const, weight: 30 }, { asset: "gold" as const, weight: 20 }], rebalance: false } };
    const { investment, result } = calculate(plan, [], today);
    expect(investment.realReturn).toBeCloseTo(0.5 * SERIES.sp500.averageReturn + 0.3 * SERIES.bonds.averageReturn + 0.2 * SERIES.gold.averageReturn, 12);
    expect(result.lasted).toBe(mixSuccessRates(investment.model ?? model([]), [0.04])[0]);
  });
});

describe("templates", () => {
  it("are 100% stocks, 80/20 and 60/40: world stocks and euro government bonds", () => {
    expect(TEMPLATES.map((template) => template.id)).toEqual(["stocks-100", "80-20", "60-40"]);
    expect(TEMPLATES[0].parts).toEqual([{ asset: "world", weight: 100 }]);
    expect(TEMPLATES[1].parts).toEqual([{ asset: "world", weight: 80 }, { asset: "bonds", weight: 20 }]);
    expect(TEMPLATES[2].parts).toEqual([{ asset: "world", weight: 60 }, { asset: "bonds", weight: 40 }]);
    for (const template of TEMPLATES) expect(sumsTo100(template.parts), template.id).toBe(true);
  });

  it("are recognized whatever the order of the parts, and not once a weight changes", () => {
    expect(templateOf([{ asset: "bonds", weight: 40 }, { asset: "world", weight: 60 }])).toBe(TEMPLATES[2]);
    expect(templateOf([{ asset: "world", weight: 80 }, { asset: "bonds", weight: 20 }])).toBe(TEMPLATES[1]);
    expect(templateOf([{ asset: "world", weight: 70 }, { asset: "bonds", weight: 30 }])).toBeNull();
    expect(templateOf([{ asset: "sp500", weight: 60 }, { asset: "bonds", weight: 40 }])).toBeNull();
  });

  it("grow less than stocks alone the more bonds they hold, and swing less", () => {
    const [stocks, eighty, sixty] = TEMPLATES.map((template) => resolveInvestment({ kind: "mix", parts: [...template.parts], rebalance: true }, []));
    expect(stocks.realReturn).toBeCloseTo(SERIES.world.averageReturn, 12);
    expect(eighty.realReturn).toBeCloseTo(0.8 * SERIES.world.averageReturn + 0.2 * SERIES.bonds.averageReturn, 12);
    expect(sixty.realReturn).toBeCloseTo(0.6 * SERIES.world.averageReturn + 0.4 * SERIES.bonds.averageReturn, 12);
    expect(sixty.realReturn).toBeLessThan(eighty.realReturn);
    expect(eighty.realReturn).toBeLessThan(stocks.realReturn);
    expect(sixty.volatility).toBeLessThan(eighty.volatility);
    expect(eighty.volatility).toBeLessThan(stocks.volatility);
  });

  it("give 60/40 a narrower range and a milder worst year than 100% stocks", () => {
    const stocks = model([...TEMPLATES[0].parts]);
    const sixty = model(sixtyForty);
    const a = mixPercentiles(stocks, amounts);
    const b = mixPercentiles(sixty, amounts);
    expect(b.p90[30] / b.p10[30]).toBeLessThan(a.p90[30] / a.p10[30]);
    expect(worstYear(sixty)?.change).toBeGreaterThan(worstYear(stocks)?.change ?? 0);
  });
});

describe("the model", () => {
  it("draws each asset's own historical years, the same year for every part", () => {
    const [world, bonds, gold] = partReturns(model([{ asset: "world", weight: 40 }, { asset: "bonds", weight: 40 }, { asset: "gold", weight: 20 }]));
    expect(world.length).toBe(MIX_SIMULATIONS * MIX_YEARS);
    // Each simulated year is one historical year, for all three at once.
    const years = SERIES.world.years.map((entry, t) => `${entry.realReturn}|${SERIES.bonds.years[t].realReturn}|${SERIES.gold.years[t].realReturn}`);
    for (let i = 0; i < 300; i++) expect(years).toContain(`${world[i]}|${bonds[i]}|${gold[i]}`);
  });

  it("gives a savings part its rate every year", () => {
    const [, savings] = partReturns(model([{ asset: "world", weight: 50 }, { asset: "savings", weight: 50 }], false, 0.001));
    expect(new Set(savings)).toEqual(new Set([0.001]));
  });

  it("measures a mix's swings over the years, back at its weights each year", () => {
    const sixty = model(sixtyForty, true);
    const yearly = SERIES.world.years.map((entry, t) => 0.6 * entry.realReturn + 0.4 * SERIES.bonds.years[t].realReturn);
    expect(mixVolatility(sixty)).toBeCloseTo(logStats(yearly).deviation, 12);
    expect(mixVolatility(model([{ asset: "savings", weight: 100 }]))).toBe(0);
  });

  it("gives a stock (in My portfolio) its own volatility and its measured link with its index", () => {
    const [nasdaq, nvidia] = partReturns(model([{ asset: "nasdaq100", weight: 50 }, { asset: "nasdaq100", weight: 50, stock: stock("NVDA") }]));
    const volatility = MARKET.prices.NVDA.stats?.volatility ?? 0;
    const spread = Math.sqrt([...nvidia].reduce((sum, value) => sum + Math.log1p(value) ** 2, 0) / nvidia.length - ([...nvidia].reduce((sum, value) => sum + Math.log1p(value), 0) / nvidia.length) ** 2);
    expect(spread / volatility).toBeGreaterThan(0.93);
    expect(spread / volatility).toBeLessThan(1.07);
    expect(logCorrelation(nasdaq, nvidia)).toBeCloseTo(indexCorrelation(stock("NVDA")) ?? 0, 1);
  });

  it("links two stocks as much as their weekly returns did", () => {
    const [nvidia, broadcom] = partReturns(
      model([
        { asset: "nasdaq100", weight: 50, stock: stock("NVDA") },
        { asset: "nasdaq100", weight: 50, stock: stock("AVGO") },
      ]),
    );
    const table = MARKET.correlations;
    const measured = table ? (table.matrix[table.ids.indexOf("NVDA")][table.ids.indexOf("AVGO")] ?? 0) : 0;
    expect(Math.abs(logCorrelation(nvidia, broadcom) - measured)).toBeLessThan(0.08);
  });

  it("a whole asset as a mix behaves like that asset", () => {
    for (const asset of ["sp500", "bonds", "gold"] as const) {
      const [lasted] = mixSuccessRates(model([{ asset, weight: 100 }]), [0.04]);
      const reference = cachedSuccessRate(`asset:${asset}`, SERIES[asset].years.map((entry) => entry.realReturn), 0.04);
      expect(Math.abs(lasted - reference), asset).toBeLessThan(0.03);
    }
  });

  it("has a valid Cholesky factor, and none for an impossible matrix", () => {
    expect(cholesky([[1, 0.5], [0.5, 1]])).not.toBeNull();
    expect(cholesky([[1, 0.9, -0.9], [0.9, 1, 0.9], [-0.9, 0.9, 1]])).toBeNull();
  });
});

describe("drifting weights against rebalancing every year", () => {
  const parts: ModelInput[] = [{ asset: "nasdaq100", weight: 50 }, { asset: "gold", weight: 50 }];

  it("give different outcomes: drift lets the part that grows most take over", () => {
    const drift = mixPercentiles(model(parts, false), amounts);
    const rebalance = mixPercentiles(model(parts, true), amounts);
    expect(drift.p90[30]).toBeGreaterThan(rebalance.p90[30]);
    expect(drift.p50[30]).not.toBeCloseTo(rebalance.p50[30], 0);
  });

  it("are the same for a single part", () => {
    const one: ModelInput[] = [{ asset: "world", weight: 100 }];
    expect(mixPercentiles(model(one, false), amounts)).toEqual(mixPercentiles(model(one, true), amounts));
    expect(mixSuccessRates(model(one, false), [0.04])[0]).toBeCloseTo(mixSuccessRates(model(one, true), [0.04])[0], 10);
  });
});

describe("the worst year in the data", () => {
  it("is an asset's worst year over its whole dataset", () => {
    const worst = worstYear(model([{ asset: "sp500", weight: 100 }]));
    const lowest = Math.min(...SERIES.sp500.dataset.years.map((entry) => entry.realReturn));
    expect(worst?.change).toBe(lowest);
    expect(worst?.from).toBe(SERIES.sp500.dataset.firstYear);
  });

  it("for 60/40 is 2022, when stocks and bonds fell together", () => {
    const worst = worstYear(model(sixtyForty));
    expect(worst).toMatchObject({ year: 2022, from: 1988, to: 2024 });
    const expected = 0.6 * (SERIES.world.dataset.years.find((entry) => entry.year === 2022)?.realReturn ?? 0) + 0.4 * (SERIES.bonds.dataset.years.find((entry) => entry.year === 2022)?.realReturn ?? 0);
    expect(worst?.change).toBeCloseTo(expected, 12);
  });

  it("counts a savings part at its rate, and has none for savings alone", () => {
    const half = worstYear(model([{ asset: "gold", weight: 50 }, { asset: "savings", weight: 50 }], false, 0));
    const gold = worstYear(model([{ asset: "gold", weight: 100 }]));
    expect(half?.year).toBe(gold?.year);
    expect(half?.change).toBeCloseTo((gold?.change ?? 0) / 2, 12);
    expect(worstYear(model([{ asset: "savings", weight: 100 }]))).toBeNull();
  });

  it("with a stock, only covers the years both have, after inflation", () => {
    const worst = worstYear(model([{ asset: "sp500", weight: 80 }, { asset: "nasdaq100", weight: 20, stock: stock("NVDA") }]));
    expect(worst).toMatchObject({ from: 2017, to: 2022, year: 2022 });
    expect(worst?.change).toBeLessThan(-0.2);
  });
});

describe("the figures shown beside a mix", () => {
  const mix = { kind: "mix" as const, parts: [{ asset: "world" as const, weight: 50 }, { asset: "bonds" as const, weight: 30 }, { asset: "gold" as const, weight: 20 }], rebalance: false };

  it("give the range of 8 in 10 and the worst year, with the S&P 500 alone over the same years", () => {
    const investment = resolveInvestment(mix, []);
    const figures = mixFigures(investment, amounts);
    expect(figures?.range[0]).toBeLessThan(figures?.range[1] ?? 0);
    expect(figures?.worst).toMatchObject({ from: 1988, to: 2022 });
    expect(figures?.reference.worst).toMatchObject({ from: 1988, to: 2022, year: 2008 });
    expect(successRatesFor(investment, [0.04])[0]).toBeGreaterThan(0);
    // No figures for a single asset.
    expect(mixFigures(resolveInvestment({ kind: "asset", asset: "sp500" }, []), amounts)).toBeNull();
  });

  it("are worked out again in well under 16 ms once the parts are drawn", () => {
    mixFigures(resolveInvestment(mix, []), amounts);
    const again = resolveInvestment({ ...mix, parts: [{ asset: "world", weight: 40 }, { asset: "bonds", weight: 40 }, { asset: "gold", weight: 20 }], rebalance: true }, []);
    // The fastest of several runs: other tests share the machine and can slow any single one.
    const times: number[] = [];
    for (let i = 0; i < 8; i++) {
      const start = performance.now();
      mixFigures(again, { ...amounts, monthly: 300 + i });
      successRatesFor(again, [0.03, 0.04, 0.05]);
      times.push(performance.now() - start);
    }
    expect(Math.min(...times)).toBeLessThan(16);
  });
});

describe("a mix in a data file", () => {
  it("is read back as saved, dropping parts that point at nothing", () => {
    expect(
      parseInvestment({
        kind: "mix",
        parts: [
          { asset: "sp500", weight: 50 },
          { asset: "bonds", weight: 50 },
          { asset: "moon", weight: 10 },
          { asset: "world", weight: 120 },
        ],
        rebalance: true,
      }),
    ).toEqual({ kind: "mix", parts: [{ asset: "sp500", weight: 50 }, { asset: "bonds", weight: 50 }], rebalance: true });
    expect(parseInvestment({ kind: "mix", parts: [] })).toBeNull();
    expect(parseInvestment({ kind: "mix", parts: [{ asset: "gold", weight: 100 }] })).toEqual({
      kind: "mix",
      parts: [{ asset: "gold", weight: 100 }],
      rebalance: false,
    });
  });

  it("goes through Download and Load my data", () => {
    const state = { ...INITIAL_STATE, plan: { ...INITIAL_STATE.plan, investment: { kind: "mix" as const, parts: sixtyForty, rebalance: true } } };
    expect(parseDataFile(serializeState(state, today))).toEqual({ ok: true, state, notices: [] });
  });
});
