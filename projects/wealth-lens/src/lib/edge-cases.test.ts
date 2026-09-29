/**
 * Tiny, empty and huge inputs: every number the page shows must still be
 * sensible. Each case checks what it says, and that nothing in the result,
 * the goals, the country table or the findings reads NaN, Infinity, "-€0"
 * or a year more than 60 years away.
 */

import { describe, expect, it } from "vitest";
import { calculate, formatSmallEur, itemStatuses, whenText, type Calculation, type CalculatorPlan } from "./calculator";
import { parseIsoDate } from "./dates";
import { allFindings } from "./findings";
import { formatEur } from "./format";
import type { Goal } from "./types";

const today = parseIsoDate("2026-09-29");

const plan = (overrides: Partial<CalculatorPlan> = {}): CalculatorPlan => ({
  invested: 1000,
  monthlyContribution: 200,
  investment: { kind: "index", index: "sp500" },
  years: 20,
  withdrawalRate: 0.04,
  goals: [],
  ...overrides,
});

/** One goal of each kind. */
const goals: Goal[] = [
  { id: "a", kind: "live", country: "PE", housing: true },
  { id: "b", kind: "buy", item: "used-car" },
  { id: "c", kind: "buy-own", name: "Boat", amount: 15_000 },
  { id: "d", kind: "amount", amount: 100_000 },
  { id: "e", kind: "income", amount: 1500, name: null },
];

/** Every text the page shows for this calculation. */
function texts(calc: Calculation): string[] {
  const { result } = calc;
  return [
    formatEur(result.total),
    `${formatSmallEur(result.income)}/month`,
    formatEur(result.putIn),
    formatEur(Math.abs(result.growth)),
    ...calc.goals.flatMap((status) => [status.name, whenText(status.months, today), formatEur(status.needed ?? 0), ...status.explain]),
    ...calc.countries.flatMap((row) => [row.withoutHousing, row.withHousing].map((cell) => whenText(cell.months))),
    ...itemStatuses(calc.scenario).map((status) => whenText(status.months)),
    ...allFindings({ calc, inflation: 0.02, today, holdings: [] }).flatMap((finding) => [finding.value, finding.text, ...finding.calculation]),
  ];
}

function expectSensible(calc: Calculation) {
  for (const text of texts(calc)) {
    expect(text).not.toMatch(/NaN|Infinity|undefined|-€0\b|€-/);
    for (const year of text.match(/\b2\d{3}\b/g) ?? []) expect(Number(year), text).toBeLessThanOrEqual(2026 + 60);
  }
}

describe("€1 invested, nothing added", () => {
  const calc = calculate(plan({ invested: 1, monthlyContribution: 0, goals }), [], today);

  it("pays 'under €1' a month, not €0", () => {
    expect(formatSmallEur(calc.result.income)).toBe("under €1");
  });

  it("reaches no goal within 60 years, and says what 30 years would take", () => {
    for (const status of calc.goals) {
      expect(status.reachable, status.name).toBe(false);
      expect(whenText(status.months, today)).toBe("not at this pace");
      expect(status.needed, status.name).toBeGreaterThan(0);
    }
    expect(calc.countries.every((row) => whenText(row.withHousing.months) === "not at this pace")).toBe(true);
    expectSensible(calc);
  });
});

describe("nothing invested, nothing added", () => {
  const calc = calculate(plan({ invested: 0, monthlyContribution: 0, goals }), [], today);

  it("has €0, pays €0 and reaches nothing", () => {
    expect(calc.result).toMatchObject({ total: 0, putIn: 0, growth: 0, income: 0 });
    expect(formatSmallEur(calc.result.income)).toBe("€0");
    expect(calc.goals.every((status) => !status.reachable)).toBe(true);
  });

  it("has no '-€0' bad-decade card", () => {
    expect(allFindings({ calc, inflation: 0.02, today, holdings: [] }).map((finding) => finding.id)).not.toContain("sequence");
    expectSensible(calc);
  });
});

describe("€10,000,000 invested", () => {
  const calc = calculate(plan({ invested: 10_000_000, goals }), [], today);

  it("has every goal already", () => {
    expect(calc.goals.every((status) => status.months === 0 && whenText(status.months) === "now")).toBe(true);
    expect(calc.countries.every((row) => row.withHousing.covered)).toBe(true);
  });

  it("has no findings about reaching a goal, and stays sensible", () => {
    const ids = allFindings({ calc, inflation: 0.02, today, holdings: [] }).map((finding) => finding.id);
    // About the result instead: the first goal is already there.
    expect(ids).toContain("inflation");
    for (const finding of allFindings({ calc, inflation: 0.02, today, holdings: [] })) expect(finding.text).not.toMatch(/first goal/);
    expectSensible(calc);
  });
});

describe("€1,000,000 added a month", () => {
  it("gets there in a month", () => {
    const calc = calculate(plan({ invested: 0, monthlyContribution: 1_000_000, goals: [goals[3]] }), [], today);
    expect(whenText(calc.goals[0].months, today)).toBe("in 1 month (2026)");
    expectSensible(calc);
  });
});

describe("the longest and shortest horizons", () => {
  it("stay within 60 years", () => {
    for (const years of [1, 60]) expectSensible(calculate(plan({ years, goals }), [], today));
  });
});

describe("no growth, or a loss, every year", () => {
  it("stays sensible at 0% and at -2% a year", () => {
    for (const realReturn of [0, -0.02]) {
      const calc = calculate(plan({ investment: { kind: "custom", realReturn }, goals }), [], today);
      expect(calc.result.total).toBeGreaterThan(0);
      expectSensible(calc);
    }
  });
});

describe("whenText", () => {
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

describe("formatSmallEur", () => {
  it("says 'under €1' for a few cents, and whole euros otherwise", () => {
    expect(formatSmallEur(0.003)).toBe("under €1");
    expect(formatSmallEur(0)).toBe("€0");
    expect(formatSmallEur(0.6)).toBe("€1");
    expect(formatSmallEur(1234.4)).toBe("€1,234");
  });
});
