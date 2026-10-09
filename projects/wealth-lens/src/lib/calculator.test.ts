import { describe, expect, it } from "vitest";
import { EN, getI18n } from "@/i18n";
import { goalDetail, goalExplain, goalName } from "@/i18n/goal-text";
import {
  calculate,
  countryRows,
  dearestCovered,
  featuredRows,
  goalStatuses,
  yearlyPath,
  type CalculatorPlan,
} from "./calculator";
import { parseIsoDate } from "./dates";
import { futureValueWithContributions, monthsToGoal, requiredMonthlyContribution } from "./finance";
import { INDEXES } from "./indexes";
import { cachedSuccessRate } from "./simulation";
import { STANDARD_ASSUMPTIONS, type Goal } from "./types";

const today = parseIsoDate("2026-09-29");
const r = INDEXES.sp500.averageReturn;

const plan = (overrides: Partial<CalculatorPlan> = {}): CalculatorPlan => ({
  invested: 1000,
  monthlyContribution: 200,
  investment: { kind: "asset", asset: "sp500" },
  years: 20,
  withdrawalRate: 0.04,
  pricesOf: "NL",
  assumptions: STANDARD_ASSUMPTIONS,
  goals: [],
  ...overrides,
});

describe("the result", () => {
  it("is what EUR 1,000 + EUR 200 a month in US stocks give after 20 years", () => {
    const { result } = calculate(plan(), today);
    const total = futureValueWithContributions(1000, 200, r, 20);
    expect(result.total).toBeCloseTo(total, 6);
    expect(result.putIn).toBe(1000 + 200 * 240);
    expect(result.growth).toBeCloseTo(total - 49_000, 6);
    expect(result.income).toBeCloseTo((total * 0.04) / 12, 6);
    expect(result.lasted).toBe(cachedSuccessRate("asset:sp500", INDEXES.sp500.years.map((y) => y.realReturn), 0.04));
  });

  it("follows the years, the investment and the withdrawal rate", () => {
    const base = calculate(plan(), today).result;
    expect(calculate(plan({ years: 30 }), today).result.total).toBeGreaterThan(base.total);
    expect(calculate(plan({ investment: { kind: "asset", asset: "bonds" } }), today).result.total).toBeLessThan(base.total);
    const three = calculate(plan({ withdrawalRate: 0.03 }), today).result;
    expect(three.total).toBe(base.total);
    expect(three.income).toBeCloseTo((base.total * 0.03) / 12, 6);
    expect(three.lasted).toBeGreaterThan(base.lasted);
  });

  it("is zero with nothing in, and sensible with a lot", () => {
    expect(calculate(plan({ invested: 0, monthlyContribution: 0 }), today).result).toMatchObject({ total: 0, putIn: 0, growth: 0, income: 0 });
    const big = calculate(plan({ invested: 10_000_000 }), today).result;
    expect(big.growth).toBeGreaterThan(0);
    expect(Number.isFinite(big.income)).toBe(true);
  });
});

describe("the chart's years", () => {
  it("go from today to the chosen year and end on the result", () => {
    const { scenario, result } = calculate(plan(), today);
    const path = yearlyPath(scenario, 20);
    expect(path).toHaveLength(21);
    expect(path[0]).toEqual({ year: 0, putIn: 1000, total: 1000 });
    expect(path[10].putIn).toBe(1000 + 200 * 120);
    expect(path[20].total).toBeCloseTo(result.total, 6);
    expect(path[20].putIn).toBe(result.putIn);
    for (const point of path.slice(1)) expect(point.total).toBeGreaterThan(point.putIn);
  });
});

