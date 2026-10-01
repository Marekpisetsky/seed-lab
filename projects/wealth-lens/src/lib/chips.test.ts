import { afterEach, describe, expect, it } from "vitest";
import { EN, getI18n } from "@/i18n";
import { appStore, INITIAL_STATE, replaceState, setAssumptions } from "./app-store";
import { CHIP_IDS, chipInvestment, chipOf, chipRate, pickChip, startingCustomGrowth } from "./chips";
import { resolveInvestment } from "./investment";

const ES = getI18n("es");
const plan = () => appStore.get().plan;
const resolved = () => resolveInvestment(plan().investment, [], plan());

afterEach(() => replaceState(INITIAL_STATE));

describe("the growth chips", () => {
  it("are what each chip invests in, and back", () => {
    for (const id of CHIP_IDS) expect(chipOf(chipInvestment(id))).toBe(id);
    expect(chipInvestment("60-40")).toMatchObject({ kind: "mix", parts: [{ asset: "world", weight: 60 }, { asset: "bonds", weight: 40 }] });
    expect(chipInvestment("mine")).toEqual({ kind: "custom" });
  });

  it("leaves no chip picked for what only More options chooses", () => {
    expect(chipOf({ kind: "asset", asset: "nasdaq100" })).toBeNull();
    expect(chipOf({ kind: "asset", asset: "gold" })).toBeNull();
    expect(chipOf({ kind: "portfolio" })).toBeNull();
    expect(chipOf({ kind: "mix", parts: [{ asset: "world", weight: 80 }, { asset: "bonds", weight: 20 }], rebalance: true })).toBeNull();
  });

  it("show the S&P 500 and World at their growth after rising prices, in both languages", () => {
    expect(EN.m.growth.chips.sp500(EN.f.rate(chipRate("sp500")))).toBe("S&P 500 ~7.5%");
    expect(EN.m.growth.chips.world(EN.f.rate(chipRate("world")))).toBe("World ~4.5%");
    expect(ES.m.growth.chips.sp500(ES.f.rate(chipRate("sp500")))).toBe("S&P 500 ~7,5\u00a0%");
    expect(ES.m.growth.chips.world(ES.f.rate(chipRate("world")))).toBe("Mundo ~4,5\u00a0%");
    expect(resolveInvestment(chipInvestment("sp500"), []).realReturn).toBeCloseTo(chipRate("sp500"), 12);
  });

  it("pick with one tap, and a new tap drops the growth typed before", () => {
    pickChip("world", resolved().realReturn);
    expect(plan().investment).toEqual({ kind: "asset", asset: "world" });
    pickChip("mine", resolved().realReturn);
    setAssumptions({ growth: 0.09 });
    pickChip("bonds", resolved().realReturn);
    expect(chipOf(plan().investment)).toBe("bonds");
    expect(plan().assumptions.growth).toBeNull();
    expect(resolved().custom).toBe(false);
  });
});

describe("My %", () => {
  it("starts from the growth on screen, to a tenth of a percent, so the field holds a number", () => {
    expect(startingCustomGrowth(0.07534)).toBe(0.075);
    expect(startingCustomGrowth(-0.0049)).toBe(-0.005);
    pickChip("world", resolved().realReturn);
    const shown = resolved().realReturn;
    pickChip("mine", shown);
    expect(plan().investment).toEqual({ kind: "custom" });
    expect(plan().assumptions.growth).toBe(startingCustomGrowth(shown));
    expect(resolved().realReturn).toBeCloseTo(shown, 3);
  });

  it("is the one number typed: growth after rising prices, whatever the country's inflation", () => {
    pickChip("mine", resolved().realReturn);
    setAssumptions({ growth: 0.06, inflation: 0.05 });
    expect(resolved().realReturn).toBe(0.06);
    expect(resolved().inflation).toBe(0.05);
  });
});
