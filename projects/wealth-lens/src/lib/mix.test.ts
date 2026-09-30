import { describe, expect, it } from "vitest";
import { calculate } from "./calculator";
import { parseDataFile, serializeState } from "./data-file";
import { INITIAL_STATE } from "./app-store";
import { parseIsoDate } from "./dates";
import { INDEXES } from "./indexes";
import { resolveInvestment } from "./investment";
import { instrumentById, MARKET } from "./market-data";
import {
  cholesky,
  indexCorrelation,
  mixModel,
  mixPercentiles,
  mixSuccessRates,
  MIX_SIMULATIONS,
  MIX_YEARS,
  partReturns,
  splitEvenly,
  sumsTo100,
  worstYear,
  type MixModel,
} from "./mix";
import { mixFigures, successRatesFor } from "./projections";
import { cachedSuccessRate } from "./simulation";
import type { MixPart } from "./types";
import { parseInvestment } from "./validation";

const today = parseIsoDate("2026-09-29");
const model = (parts: MixPart[], rebalance = false): MixModel => {
  const built = mixModel(parts, rebalance);
  if (!built) throw new Error("a valid mix");
  return built;
};
const amounts = { start: 10_000, monthly: 300, years: 30 };

/** Standard deviation of log(1 + r) over every simulated year. */
function logSpread(values: Float64Array): number {
  let sum = 0;
  let squares = 0;
  for (const value of values) {
    const log = Math.log1p(value);
    sum += log;
    squares += log * log;
  }
  const mean = sum / values.length;
  return Math.sqrt(squares / values.length - mean * mean);
}

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
    expect(sumsTo100([{ ref: "index:sp500", weight: 50 }, { ref: "index:world", weight: 50 }])).toBe(true);
    expect(sumsTo100([{ ref: "index:sp500", weight: 50 }, { ref: "index:world", weight: 40 }])).toBe(false);
    expect(sumsTo100([{ ref: "index:sp500", weight: 33.33 }, { ref: "index:world", weight: 33.33 }, { ref: "stock:NVDA", weight: 33.34 }])).toBe(true);
    expect(sumsTo100([])).toBe(false);
  });

  it("split evenly in whole percent that add up to 100", () => {
    const parts = [{ ref: "index:sp500", weight: 70 }, { ref: "index:world", weight: 20 }, { ref: "stock:NVDA", weight: 10 }];
    expect(splitEvenly(parts).map((part) => part.weight)).toEqual([34, 33, 33]);
    expect(splitEvenly(parts.slice(0, 2)).map((part) => part.weight)).toEqual([50, 50]);
    expect(sumsTo100(splitEvenly([...parts, { ref: "stock:AAPL", weight: 0 }, { ref: "stock:MSFT", weight: 0 }, { ref: "stock:TSLA", weight: 0 }]))).toBe(true);
  });

  it("set the growth: the weighted average of the indexes behind the parts", () => {
    const mix = model([{ ref: "index:sp500", weight: 50 }, { ref: "index:world", weight: 30 }, { ref: "stock:NVDA", weight: 20 }]);
    const expected = 0.5 * INDEXES.sp500.averageReturn + 0.3 * INDEXES.world.averageReturn + 0.2 * INDEXES.nasdaq100.averageReturn;
    expect(mix.realReturn).toBeCloseTo(expected, 12);
    const plan = { invested: 1000, monthlyContribution: 200, years: 20, withdrawalRate: 0.04, goals: [] };
    const { investment, result } = calculate({ ...plan, investment: { kind: "mix", parts: [{ ref: "index:sp500", weight: 50 }, { ref: "index:world", weight: 30 }, { ref: "stock:NVDA", weight: 20 }], rebalance: false } }, [], today);
    expect(investment.realReturn).toBeCloseTo(expected, 12);
    expect(result.lasted).toBe(mixSuccessRates(mix, [0.04])[0]);
  });
});

