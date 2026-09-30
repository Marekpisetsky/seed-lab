import { afterEach, describe, expect, it } from "vitest";
import { appStore, clearWhatIf, INITIAL_STATE, replaceState, toggleWhatIf, updatePlan } from "./app-store";
import { calculate, monthsTo, valueAt, whatIfEffects, type CalculatorPlan } from "./calculator";
import { parseDataFile, serializeState } from "./data-file";
import { parseIsoDate } from "./dates";
import { futureValueWithContributions } from "./finance";
import { annualizedReturn, SERIES } from "./indexes";
import { bandsFor, successRatesFor } from "./projections";
import { STANDARD_ASSUMPTIONS } from "./types";
import { DEFAULT_PLAN } from "./validation";
import { badStartHead, WHAT_IF_IDS, WHAT_IF_LABELS, whatIfInputs } from "./what-if";

const today = parseIsoDate("2026-09-30");
const plan = (patch: Partial<CalculatorPlan> = {}): CalculatorPlan => ({ ...DEFAULT_PLAN, invested: 10_000, monthlyContribution: 300, ...patch });
const effect = (base: ReturnType<typeof calculate>, id: (typeof WHAT_IF_IDS)[number]) => whatIfEffects(base).find((entry) => entry.id === id);

afterEach(() => replaceState(INITIAL_STATE));

describe("the five scenarios", () => {
  it("come in a fixed order, each with its chip and its label once applied", () => {
    expect(WHAT_IF_IDS).toEqual(["grow-more", "grow-less", "monthly-50", "years-5", "bad-decade"]);
    expect(WHAT_IF_IDS.map((id) => WHAT_IF_LABELS[id].chip)).toEqual(["Grows 1% more", "Grows 1% less", "+€50 a month", "5 more years", "A bad first decade"]);
    expect(WHAT_IF_LABELS["grow-more"].applied).toBe("grows 1% more");
  });

  it("change the plan's inputs, one each", () => {
    expect(whatIfInputs(null, 300, 20)).toEqual({ monthly: 300, years: 20, growth: 0, badStart: false });
    expect(whatIfInputs("grow-more", 300, 20)).toMatchObject({ growth: 0.01 });
    expect(whatIfInputs("grow-less", 300, 20)).toMatchObject({ growth: -0.01 });
    expect(whatIfInputs("monthly-50", 300, 20)).toMatchObject({ monthly: 350 });
    expect(whatIfInputs("years-5", 300, 20)).toMatchObject({ years: 25 });
    expect(whatIfInputs("bad-decade", 300, 20)).toMatchObject({ badStart: true });
  });

  it("each show exactly what applying them changes at the end", () => {
    const base = calculate(plan(), [], today);
    for (const entry of whatIfEffects(base)) {
      const applied = calculate(plan(), [], today, entry.id);
      expect(applied.whatIf, entry.id).toBe(entry.id);
      expect(applied.result.total - base.result.total, entry.id).toBeCloseTo(entry.change, 6);
    }
  });
});

describe("Grows 1% more / less", () => {
  const base = calculate(plan(), [], today);
  const r = SERIES.sp500.averageReturn;

  it("grows 1% more or less a year after rising prices, with the same ups and downs", () => {
    const more = calculate(plan(), [], today, "grow-more");
    const less = calculate(plan(), [], today, "grow-less");
    expect(more.investment.realReturn).toBeCloseTo(r + 0.01, 12);
    expect(less.investment.realReturn).toBeCloseTo(r - 0.01, 12);
    expect(more.result.total).toBeCloseTo(futureValueWithContributions(10_000, 300, r + 0.01, 20), 6);
    expect(annualizedReturn(more.investment.returns)).toBeCloseTo(r + 0.01, 12);
    expect(effect(base, "grow-more")?.change).toBeGreaterThan(0);
    expect(effect(base, "grow-less")?.change).toBeLessThan(0);
  });

  it("moves the simulations too: the withdrawal lasts more often with more growth", () => {
    const more = calculate(plan(), [], today, "grow-more");
    expect(more.result.lasted).toBeGreaterThan(base.result.lasted);
    const band = bandsFor(more.investment, { start: 10_000, monthly: 300, years: 20 });
    expect(band.p50[20]).toBeGreaterThan(bandsFor(base.investment, { start: 10_000, monthly: 300, years: 20 }).p50[20]);
  });

  it("works for a mix, whose parts are simulated together", () => {
    const mix = plan({ investment: { kind: "mix", parts: [{ asset: "world", weight: 60 }, { asset: "bonds", weight: 40 }], rebalance: false } });
    const plain = calculate(mix, [], today);
    const more = calculate(mix, [], today, "grow-more");
    expect(more.investment.realReturn).toBeCloseTo(plain.investment.realReturn + 0.01, 12);
    expect(more.investment.growthFactor).toBeGreaterThan(1);
    expect(successRatesFor(more.investment, [0.04])[0]).toBeGreaterThan(successRatesFor(plain.investment, [0.04])[0]);
  });
});

