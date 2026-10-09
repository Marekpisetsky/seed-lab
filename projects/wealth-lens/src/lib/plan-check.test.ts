import { describe, expect, it } from "vitest";
import { ADVICE, plainLanguageProblems } from "@seed-kit/plain-language.ts";
import { EN, getI18n } from "@/i18n";
import { checkWords } from "@/i18n/check-text";
import { calculate, type CalculatorPlan } from "./calculator";
import { parseIsoDate } from "./dates";
import { futureValueWithContributions } from "./finance";
import { INDEXES } from "./indexes";
import { CHECK_ORDER, horizonCheck, planChecks, savingsCheck, SHORT_YEARS, type PlanCheck } from "./plan-check";
import { FUTURES, samplesFor } from "./projections";
import { STANDARD_ASSUMPTIONS, type Goal, type Investment } from "./types";

const ES = getI18n("es");
const today = parseIsoDate("2026-10-07");

const plan = (overrides: Partial<CalculatorPlan> = {}): CalculatorPlan => ({
  invested: 10_000,
  monthlyContribution: 200,
  investment: { kind: "asset", asset: "sp500" },
  years: 20,
  withdrawalRate: 0.04,
  pricesOf: "NL",
  currency: "EUR",
  assumptions: STANDARD_ASSUMPTIONS,
  goals: [],
  ...overrides,
});

const checksOf = (overrides: Partial<CalculatorPlan> = {}) => {
  const p = plan(overrides);
  return planChecks(calculate(p, today), p);
};

describe("few years, money that moves", () => {
  it("counts the possible futures that end below what was put in, for a plan under 5 years", () => {
    const calc = calculate(plan({ years: 3 }), today);
    const check = horizonCheck(calc);
    // €10,000 and €200 a month for 3 years: €17,200 put in.
    expect(check).toMatchObject({ id: "horizon", years: 3, goal: null, putIn: 17_200, futures: FUTURES });
    // The very futures of the chart's band, counted at year 3.
    const ends = samplesFor(calc.investment, { start: 10_000, monthly: 200, years: 3 }, FUTURES).map((path) => path[3]);
    expect(check?.below).toBe(ends.filter((value) => value < 17_200).length);
    expect(check!.below).toBeGreaterThanOrEqual(FUTURES / 10);
    expect(check!.bad).toBeLessThan(17_200);
  });

  it("says nothing from 5 years on, or for money that does not move", () => {
    expect(horizonCheck(calculate(plan({ years: SHORT_YEARS }), today))).toBeNull();
    expect(horizonCheck(calculate(plan({ years: 20 }), today))).toBeNull();
    expect(horizonCheck(calculate(plan({ years: 3, investment: { kind: "asset", asset: "savings" } }), today))).toBeNull();
    expect(horizonCheck(calculate(plan({ years: 3, investment: { kind: "custom" }, assumptions: { ...STANDARD_ASSUMPTIONS, growth: 0.05, volatility: 0 } }), today))).toBeNull();
  });

  it("says nothing when fewer than 1 in 10 futures end below what was put in", () => {
    // Bonds hardly move: over 4 years, almost no future ends below.
    const bonds = calculate(plan({ years: 4, investment: { kind: "asset", asset: "bonds" } }), today);
    const ends = samplesFor(bonds.investment, { start: 10_000, monthly: 200, years: 4 }, FUTURES).map((path) => path[4]);
    const below = ends.filter((value) => value < 10_000 + 200 * 48).length;
    expect(horizonCheck(bonds) === null).toBe(below < FUTURES / 10);
  });

  it("speaks of the soonest goal under 5 years away in a longer plan", () => {
    const car: Goal = { id: "car", kind: "buy-own", name: "A car", amount: 20_000 };
    const calc = calculate(plan({ goals: [car] }), today);
    const goal = calc.goals[0];
    expect(goal.months).toBeGreaterThan(0);
    expect(goal.months).toBeLessThan(SHORT_YEARS * 12);
    const check = horizonCheck(calc);
    expect(check?.goal?.goal).toBe(car);
    expect(check?.years).toBe(Math.ceil(goal.months / 12));
    // A goal already reached, or further than 5 years, is not about the next few years.
    expect(horizonCheck(calculate(plan({ invested: 50_000, goals: [car] }), today))).toBeNull();
    expect(horizonCheck(calculate(plan({ invested: 0, monthlyContribution: 100, goals: [car] }), today))).toBeNull();
  });
});

