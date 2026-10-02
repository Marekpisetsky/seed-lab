import { afterEach, describe, expect, it } from "vitest";
import { EN, getI18n } from "@/i18n";
import { appStore, INITIAL_STATE, replaceState, setAssumptions, setInvestment } from "./app-store";
import { EXAMPLE_IDS, exampleInvestment, exampleOf, exampleRates, fieldPercent, indexRate, pickExample, sameTenth, setGrowth } from "./examples";
import { CUSTOM_BASE, resolveInvestment } from "./investment";
import { STANDARD_ASSUMPTIONS } from "./types";
import { DEFAULT_PLAN, STARTING_GROWTH } from "./validation";

const ES = getI18n("es");
const plan = () => appStore.get().plan;
const resolved = () => resolveInvestment(plan().investment, [], plan());
const rates = () => exampleRates(plan());
/** What typing a growth in step 3's field does, from what the field showed. */
const type = (growth: number) => setGrowth(growth, resolved().realReturn, rates(), plan().investment);

afterEach(() => replaceState(INITIAL_STATE));

describe("step 3's starting value", () => {
  it("is Custom growth at 5 % after rising prices, the long-run world average", () => {
    expect(STARTING_GROWTH).toBe(0.05);
    expect(DEFAULT_PLAN.investment).toEqual({ kind: "custom" });
    expect(resolved().realReturn).toBe(0.05);
    expect(fieldPercent(resolved().realReturn)).toBe(5);
  });

  it("moves like world stocks: their ups and downs", () => {
    expect(CUSTOM_BASE).toBe("world");
    expect(resolved().volatility).toBe(resolveInvestment({ kind: "asset", asset: "world" }, []).volatility);
    expect(resolved().volatility).toBeGreaterThan(0);
  });

  it("is not More options' Custom: nothing there was changed", () => {
    expect(plan().assumptions).toEqual({ ...STANDARD_ASSUMPTIONS, growth: 0.05 });
  });
});

describe("the examples under step 3", () => {
  it("are what each one invests in, and back", () => {
    for (const id of EXAMPLE_IDS) expect(exampleOf(exampleInvestment(id))).toBe(id);
    expect(exampleInvestment("60-40")).toMatchObject({ kind: "mix", parts: [{ asset: "world", weight: 60 }, { asset: "bonds", weight: 40 }] });
    expect(exampleOf({ kind: "custom" })).toBeNull();
    expect(exampleOf({ kind: "asset", asset: "nasdaq100" })).toBeNull();
    expect(exampleOf({ kind: "portfolio" })).toBeNull();
    expect(exampleOf({ kind: "mix", parts: [{ asset: "world", weight: 80 }, { asset: "bonds", weight: 20 }], rebalance: true })).toBeNull();
  });

  it("show the S&P 500 at 7.5 % and World at 4.5 %, after rising prices, in both languages", () => {
    expect(EN.f.rate(rates().sp500)).toBe("7.5%");
    expect(EN.f.rate(rates().world)).toBe("4.5%");
    expect(ES.f.rate(rates().sp500)).toBe("7,5 %");
    expect(rates().sp500).toBeCloseTo(indexRate("sp500"), 12);
    expect(rates().world).toBeCloseTo(indexRate("world"), 12);
  });

  it("each fill the field with their growth, invest in it with its own past years, and drop a typed growth", () => {
    for (const id of EXAMPLE_IDS) {
      pickExample(id);
      expect(exampleOf(plan().investment)).toBe(id);
      expect(plan().assumptions.growth).toBeNull();
      expect(resolved().custom).toBe(false);
      expect(sameTenth(resolved().realReturn, rates()[id])).toBe(true);
    }
  });
});

describe("typing in step 3's field", () => {
  it("invests in the example with that growth, to a tenth of a percent", () => {
    type(0.075);
    expect(plan().investment).toEqual({ kind: "asset", asset: "sp500" });
    expect(resolved().custom).toBe(false);
    type(Math.round(rates().world * 1000) / 1000);
    expect(plan().investment).toEqual({ kind: "asset", asset: "world" });
  });

  it("is Custom growth at any other number, with world stocks' ups and downs", () => {
    pickExample("sp500");
    type(0.06);
    expect(plan().investment).toEqual({ kind: "custom" });
    expect(resolved().realReturn).toBe(0.06);
    expect(resolved().volatility).toBe(resolveInvestment({ kind: "asset", asset: "world" }, []).volatility);
  });

  it("keeps ups and downs typed in More options while it stays Custom growth", () => {
    setAssumptions({ volatility: 0.1 });
    type(0.06);
    expect(plan().assumptions).toMatchObject({ growth: 0.06, volatility: 0.1 });
  });

  it("changes nothing when the number is the one shown, so leaving the field keeps a choice from More options", () => {
    setInvestment({ kind: "asset", asset: "nasdaq100" });
    type(resolved().realReturn);
    expect(plan().investment).toEqual({ kind: "asset", asset: "nasdaq100" });
  });

  it("is the one number typed: growth after rising prices, whatever the country's inflation", () => {
    type(0.06);
    setAssumptions({ inflation: 0.05 });
    expect(resolved().realReturn).toBe(0.06);
    expect(resolved().inflation).toBe(0.05);
  });

  it("shows a growth to a tenth of a percent: 7.49 % is 7.5", () => {
    expect(fieldPercent(0.0749)).toBe(7.5);
    expect(fieldPercent(-0.0049)).toBe(-0.5);
    expect(sameTenth(0.0749, 0.075)).toBe(true);
    expect(sameTenth(0.074, 0.075)).toBe(false);
  });
});