describe("+€50 a month and 5 more years", () => {
  const base = calculate(plan(), [], today);

  it("adds €50 to every month", () => {
    const more = calculate(plan(), [], today, "monthly-50");
    expect(more.scenario.monthly).toBe(350);
    expect(more.result.putIn).toBe(base.result.putIn + 50 * 240);
    expect(effect(base, "monthly-50")?.change).toBeCloseTo(futureValueWithContributions(0, 50, SERIES.sp500.averageReturn, 20), 6);
  });

  it("looks five years further, up to 60", () => {
    const later = calculate(plan(), [], today, "years-5");
    expect(later.result.years).toBe(25);
    expect(effect(base, "years-5")?.change).toBeCloseTo(valueAt(base.scenario, 300) - base.result.total, 6);
    const long = calculate(plan({ years: 56 }), [], today);
    expect(effect(long, "years-5")).toEqual({ id: "years-5", change: 0, available: false });
    expect(calculate(plan({ years: 56 }), [], today, "years-5")).toMatchObject({ whatIf: null, result: { years: 56 } });
    expect(effect(calculate(plan({ years: 55 }), [], today), "years-5")?.available).toBe(true);
  });
});

describe("A bad first decade", () => {
  const base = calculate(plan(), [], today);

  it("follows the lower line of the simulations (1 in 10 ended below it) for ten years, then grows at the average", () => {
    const bad = calculate(plan(), [], today, "bad-decade");
    const lower = bandsFor(base.investment, { start: 10_000, monthly: 300, years: 10 }).p10;
    expect(bad.scenario.head).toEqual(lower.slice(0, 11));
    expect(bad.scenario.head?.[0]).toBe(10_000);
    expect(valueAt(bad.scenario, 120)).toBeCloseTo(lower[10], 6);
    expect(bad.result.total).toBeCloseTo(futureValueWithContributions(lower[10], 300, base.scenario.realReturn, 10), 6);
    expect(effect(base, "bad-decade")?.change).toBeLessThan(0);
  });

  it("delays goals and the country table the same way", () => {
    const withGoal = plan({ goals: [{ id: "a", kind: "amount", amount: 150_000 }] });
    const plain = calculate(withGoal, [], today);
    const bad = calculate(withGoal, [], today, "bad-decade");
    expect(bad.goals[0].months).toBeGreaterThan(plain.goals[0].months);
    expect(bad.goals[0].months).toBeCloseTo(monthsTo(bad.scenario, 150_000), 9);
    const peru = (calc: typeof bad) => calc.countries.find((row) => row.code === "PE")?.withHousing.months ?? 0;
    expect(peru(bad)).toBeGreaterThan(peru(plain));
  });

  it("lasts the plan's years when they are fewer than ten", () => {
    const short = calculate(plan({ years: 6 }), [], today, "bad-decade");
    expect(short.scenario.head).toHaveLength(7);
    expect(short.result.total).toBeCloseTo(short.scenario.head?.[6] ?? NaN, 6);
  });

  it("uses the ups and downs typed, when they are the user's", () => {
    const calm = plan({ assumptions: { ...STANDARD_ASSUMPTIONS, volatility: 0.05 } });
    const wild = plan({ assumptions: { ...STANDARD_ASSUMPTIONS, volatility: 0.3 } });
    const change = (p: CalculatorPlan) => effect(calculate(p, [], today), "bad-decade")?.change ?? 0;
    expect(change(wild)).toBeLessThan(change(calm));
    expect(change(calm)).toBeLessThan(0);
  });

  it("does not exist with no ups and downs", () => {
    const savings = calculate(plan({ investment: { kind: "asset", asset: "savings" } }), [], today);
    expect(effect(savings, "bad-decade")).toEqual({ id: "bad-decade", change: 0, available: false });
    expect(badStartHead(savings.investment, 10_000, 300, 20)).toBeNull();
    expect(calculate(plan({ investment: { kind: "asset", asset: "savings" } }), [], today, "bad-decade").whatIf).toBeNull();
  });
});

describe("applying a scenario", () => {
  it("turns one on, switches to another, and takes it away when tapped again", () => {
    expect(appStore.get().whatIf).toBeNull();
    toggleWhatIf("years-5");
    expect(appStore.get().whatIf).toBe("years-5");
    toggleWhatIf("bad-decade");
    expect(appStore.get().whatIf).toBe("bad-decade");
    toggleWhatIf("bad-decade");
    expect(appStore.get().whatIf).toBeNull();
    toggleWhatIf("grow-more");
    clearWhatIf();
    expect(appStore.get().whatIf).toBeNull();
  });

  it("stays on while the plan changes, and its effect follows the plan", () => {
    toggleWhatIf("monthly-50");
    updatePlan({ monthlyContribution: 500 });
    const { plan: current, whatIf } = appStore.get();
    expect(whatIf).toBe("monthly-50");
    expect(calculate(current, [], today, whatIf).scenario.monthly).toBe(550);
  });

  it("is never saved in a data file", () => {
    toggleWhatIf("grow-less");
    const text = serializeState(appStore.get(), today);
    expect(text).not.toContain("grow-less");
    const loaded = parseDataFile(text);
    expect(loaded.ok && loaded.state.whatIf).toBeNull();
  });
});
