import { describe, expect, it } from "vitest";
import { EN, getI18n } from "@/i18n";
import { investmentName, mixPartName, stockPartDetail } from "@/i18n/investment-text";
import { INITIAL_STATE } from "./app-store";
import { calculate } from "./calculator";
import { parseDataFile, serializeState } from "./data-file";
import { parseIsoDate } from "./dates";
import { SERIES } from "./indexes";
import { resolveInvestment, toNominal } from "./investment";
import { instrumentById } from "./market-data";
import { CONCENTRATION_LIMIT, concentration, concentrationEffect, mixPartKey, partReturns, templateOf } from "./mix";
import { mixFigures } from "./projections";
import { STANDARD_ASSUMPTIONS, type Investment, type MixPart } from "./types";

const ES = getI18n("es");
const plain = (text: string) => text.replace(/[  ]/g, " ");
const amounts = { start: 1000, monthly: 200, years: 20 };
const today = parseIsoDate("2026-09-30");

/** World and a stock of the list, with the stock's weight in percent. */
const withStock = (stock: string, weight: number, rest: MixPart["asset"] = "world"): Investment => {
  const instrument = instrumentById(stock);
  if (!instrument) throw new Error(stock);
  return {
    kind: "mix",
    parts: [
      { asset: rest, weight: 100 - weight },
      { asset: instrument.index, weight, stock },
    ],
    rebalance: false,
  };
};
/** The same mix with the stock's index in its place. */
const withIndex = (stock: string, weight: number): Investment => {
  const instrument = instrumentById(stock)!;
  return { kind: "mix", parts: [{ asset: "world", weight: 100 - weight }, { asset: instrument.index, weight }], rebalance: false };
};

describe("a mix with a stock of the list", () => {
  it("lets the stock grow like its index, so the projection is the same as with the index", () => {
    const mix = resolveInvestment(withStock("NVDA", 40), []);
    expect(mix.realReturn).toBeCloseTo(0.6 * SERIES.world.averageReturn + 0.4 * SERIES.nasdaq100.averageReturn, 12);
    expect(mix.realReturn).toBeCloseTo(resolveInvestment(withIndex("NVDA", 40), []).realReturn, 12);
    expect(mix.model?.parts[1]).toMatchObject({ kind: "stock", asset: "nasdaq100", instrument: { id: "NVDA" } });
  });

  it("gives the stock its index's expected growth a year in the simulations, and its own bigger ups and downs", () => {
    const model = resolveInvestment(withStock("NVDA", 40), []).model!;
    const stock = partReturns(model)[1];
    const index = SERIES.nasdaq100.years.map((entry) => entry.realReturn);
    const mean = (values: ArrayLike<number>) => Array.from(values).reduce((sum, value) => sum + value, 0) / values.length;
    const geometric = (values: ArrayLike<number>) => Math.expm1(mean(Array.from(values, (value) => Math.log1p(value))));
    // 60,000 simulated years: the same average a year as the index, to about a point.
    expect(mean(stock)).toBeCloseTo(mean(index), 1);
    // Its typical year grows much less: about ±50% a year against the index's ±30%.
    expect(geometric(stock)).toBeLessThan(geometric(index) - 0.04);
  });

  it("moves more than the same mix with the index, and so does its range", () => {
    const stock = resolveInvestment(withStock("NVDA", 40), []);
    const index = resolveInvestment(withIndex("NVDA", 40), []);
    expect(stock.volatility).toBeGreaterThan(index.volatility);
    const a = mixFigures(stock, amounts)!;
    const b = mixFigures(index, amounts)!;
    expect(a.range[1] / a.range[0]).toBeGreaterThan(b.range[1] / b.range[0]);
  });

  it("is told apart from its index: both can be in one mix", () => {
    const both: Investment = { kind: "mix", parts: [{ asset: "nasdaq100", weight: 50 }, { asset: "nasdaq100", weight: 50, stock: "NVDA" }], rebalance: false };
    const model = resolveInvestment(both, []).model!;
    expect(model.parts.map((part) => part.kind)).toEqual(["asset", "stock"]);
    expect(mixPartKey({ asset: "nasdaq100" })).toBe("asset:nasdaq100");
    expect(mixPartKey({ asset: "nasdaq100", stock: "NVDA" })).toBe("stock:NVDA");
    expect(templateOf([{ asset: "world", weight: 60 }, { asset: "nasdaq100", weight: 40, stock: "NVDA" }])).toBeNull();
    expect(investmentName(resolveInvestment(withStock("NVDA", 40), []), EN)).toBe("Mix of 2");
  });

  it("says beside each stock, in small type, what it grows like and how much it moves", () => {
    const nvidia = instrumentById("NVDA")!;
    expect(stockPartDetail(nvidia, EN)).toMatch(/^grows like the Nasdaq-100 · moves ±\d\d% a year$/);
    expect(plain(stockPartDetail(nvidia, ES))).toMatch(/^crece como el Nasdaq-100 · se mueve ±\d\d % al año$/);
    expect(mixPartName({ asset: "nasdaq100", weight: 40, stock: "NVDA" }, EN)).toBe("NVIDIA");
    expect(mixPartName({ asset: "world", weight: 60 }, ES)).toBe("Mundo");
  });
});