describe("savings for a long time", () => {
  const savings: Investment = { kind: "asset", asset: "savings" };

  it("sets what savings keep against what was put in and against US stocks", () => {
    const calc = calculate(plan({ investment: savings, years: 30 }), today);
    const check = savingsCheck(calc, plan());
    // 1.5% interest and prices rising 2%: savings lose a little every year.
    expect(check).toMatchObject({ id: "savings", years: 30, total: calc.result.total, putIn: 10_000 + 200 * 360 });
    expect(check!.total).toBeLessThan(check!.putIn);
    // US stocks with the same amounts, at their 1988–2022 average after rising prices.
    expect(check?.stocks.typical).toBeCloseTo(futureValueWithContributions(10_000, 200, INDEXES.sp500.averageReturn, 30), 6);
    expect(check?.stocks.period).toEqual([1988, 2022]);
    expect(check!.stocks.bad).toBeLessThan(check!.stocks.typical);
    // Their worst fall in the data, the one "Test my plan" shows.
    expect(check?.stocks.fall).toMatchObject({ from: 1929, to: 1931 });
    expect(check!.stocks.fall!.drop).toBeCloseTo(0.5336, 4);
  });

  it("says nothing under 10 years, or for anything but savings", () => {
    expect(savingsCheck(calculate(plan({ investment: savings, years: 9 }), today), plan())).toBeNull();
    expect(savingsCheck(calculate(plan({ investment: savings, years: 10 }), today), plan())).not.toBeNull();
    expect(savingsCheck(calculate(plan({ years: 30 }), today), plan())).toBeNull();
  });
});

describe("Check your plan", () => {
  it("shows nothing when nothing stands out, and at most one of each, in order", () => {
    expect(checksOf()).toEqual([]);
    const all = checksOf({ years: 3 });
    expect(all.map((check) => check.id)).toEqual(["horizon"]);
    for (const checks of [all, checksOf({ investment: { kind: "asset", asset: "savings" }, years: 30 })]) {
      const positions = checks.map((check) => CHECK_ORDER.indexOf(check.id));
      expect([...positions].sort((a, b) => a - b)).toEqual(positions);
    }
  });

  /** Plans that show each check, in both languages. */
  const shown: PlanCheck[] = [
    ...checksOf({ years: 3 }),
    ...checksOf({ goals: [{ id: "car", kind: "buy-own", name: "A car", amount: 20_000 }] }),
    ...checksOf({ investment: { kind: "asset", asset: "savings" }, years: 30 }),
  ];

  it("has a case for each kind of check", () => {
    expect(new Set(shown.map((check) => check.id))).toEqual(new Set(CHECK_ORDER));
  });

  it("says each with its euros, in short sentences, without advice, in English and in Spanish", () => {
    for (const i18n of [EN, ES]) {
      for (const check of shown) {
        const { lead, details } = checkWords(check, i18n);
        const texts = [...lead, ...details];
        // What stands out always comes with a figure in euros.
        expect(lead.join(" "), check.id).toMatch(/€/);
        // No percentage without its euros.
        for (const text of texts) if (/%/.test(text)) expect(text, check.id).toMatch(/€/);
        // Never what to buy, sell, keep or weigh: what is, never what to do.
        for (const text of texts) {
          expect(ADVICE[i18n.locale].test(text), text).toBe(false);
          expect(text, check.id).not.toMatch(/\b(buy|sell|switch|move to|reduce|increase|keep|compra|vende|cambia|reduce|aumenta|mantén|pasa a)\b/i);
        }
        expect(plainLanguageProblems(texts.map((text, index) => ({ path: `${check.id}.${index}`, text })), i18n.locale)).toEqual([]);
      }
    }
  });

  it("subtracts the euros as they are shown, so the sums on the page add up", () => {
    // €370,414.60 and €151,175.40 show as €370,415 and €151,175: the gap shown is €219,240, not €219,239.
    const check: PlanCheck = {
      id: "savings",
      years: 30,
      total: 151_175.4,
      putIn: 164_000,
      stocks: { typical: 370_414.6, bad: 169_417, rate: 0.045, period: [1988, 2022], fall: { drop: 0.4618, from: 2000, to: 2002 } },
    };
    const { lead, details } = checkWords(check, EN);
    expect(lead).toEqual(["In 30 years, savings are worth €151,175 of today's money.", "That is €12,825 less than you put in."]);
    expect(details).toContain("US stocks (1988–2022) typically give €370,415.");
    // Both sides, in two short sentences: what savings give up, then the worst fall US stocks had, on the same plan's money (46% of €370,415).
    // "At least": the data is yearly, so within a year it may have fallen further.
    const both = ["With savings you would end with €219,240 less than with US stocks.", "But stocks can fall: from 2000 to 2002 they fell at least 46% (−€170,391)."];
    expect(details.slice(details.indexOf(both[0]), details.indexOf(both[0]) + 2)).toEqual(both);
    expect(checkWords(check, ES).details).toEqual(
      expect.arrayContaining([
        "Con Ahorro terminarías con 219.240\u00a0€ menos que con acciones de EE. UU.",
        "Pero las acciones pueden caer: entre 2000 y 2002 cayeron al menos un 46\u00a0% (\u2212170.391\u00a0€).",
      ]),
    );
    // A fall within one calendar year is said with its year.
    const one: PlanCheck = { ...check, stocks: { ...check.stocks, fall: { drop: 0.4076, from: 2008, to: 2008 } } };
    expect(checkWords(one, EN).details).toContain("But stocks can fall: in 2008 they fell at least 41% (−€151,870).");
    expect(checkWords(one, ES).details).toContain("Pero las acciones pueden caer: en 2008 cayeron al menos un 41\u00a0% (\u2212151.870\u00a0€).");
  });
});
