/**
 * Tiny, empty and huge inputs: every number the page shows must still be
 * sensible. Each case checks what it says, and that nothing in the result,
 * the goals, the country table or the findings reads NaN, Infinity, "-€0"
 * or a year more than 60 years away.
 */

import { describe, expect, it } from "vitest";
import { EN, getI18n, type I18n } from "@/i18n";
import { goalExplain, goalName } from "@/i18n/goal-text";
import { calculate, type Calculation, type CalculatorPlan } from "./calculator";
import { parseIsoDate } from "./dates";
import { allFindings } from "./findings";
import { planChecks } from "./plan-check";
import { checkWords } from "@/i18n/check-text";
import { timesPutInText } from "./growth";
import { bandsFor, samplesFor } from "./projections";
import { STANDARD_ASSUMPTIONS, type Goal } from "./types";

const ES = getI18n("es");
const whenText = EN.f.when;
const formatSmallEur = EN.f.smallCur;

const today = parseIsoDate("2026-09-29");

const plan = (overrides: Partial<CalculatorPlan> = {}): CalculatorPlan => ({
  invested: 1000,
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

/** One goal of each kind. */
const goals: Goal[] = [
  { id: "a", kind: "live", country: "PE" },
  { id: "b", kind: "freedom", amount: 2000, country: null },
  { id: "c", kind: "buy-own", name: "Boat", amount: 15_000 },
  { id: "d", kind: "amount", amount: 100_000 },
  { id: "e", kind: "monthly", amount: 1500, label: null },
];

/** Every text the page shows for this calculation, in one language. */
function texts(calc: Calculation, i18n: I18n): string[] {
  const { result } = calc;
  const { f } = i18n;
  return [
    f.cur(result.total),
    f.smallCur(result.income),
    f.cur(result.putIn),
    f.cur(Math.abs(result.growth)),
    ...calc.goals.flatMap((status) => [
      goalName(status, i18n),
      f.when(status.months, today),
      f.cur(status.needed ?? 0),
      ...goalExplain(status, calc.scenario, calc.investment, i18n),
    ]),
    ...calc.countries.map((row) => f.when(row.cost.months)),
    ...allFindings({ calc, inflation: 0.02, today, i18n }).flatMap((finding) => [finding.value, finding.text, ...finding.calculation]),
  ];
}

function expectSensible(calc: Calculation) {
  for (const i18n of [EN, ES]) {
    for (const text of texts(calc, i18n)) {
      expect(text).not.toMatch(/NaN|Infinity|undefined|-€0\b|€-|-0\u00a0€|−0\u00a0€/);
      // Spanish writes €2400 as "2400 €", and big amounts as "2400 billones": money, not a year.
      for (const year of text.match(/\b2\d{3}\b(?!\u00a0(?:€|\p{L}))/gu) ?? []) expect(Number(year), text).toBeLessThanOrEqual(2026 + 60);
    }
  }
}

describe("€1 invested, nothing added", () => {
  const calc = calculate(plan({ invested: 1, monthlyContribution: 0, goals }), today);

  it("pays 'under €1' a month, not €0", () => {
    expect(formatSmallEur(calc.result.income)).toBe("under €1");
  });

  it("reaches no goal within 60 years, and says what 30 years would take", () => {
    for (const status of calc.goals) {
      expect(status.reachable, goalName(status, EN)).toBe(false);
      expect(whenText(status.months, today)).toBe("not at this pace");
      expect(status.needed, goalName(status, EN)).toBeGreaterThan(0);
    }
    expect(calc.countries.every((row) => whenText(row.cost.months) === "not at this pace")).toBe(true);
    expectSensible(calc);
  });
});

describe("nothing invested, nothing added", () => {
  const calc = calculate(plan({ invested: 0, monthlyContribution: 0, goals }), today);

  it("has €0, pays €0 and reaches nothing", () => {
    expect(calc.result).toMatchObject({ total: 0, putIn: 0, growth: 0, income: 0 });
    expect(formatSmallEur(calc.result.income)).toBe("€0");
    expect(calc.goals.every((status) => !status.reachable)).toBe(true);
  });

  it("has no '-€0' bad-decade card", () => {
    expect(allFindings({ calc, inflation: 0.02, today, i18n: EN }).map((finding) => finding.id)).not.toContain("sequence");
    expectSensible(calc);
  });
});

describe("€10,000,000 invested", () => {
  const calc = calculate(plan({ invested: 10_000_000, goals }), today);

  it("has every goal already", () => {
    expect(calc.goals.every((status) => status.months === 0 && whenText(status.months) === "now")).toBe(true);
    expect(calc.countries.every((row) => row.cost.covered)).toBe(true);
  });

  it("has no findings about reaching a goal, and stays sensible", () => {
    const ids = allFindings({ calc, inflation: 0.02, today, i18n: EN }).map((finding) => finding.id);
    // About the result instead: the first goal is already there.
    expect(ids).toContain("inflation");
    for (const finding of allFindings({ calc, inflation: 0.02, today, i18n: EN })) expect(finding.text).not.toMatch(/first goal/);
    expectSensible(calc);
  });
});

describe("€1,000,000 added a month", () => {
  it("gets there in a month", () => {
    const calc = calculate(plan({ invested: 0, monthlyContribution: 1_000_000, goals: [goals[3]] }), today);
    expect(whenText(calc.goals[0].months, today)).toBe("in 1 month (2026)");
    expectSensible(calc);
  });
});

describe("the longest and shortest horizons", () => {
  it("stay within 60 years", () => {
    for (const years of [1, 60]) expectSensible(calculate(plan({ years, goals }), today));
  });
});

describe("no growth, or a loss, every year", () => {
  it("stays sensible at 0% and at -2% a year", () => {
    for (const rate of [0, -0.02]) {
      const assumptions = { ...STANDARD_ASSUMPTIONS, growth: rate };
      const calc = calculate(plan({ investment: { kind: "custom" }, assumptions, goals }), today);
      expect(calc.result.total).toBeGreaterThan(0);
      expectSensible(calc);
    }
  });

  it("stays sensible in a savings account, which loses a little to inflation and never swings", () => {
    const calc = calculate(plan({ investment: { kind: "asset", asset: "savings" }, goals }), today);
    expect(calc.investment.realReturn).toBeLessThan(0);
    expect(calc.investment.volatility).toBe(0);
    expect(calc.result.lasted === 0 || calc.result.lasted === 1).toBe(true);
    expectSensible(calc);
  });

  it("stays sensible with no swings at all, or huge ones", () => {
    for (const volatility of [0, 0.9]) {
      const calc = calculate(plan({ investment: { kind: "asset", asset: "gold" }, assumptions: { ...STANDARD_ASSUMPTIONS, volatility }, goals }), today);
      expectSensible(calc);
    }
  });
});

describe("growth from −50% to 500% a year, the whole range of step 3", () => {
  const custom = (growth: number, years: number) =>
    plan({ investment: { kind: "custom" }, assumptions: { ...STANDARD_ASSUMPTIONS, growth }, years, goals });

  for (const growth of [-0.5, 0, 0.7, 5]) {
    it(`stays sensible at ${growth * 100}% a year, over 1, 20 and 60 years`, () => {
      for (const years of [1, 20, 60]) {
        const p = custom(growth, years);
        const calc = calculate(p, today);
        for (const value of [calc.result.total, calc.result.putIn, calc.result.growth, calc.result.income]) expect(Number.isFinite(value), `${growth} ${years}`).toBe(true);
        const amounts = { start: calc.scenario.capital, monthly: calc.scenario.monthly, years };
        const bands = bandsFor(calc.investment, amounts);
        for (const band of [bands.p10, bands.p50, bands.p90]) expect(band.every(Number.isFinite), `${growth} ${years}`).toBe(true);
        expect(samplesFor(calc.investment, amounts, 50).flat().every(Number.isFinite)).toBe(true);
        expectSensible(calc);
        for (const i18n of [EN, ES]) {
          const shown = [
            i18n.f.cur(calc.result.total),
            i18n.f.cur(bands.p90[years]),
            timesPutInText(calc.result, i18n) ?? "",
            ...planChecks(calc, p).flatMap((check) => [...checkWords(check, i18n).lead, ...checkWords(check, i18n).details]),
            ...calc.goals.map((goal) => i18n.f.when(goal.months, today)),
          ];
          for (const text of shown) {
            expect(text).not.toMatch(/NaN|Infinity|undefined|e\+|E\d/);
            // No figure of more than twelve digits in a row: big ones are in words or a power of ten.
            expect(text.replace(/[,.\u00a0]/g, "")).not.toMatch(/\d{13}/);
          }
        }
      }
    });
  }

  it("gives figures one can check at the edges", () => {
    // 0%: what is put in, €1,000 and €200 a month for 20 years.
    expect(calculate(custom(0, 20), today).result.total).toBeCloseTo(49_000, 6);
    // −50% a year: €1,000 alone halves every year.
    expect(calculate({ ...custom(-0.5, 2), monthlyContribution: 0 }, today).result.total).toBeCloseTo(250, 6);
    // 70% for 20 years: €1,000 alone becomes 1.7^20 times as much, in full.
    expect(calculate({ ...custom(0.7, 20), monthlyContribution: 0 }, today).result.total).toBeCloseTo(1000 * 1.7 ** 20, 0);
    expect(EN.f.cur(1000 * 1.7 ** 20)).toBe("€40,642,314");
    // 500% for 20 years: €1,000 alone is 6^20 times as much, a power of ten.
    const huge = calculate({ ...custom(5, 20), monthlyContribution: 0 }, today).result.total;
    expect(huge / (1000 * 6 ** 20)).toBeCloseTo(1, 9);
    expect(EN.f.cur(huge)).toBe("€3.66\u00a0×\u00a010¹⁸");
    expect(ES.f.cur(huge)).toBe("3,66\u00a0×\u00a010¹⁸\u00a0€");
  });
});

describe("when", () => {
  it("says now, in N years (with the year when given today), or not at this pace", () => {
    expect(whenText(0)).toBe("now");
    expect(whenText(0.2)).toBe("in 1 month");
    expect(whenText(10.5)).toBe("in 11 months");
    expect(whenText(11.5)).toBe("in 1 year");
    expect(whenText(12)).toBe("in 1 year");
    // Rounded up: 20 years and a month is not "in 20 years".
    expect(whenText(241)).toBe("in 21 years");
    expect(whenText(30)).toBe("in 3 years");
    expect(whenText(144, today)).toBe("in 12 years (2038)");
    expect(whenText(720, today)).toBe("in 60 years (2086)");
    expect(whenText(721)).toBe("not at this pace");
    expect(whenText(Infinity)).toBe("not at this pace");
  });
});

describe("smallCur", () => {
  it("says 'under €1' for a few cents, and whole euros otherwise", () => {
    expect(formatSmallEur(0.003)).toBe("under €1");
    expect(formatSmallEur(0)).toBe("€0");
    expect(formatSmallEur(0.6)).toBe("€1");
    expect(formatSmallEur(1234.4)).toBe("€1,234");
  });

  it("writes Spanish amounts and spans the Spanish way", () => {
    expect(ES.f.smallCur(0.003)).toBe("menos de 1\u00a0€");
    expect(ES.f.smallCur(1234.4)).toBe("1234\u00a0€");
    expect(ES.f.cur(112_288)).toBe("112.288\u00a0€");
    expect(ES.f.when(144, today)).toBe("en 12 años (2038)");
    expect(ES.f.when(0.2)).toBe("en 1 mes");
    expect(ES.f.when(0)).toBe("ahora");
    expect(ES.f.when(721)).toBe(ES.m.when.notAtThisPace);
  });
});