describe("the concentration effect", () => {
  it("is shown when one stock is over a fifth of the mix, with the bad cases and the middle with and without it", () => {
    const effect = concentration(resolveInvestment(withStock("NVDA", 40), []).model!, amounts);
    expect(effect).toMatchObject({ stock: { id: "NVDA" }, index: "nasdaq100" });
    expect(effect?.weight).toBeCloseTo(0.4, 12);
    // Without NVIDIA: the very same mix with the Nasdaq-100 in its place, as the mix's own figures give it.
    const index = mixFigures(resolveInvestment(withIndex("NVDA", 40), []), amounts)!;
    expect(effect?.without.p10).toBeCloseTo(index.range[0], 6);
    // With it: the mix's own range.
    expect(effect?.with.p10).toBeCloseTo(mixFigures(resolveInvestment(withStock("NVDA", 40), []), amounts)!.range[0], 6);
  });

  it("makes NVIDIA's bad cases much worse, and its middle result lower", () => {
    const effect = concentration(resolveInvestment(withStock("NVDA", 40), []).model!, amounts)!;
    expect(effect.with.p10).toBeLessThan(effect.without.p10 * 0.9);
    expect(effect.with.p50).toBeLessThan(effect.without.p50);
    expect(concentrationEffect(effect)).toEqual({ middle: "lower", bad: "much-worse" });
  });

  it("gets worse as the stock's share grows", () => {
    const at = (weight: number) => concentration(resolveInvestment(withStock("NVDA", weight), []).model!, amounts)!;
    const [a, b, c] = [25, 40, 60].map(at);
    expect(b.with.p10 / b.without.p10).toBeLessThan(a.with.p10 / a.without.p10);
    expect(c.with.p10 / c.without.p10).toBeLessThan(b.with.p10 / b.without.p10);
  });

  it("is not shown at a fifth or less, nor for a mix of assets", () => {
    expect(CONCENTRATION_LIMIT).toBe(0.2);
    expect(concentration(resolveInvestment(withStock("NVDA", 20), []).model!, amounts)).toBeNull();
    expect(concentration(resolveInvestment(withStock("NVDA", 15), []).model!, amounts)).toBeNull();
    expect(concentration(resolveInvestment(withIndex("NVDA", 40), []).model!, amounts)).toBeNull();
    expect(mixFigures(resolveInvestment(withStock("NVDA", 15), []), amounts)?.concentration).toBeNull();
  });

  it("speaks of the biggest stock when several are over a fifth", () => {
    const two: Investment = {
      kind: "mix",
      parts: [
        { asset: "world", weight: 30 },
        { asset: "nasdaq100", weight: 30, stock: "AAPL" },
        { asset: "nasdaq100", weight: 40, stock: "TSLA" },
      ],
      rebalance: false,
    };
    expect(concentration(resolveInvestment(two, []).model!, amounts)?.stock.id).toBe("TSLA");
  });

  it("is not shown with the user's own growth or ups and downs: the stock's own moves are not simulated then", () => {
    const own = resolveInvestment(withStock("NVDA", 40), [], { pricesOf: "NL", assumptions: { ...STANDARD_ASSUMPTIONS, growth: toNominal(0.05, 0.02) } });
    expect(mixFigures(own, amounts)?.concentration).toBeNull();
  });

  it("is said from the figures, never assumed", () => {
    const fig = (p10: number, p50: number) => ({ with: { p10, p50 }, without: { p10: 100, p50: 100 } });
    expect(concentrationEffect(fig(70, 98))).toEqual({ middle: "same", bad: "much-worse" });
    expect(concentrationEffect(fig(95, 120))).toEqual({ middle: "higher", bad: "worse" });
    expect(concentrationEffect(fig(101, 90))).toEqual({ middle: "lower", bad: "same" });
    expect(concentrationEffect(fig(110, 100))).toEqual({ middle: "same", bad: "better" });
    expect(EN.m.result.mix.concentration("40%", EN.m.result.mix.middleEffect.same, EN.m.result.mix.badEffect["much-worse"])).toBe(
      "One stock is 40% of your mix: the middle result barely changes, the bad cases get much worse.",
    );
    expect(ES.m.result.mix.concentration("40 %", ES.m.result.mix.middleEffect.lower, ES.m.result.mix.badEffect["much-worse"])).toBe(
      "Una acción es el 40 % de tu mezcla: el resultado del medio baja, los casos malos empeoran mucho.",
    );
  });
});

describe("a mix with a stock in the data file", () => {
  const state = { ...INITIAL_STATE, plan: { ...INITIAL_STATE.plan, investment: withStock("NVDA", 40) } };

  it("reads back with its stock", () => {
    const loaded = parseDataFile(serializeState(state, today));
    expect(loaded.ok && loaded.state.plan.investment).toEqual(withStock("NVDA", 40));
    expect(loaded.ok && loaded.notices).toEqual([]);
  });

  it("takes the stock's index from the list, and leaves out a stock no longer on it", () => {
    const file = (parts: unknown[]) =>
      parseDataFile(JSON.stringify({ kind: "wealth-lens-data", version: 7, plan: { ...state.plan, investment: { kind: "mix", parts, rebalance: false } }, holdings: [] }));
    const wrongIndex = file([{ asset: "world", weight: 60 }, { asset: "gold", weight: 40, stock: "NVDA" }]);
    expect(wrongIndex.ok && wrongIndex.state.plan.investment).toEqual(withStock("NVDA", 40));
    const gone = file([{ asset: "world", weight: 60 }, { asset: "sp500", weight: 40, stock: "GONE" }]);
    expect(gone.ok && gone.state.plan.investment).toEqual({ kind: "mix", parts: [{ asset: "world", weight: 60 }], rebalance: false });
    // A fund named as a stock is left out: a mix takes a fund as its index.
    const fund = file([{ asset: "world", weight: 60 }, { asset: "sp500", weight: 40, stock: "VUAA" }]);
    expect(fund.ok && fund.state.plan.investment).toEqual({ kind: "mix", parts: [{ asset: "world", weight: 60 }], rebalance: false });
  });

  it("is calculated like any mix", () => {
    const calc = calculate(state.plan, [], today);
    expect(calc.investment.simulation).toBe("joint");
    expect(calc.result.total).toBeGreaterThan(0);
  });
});