describe("the country table", () => {
  const { countries, result } = calculate(plan(), today);

  it("lists every country the official data can price, cheapest first, housing included", () => {
    expect(countries.length).toBeGreaterThanOrEqual(100);
    const costs = countries.map((row) => row.cost.amount);
    expect([...costs].sort((a, b) => a - b)).toEqual(costs);
    expect(countries.find((row) => row.code === "PE")).toMatchObject({ cost: { amount: 210 }, referenceDate: "2024" });
    expect(countries.find((row) => row.code === "NL")).toBeDefined();
  });

  it("says, per cell, ✓ or when the plan gets there, and never past 60 years", () => {
    const tiny = calculate(plan({ invested: 1, monthlyContribution: 1 }), today).countries;
    const swiss = tiny.find((row) => row.code === "CH");
    expect(swiss?.cost.covered).toBe(false);
    expect(EN.f.when(swiss?.cost.months ?? 0)).toBe("not at this pace");
    const rich = calculate(plan({ invested: 2_000_000 }), today).countries;
    expect(rich.every((row) => row.cost.covered)).toBe(true);
    expect(EN.f.when(countries.at(-1)?.cost.months ?? 0)).toMatch(/^in \d+ years$/);
  });

  it("follows the withdrawal rate: at 3% the same money pays less", () => {
    const at3 = calculate(plan({ withdrawalRate: 0.03 }), today).countries;
    const covered = (rows: typeof countries) => rows.filter((row) => row.cost.covered).length;
    expect(covered(at3)).toBeLessThanOrEqual(covered(countries));
    expect(at3.find((row) => row.code === "PE")?.cost.target).toBeCloseTo((210 * 12) / 0.03, 6);
  });

  it("ticks what the income after 20 years pays, and says when the rest comes", () => {
    for (const { cost: cell } of countries) {
      expect(cell.covered).toBe(cell.amount <= result.income + 1e-6);
      expect(cell.months <= 240).toBe(cell.covered);
      expect(cell.months).toBeCloseTo(monthsToGoal(1000, 200, r, (cell.amount * 12) / 0.04), 6);
    }
    // Peru (EUR 210) is paid; Switzerland (EUR 3,070) is not.
    expect(countries.find((row) => row.code === "PE")).toMatchObject({ cost: { covered: true } });
    expect(countries.find((row) => row.code === "CH")).toMatchObject({ cost: { covered: false } });
  });

  it("shows seven rows first: those already paid for, the dearest included, then the closest, and Peru and the Netherlands", () => {
    const shown = featuredRows(countries);
    expect(shown).toHaveLength(7);
    expect(shown.map((row) => row.code)).toEqual(expect.arrayContaining(["PE", "NL"]));
    // What "Enough to live in" names is in the table, and every row paid for comes before any that is not.
    const dearest = dearestCovered(countries);
    expect(dearest).not.toBeNull();
    expect(shown).toContain(dearest);
    const paid = shown.map((row) => row.cost.covered);
    expect(paid).toEqual(paid.toSorted((a, b) => Number(b) - Number(a)));
    expect(paid.filter(Boolean).length).toBeGreaterThan(0);
    // The ones not paid for yet are the closest to it.
    const open = countries.filter((row) => !row.cost.covered && !["PE", "NL"].includes(row.code));
    const soonest = Math.max(...shown.filter((row) => !row.cost.covered && !["PE", "NL"].includes(row.code)).map((row) => row.cost.months));
    expect(open.filter((row) => row.cost.months < soonest).every((row) => shown.includes(row))).toBe(true);
  });

  it("fills the seven rows the same way when nothing or everything is paid for", () => {
    const none = countryRows(calculate({ ...plan(), invested: 0, monthlyContribution: 1 }, today).scenario, 240);
    expect(dearestCovered(none)).toBeNull();
    expect(featuredRows(none)).toHaveLength(7);
    expect(featuredRows(none).every((row) => !row.cost.covered)).toBe(true);
    const all = countryRows(calculate({ ...plan(), invested: 50_000_000, monthlyContribution: 0 }, today).scenario, 240);
    expect(featuredRows(all)).toHaveLength(7);
    expect(featuredRows(all)).toContain(dearestCovered(all));
    expect(dearestCovered(all)).toBe(all.at(-1));
  });

  it("does not depend on any country of the user's", () => {
    // The same plan gives the same table: there is no home country to set.
    expect(countryRows(calculate(plan(), today).scenario, 240)).toEqual(countries);
  });
});