describe("the model", () => {
  it("draws each index's own historical years", () => {
    const [sp500] = partReturns(model([{ ref: "index:sp500", weight: 100 }]));
    const history = new Set(INDEXES.sp500.years.map((entry) => entry.realReturn));
    expect(sp500.length).toBe(MIX_SIMULATIONS * MIX_YEARS);
    expect([...sp500.slice(0, 500)].every((value) => history.has(value))).toBe(true);
  });

  it("gives a stock its own volatility and its measured link with its index", () => {
    const mix = model([{ ref: "index:nasdaq100", weight: 50 }, { ref: "stock:NVDA", weight: 50 }]);
    const [nasdaq, nvidia] = partReturns(mix);
    const volatility = MARKET.prices.NVDA.stats?.volatility ?? 0;
    expect(logSpread(nvidia) / volatility).toBeGreaterThan(0.93);
    expect(logSpread(nvidia) / volatility).toBeLessThan(1.07);
    const nvda = instrumentById("NVDA");
    if (!nvda) throw new Error("NVDA is in the catalogue");
    const rho = indexCorrelation(nvda) ?? 0;
    expect(logCorrelation(nasdaq, nvidia)).toBeCloseTo(rho, 1);
  });

  it("links two stocks as much as their weekly returns did", () => {
    const [nvidia, broadcom] = partReturns(model([{ ref: "stock:NVDA", weight: 50 }, { ref: "stock:AVGO", weight: 50 }]));
    const table = MARKET.correlations;
    const measured = table ? table.matrix[table.ids.indexOf("NVDA")][table.ids.indexOf("AVGO")] ?? 0 : 0;
    expect(Math.abs(logCorrelation(nvidia, broadcom) - measured)).toBeLessThan(0.08);
  });

  it("a whole index as a mix behaves like that index", () => {
    const sp500 = model([{ ref: "index:sp500", weight: 100 }]);
    const [lasted] = mixSuccessRates(sp500, [0.04]);
    const reference = cachedSuccessRate("index:sp500", INDEXES.sp500.years.map((entry) => entry.realReturn), 0.04);
    expect(Math.abs(lasted - reference)).toBeLessThan(0.03);
  });

  it("has a valid Cholesky factor, and none for an impossible matrix", () => {
    expect(cholesky([[1, 0.5], [0.5, 1]])).not.toBeNull();
    expect(cholesky([[1, 0.9, -0.9], [0.9, 1, 0.9], [-0.9, 0.9, 1]])).toBeNull();
  });
});

describe("drifting weights against rebalancing every year", () => {
  const parts = [{ ref: "index:world", weight: 50 }, { ref: "stock:NVDA", weight: 50 }];

  it("give different outcomes: drift lets the part that grows most take over", () => {
    const drift = mixPercentiles(model(parts, false), amounts);
    const rebalance = mixPercentiles(model(parts, true), amounts);
    expect(drift.p90[30]).toBeGreaterThan(rebalance.p90[30]);
    expect(drift.p50[30]).not.toBeCloseTo(rebalance.p50[30], 0);
  });

  it("are the same for a single part", () => {
    const one = [{ ref: "index:world", weight: 100 }];
    expect(mixPercentiles(model(one, false), amounts)).toEqual(mixPercentiles(model(one, true), amounts));
    expect(mixSuccessRates(model(one, false), [0.04])[0]).toBeCloseTo(mixSuccessRates(model(one, true), [0.04])[0], 10);
  });
});

describe("diversifying", () => {
  const nvidiaAlone = model([{ ref: "stock:NVDA", weight: 100 }]);
  const withIndexes = model([{ ref: "index:sp500", weight: 50 }, { ref: "index:world", weight: 30 }, { ref: "stock:NVDA", weight: 20 }]);

  it("narrows the range and lifts the bad outcomes", () => {
    const alone = mixPercentiles(nvidiaAlone, amounts);
    const mixed = mixPercentiles(withIndexes, amounts);
    expect(mixed.p90[30] / mixed.p10[30]).toBeLessThan(alone.p90[30] / alone.p10[30] / 2);
    expect(mixed.p10[30]).toBeGreaterThan(alone.p10[30]);
  });

  it("softens the worst year in the data, and lasts more often", () => {
    const alone = worstYear(nvidiaAlone);
    const mixed = worstYear(withIndexes);
    expect(alone?.change).toBeLessThan(mixed?.change ?? 0);
    expect(mixSuccessRates(withIndexes, [0.04])[0]).toBeGreaterThan(mixSuccessRates(nvidiaAlone, [0.04])[0]);
  });
});