describe("goals", () => {
  const live: Goal = { id: "a", kind: "live", country: "PE" };
  const car: Goal = { id: "b", kind: "buy-own", name: "A car", amount: 24_000 };
  const boat: Goal = { id: "c", kind: "buy-own", name: "A boat", amount: 15_000 };
  const amount: Goal = { id: "d", kind: "amount", amount: 100_000 };
  const income: Goal = { id: "e", kind: "monthly", amount: 1500, label: "my rent" };

  it("there are none unless the user adds some", () => {
    expect(calculate(plan(), today).goals).toEqual([]);
  });

  it("work out each kind: its name, amount and the capital that gets there", () => {
    const statuses = calculate(plan({ goals: [live, car, boat, amount, income] }), today).goals;
    const [a, b, c, d, e] = statuses;
    expect(statuses.map((status) => goalName(status, EN))).toEqual(["Live in Peru", "A car", "A boat", "Reach €100,000", "My rent"]);
    expect(goalDetail(a, EN)).toBe("housing included");
    expect(goalDetail(e, EN)).toBeNull();
    expect(a).toMatchObject({ kind: "monthly", amount: 210, target: (210 * 12) / 0.04, referenceDate: "2024" });
    expect(b).toMatchObject({ kind: "once", amount: 24_000, target: 24_000 });
    expect(c).toMatchObject({ kind: "once", target: 15_000 });
    expect(d).toMatchObject({ kind: "once", target: 100_000 });
    expect(e).toMatchObject({ kind: "monthly", amount: 1500, target: (1500 * 12) / 0.04 });
    // Without a label it is just what it is.
    const [unnamed] = calculate(plan({ goals: [{ id: "u", kind: "monthly", amount: 900, label: null }] }), today).goals;
    expect(goalName(unnamed, EN)).toBe("A monthly amount");
    expect(unnamed).toMatchObject({ kind: "monthly", target: (900 * 12) / 0.04 });
    // In Spanish, the same goals in Spanish.
    const ES = getI18n("es");
    expect(statuses.map((status) => goalName(status, ES))).toEqual(["Vivir en Perú", "A car", "A boat", "Llegar a 100.000\u00a0€", "My rent"]);
  });

  it("say when each is reached with the plan, and the year", () => {
    const [b] = calculate(plan({ goals: [car] }), today).goals;
    const months = monthsToGoal(1000, 200, r, 24_000);
    expect(b.months).toBeCloseTo(months, 9);
    expect(b.reachable).toBe(true);
    expect(b.date?.getUTCFullYear()).toBe(2033);
    expect(calculate(plan({ invested: 30_000, goals: [car] }), today).goals[0]).toMatchObject({ months: 0, date: null });
  });

  it("are independent: each is worked out on the whole plan", () => {
    const alone = calculate(plan({ goals: [car] }), today).goals[0];
    const withOthers = calculate(plan({ goals: [amount, income, car, live] }), today).goals[2];
    expect(withOthers.months).toBe(alone.months);
    expect(withOthers.target).toBe(alone.target);
  });

  it("keep the order they were added in, whatever their dates", () => {
    const goals = [amount, car, income, boat];
    const statuses = calculate(plan({ goals }), today).goals;
    expect(statuses.map((status) => status.goal.id)).toEqual(["d", "b", "e", "c"]);
    // Still that order when the plan changes which comes first.
    expect(calculate(plan({ goals, invested: 90_000 }), today).goals.map((status) => status.goal.id)).toEqual(["d", "b", "e", "c"]);
  });

  it("are removed by leaving them out", () => {
    const statuses = calculate(plan({ goals: [live, car, boat].filter((goal) => goal.id !== "b") }), today).goals;
    expect(statuses.map((status) => status.goal.id)).toEqual(["a", "c"]);
  });

  it("more than 60 years away: not at this pace, with the monthly amount for 30 years", () => {
    const calc = calculate(plan({ monthlyContribution: 20, goals: [income] }), today);
    const [status] = calc.goals;
    expect(status.months).toBeGreaterThan(60 * 12);
    expect(status).toMatchObject({ reachable: false, date: null });
    const needed = requiredMonthlyContribution(1000, r, 360, (1500 * 12) / 0.04);
    expect(status.needed).toBeCloseTo(needed, 6);
    expect(monthsToGoal(1000, needed, r, status.target)).toBeCloseTo(360, 6);
    expect(goalExplain(status, calc.scenario, calc.investment, EN)[1]).toMatch(/It takes more than 60 years\. To get there in 30 years: €[\d,]+ a month\.$/);
  });

  it("explain their calculation, with the source and year of a country's figure", () => {
    const calc = calculate(plan({ goals: [live] }), today);
    const explain = goalExplain(calc.goals[0], calc.scenario, calc.investment, EN);
    expect(explain[0]).toBe("€210 a month × 12 ÷ 4% taken out a year = €63,000 needed.");
    expect(explain[1]).toMatch(/^You have €1,000 and add €200 a month\. It grows [\d.]+% a year after rising prices \(US stocks, 1988–2022 average\)\. €63,000 in /);
    expect(explain[2]).toBe("What an average person there lives on, housing included: World Bank: household survey 2024, prices 2024.");
  });

  it("keep a country a file names but the official data no longer price, so it can be removed", () => {
    const [gone] = calculate(plan({ goals: [{ id: "x", kind: "live", country: "ZZ" }] }), today).goals;
    expect(gone).toMatchObject({ known: false, reachable: false });
    expect(goalName(gone, EN)).toBe(EN.m.goals.unknown);
  });

  it("follow the withdrawal rate when they are monthly", () => {
    const at4 = goalStatuses([income], calculate(plan(), today).scenario, today)[0];
    const at3 = calculate(plan({ withdrawalRate: 0.03, goals: [income] }), today).goals[0];
    expect(at3.target).toBeGreaterThan(at4.target);
  });
});