describe("the worst year in the data", () => {
  it("is an index's worst year over its whole dataset", () => {
    const worst = worstYear(model([{ ref: "index:sp500", weight: 100 }]));
    const lowest = Math.min(...INDEXES.sp500.dataset.years.map((entry) => entry.realReturn));
    expect(worst?.change).toBe(lowest);
    expect(worst?.from).toBe(INDEXES.sp500.dataset.firstYear);
  });

  it("with a stock, only covers the years both have, after inflation", () => {
    const worst = worstYear(model([{ ref: "index:sp500", weight: 80 }, { ref: "stock:NVDA", weight: 20 }]));
    expect(worst?.from).toBe(2017);
    expect(worst?.to).toBe(2022);
    expect(worst?.year).toBe(2022);
    expect(worst?.change).toBeLessThan(-0.2);
  });
});

describe("the figures shown beside a mix", () => {
  it("give the range of 8 in 10 and the worst year, with the S&P 500 alone over the same years", () => {
    const investment = resolveInvestment({ kind: "mix", parts: [{ ref: "index:sp500", weight: 50 }, { ref: "index:world", weight: 30 }, { ref: "stock:NVDA", weight: 20 }], rebalance: false }, []);
    const figures = mixFigures(investment, amounts);
    expect(figures?.range[0]).toBeLessThan(figures?.range[1] ?? 0);
    expect(figures?.worst?.from).toBe(figures?.reference.worst?.from);
    expect(figures?.worst?.to).toBe(figures?.reference.worst?.to);
    expect(successRatesFor(investment, [0.04])[0]).toBeGreaterThan(0);
    // No figures for a plain index.
    expect(mixFigures(resolveInvestment({ kind: "index", index: "sp500" }, []), amounts)).toBeNull();
  });

  it("are worked out again in well under 16 ms once the parts are drawn", () => {
    const investment = resolveInvestment({ kind: "mix", parts: [{ ref: "index:sp500", weight: 50 }, { ref: "index:world", weight: 30 }, { ref: "stock:NVDA", weight: 20 }], rebalance: false }, []);
    mixFigures(investment, amounts);
    const again = resolveInvestment({ kind: "mix", parts: [{ ref: "index:sp500", weight: 40 }, { ref: "index:world", weight: 40 }, { ref: "stock:NVDA", weight: 20 }], rebalance: true }, []);
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
          { ref: "index:sp500", weight: 50 },
          { ref: "stock:NVDA", weight: 50 },
          { ref: "stock:NVDA", weight: 10 },
          { ref: "stock:GONE", weight: 10 },
          { ref: "index:moon", weight: 10 },
          { ref: "index:world", weight: 120 },
        ],
        rebalance: true,
      }),
    ).toEqual({ kind: "mix", parts: [{ ref: "index:sp500", weight: 50 }, { ref: "stock:NVDA", weight: 50 }], rebalance: true });
    expect(parseInvestment({ kind: "mix", parts: [] })).toBeNull();
    expect(parseInvestment({ kind: "mix", parts: [{ ref: "index:sp500", weight: 100 }] })).toEqual({
      kind: "mix",
      parts: [{ ref: "index:sp500", weight: 100 }],
      rebalance: false,
    });
  });

  it("goes through Download and Load my data", () => {
    const state = {
      ...INITIAL_STATE,
      plan: { ...INITIAL_STATE.plan, investment: { kind: "mix" as const, parts: [{ ref: "index:sp500", weight: 50 }, { ref: "index:world", weight: 30 }, { ref: "stock:NVDA", weight: 20 }], rebalance: true } },
    };
    expect(parseDataFile(serializeState(state, today))).toEqual({ ok: true, state });
  });
});
