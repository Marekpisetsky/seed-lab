import { describe, expect, it } from "vitest";
import { EN, getI18n } from "@/i18n";
import { goalDetail, goalExplain, goalName } from "@/i18n/goal-text";
import {
  calculate,
  countryRows,
  dearestCovered,
  featuredRows,
  goalStatuses,
  itemStatuses,
  pricedItems,
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
  it("is what EUR 1,000 + EUR 200 a month in the S&P 500 give after 20 years", () => {
    const { result } = calculate(plan(), [], today);
    const total = futureValueWithContributions(1000, 200, r, 20);
    expect(result.total).toBeCloseTo(total, 6);
    expect(result.putIn).toBe(1000 + 200 * 240);
    expect(result.growth).toBeCloseTo(total - 49_000, 6);
    expect(result.income).toBeCloseTo((total * 0.04) / 12, 6);
    expect(result.lasted).toBe(cachedSuccessRate("asset:sp500", INDEXES.sp500.years.map((y) => y.realReturn), 0.04));
  });

  it("follows the years, the investment and the withdrawal rate", () => {
    const base = calculate(plan(), [], today).result;
    expect(calculate(plan({ years: 30 }), [], today).result.total).toBeGreaterThan(base.total);
    expect(calculate(plan({ investment: { kind: "asset", asset: "world" } }), [], today).result.total).toBeLessThan(base.total);
    const three = calculate(plan({ withdrawalRate: 0.03 }), [], today).result;
    expect(three.total).toBe(base.total);
    expect(three.income).toBeCloseTo((base.total * 0.03) / 12, 6);
    expect(three.lasted).toBeGreaterThan(base.lasted);
  });

  it("is zero with nothing in, and sensible with a lot", () => {
    expect(calculate(plan({ invested: 0, monthlyContribution: 0 }), [], today).result).toMatchObject({ total: 0, putIn: 0, growth: 0, income: 0 });
    const big = calculate(plan({ invested: 10_000_000 }), [], today).result;
    expect(big.growth).toBeGreaterThan(0);
    expect(Number.isFinite(big.income)).toBe(true);
  });
});

describe("the chart's years", () => {
  it("go from today to the chosen year and end on the result", () => {
    const { scenario, result } = calculate(plan(), [], today);
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
  const { countries, result } = calculate(plan(), [], today);

  it("lists every country cheapest first, with and without housing side by side", () => {
    // 30 detailed countries and the rest estimated from their price levels.
    expect(countries.length).toBeGreaterThanOrEqual(150);
    expect(countries.filter((row) => !row.estimated)).toHaveLength(30);
    const costs = countries.map((row) => row.withoutHousing.amount);
    expect([...costs].sort((a, b) => a - b)).toEqual(costs);
    for (const row of countries) expect(row.withHousing.amount).toBeGreaterThan(row.withoutHousing.amount);
    expect(countries.find((row) => row.code === "PE")).toMatchObject({ withoutHousing: { amount: 470 }, withHousing: { amount: 700 } });
    expect(countries.find((row) => row.code === "NL")).toBeDefined();
  });

  it("says, per cell, ✓ or when the plan gets there, and never past 60 years", () => {
    const tiny = calculate(plan({ invested: 1, monthlyContribution: 5 }), [], today).countries;
    const peru = tiny.find((row) => row.code === "PE");
    expect(peru?.withoutHousing.covered).toBe(false);
    expect(EN.f.when(peru?.withHousing.months ?? 0)).toBe("not at this pace");
    const rich = calculate(plan({ invested: 2_000_000 }), [], today).countries;
    expect(rich.every((row) => row.withoutHousing.covered && row.withHousing.covered)).toBe(true);
    expect(EN.f.when(countries.at(-1)?.withHousing.months ?? 0)).toMatch(/^in \d+ years$/);
  });

  it("follows the withdrawal rate: at 3% the same money pays less", () => {
    const at3 = calculate(plan({ withdrawalRate: 0.03 }), [], today).countries;
    const covered = (rows: typeof countries) => rows.filter((row) => row.withoutHousing.covered).length;
    expect(covered(at3)).toBeLessThanOrEqual(covered(countries));
    expect(at3.find((row) => row.code === "IN")?.withoutHousing.target).toBeCloseTo((250 * 12) / 0.03, 6);
  });

  it("ticks what the income after 20 years pays, and says when the rest comes", () => {
    for (const row of countries) {
      for (const cell of [row.withoutHousing, row.withHousing]) {
        expect(cell.covered).toBe(cell.amount <= result.income + 1e-6);
        expect(cell.months <= 240).toBe(cell.covered);
        expect(cell.months).toBeCloseTo(monthsToGoal(1000, 200, r, (cell.amount * 12) / 0.04), 6);
      }
    }
    // India without housing (EUR 250) is paid; Switzerland with housing (EUR 2,950) is not.
    expect(countries.find((row) => row.code === "IN")).toMatchObject({ withoutHousing: { covered: true } });
    expect(countries.find((row) => row.code === "CH")).toMatchObject({ withHousing: { covered: false } });
  });

  it("shows seven rows first: those already paid for, the dearest included, then the closest, and Peru and the Netherlands", () => {
    const shown = featuredRows(countries);
    expect(shown).toHaveLength(7);
    expect(shown.map((row) => row.code)).toEqual(expect.arrayContaining(["PE", "NL"]));
    // What "Enough to live in" names is in the table, and every row paid for comes before any that is not.
    const dearest = dearestCovered(countries);
    expect(dearest).not.toBeNull();
    expect(shown).toContain(dearest);
    const paid = shown.map((row) => row.withoutHousing.covered);
    expect(paid).toEqual(paid.toSorted((a, b) => Number(b) - Number(a)));
    expect(paid.filter(Boolean).length).toBeGreaterThan(0);
    // The ones not paid for yet are the closest to it.
    const open = countries.filter((row) => !row.withoutHousing.covered && !["PE", "NL"].includes(row.code));
    const soonest = Math.max(...shown.filter((row) => !row.withoutHousing.covered && !["PE", "NL"].includes(row.code)).map((row) => row.withoutHousing.months));
    expect(open.filter((row) => row.withoutHousing.months < soonest).every((row) => shown.includes(row))).toBe(true);
  });

  it("fills the seven rows the same way when nothing or everything is paid for", () => {
    const none = countryRows(calculate({ ...plan(), invested: 0, monthlyContribution: 10 }, [], today).scenario, 240);
    expect(dearestCovered(none)).toBeNull();
    expect(featuredRows(none)).toHaveLength(7);
    expect(featuredRows(none).every((row) => !row.withoutHousing.covered)).toBe(true);
    const all = countryRows(calculate({ ...plan(), invested: 50_000_000, monthlyContribution: 0 }, [], today).scenario, 240);
    expect(featuredRows(all)).toHaveLength(7);
    expect(featuredRows(all)).toContain(dearestCovered(all));
    expect(dearestCovered(all)).toBe(all.at(-1));
  });

  it("does not depend on any country of the user's", () => {
    // The same plan gives the same table: there is no home country or housing to set.
    expect(countryRows(calculate(plan(), [], today).scenario, 240)).toEqual(countries);
  });
});

describe("goals", () => {
  const live: Goal = { id: "a", kind: "live", country: "PE", housing: true };
  const car: Goal = { id: "b", kind: "buy", item: "used-car" };
  const boat: Goal = { id: "c", kind: "buy-own", name: "A boat", amount: 15_000 };
  const amount: Goal = { id: "d", kind: "amount", amount: 100_000 };
  const income: Goal = { id: "e", kind: "monthly", amount: 1500, label: "my rent" };

  it("there are none unless the user adds some", () => {
    expect(calculate(plan(), [], today).goals).toEqual([]);
  });

  it("work out each kind: its name, amount and the capital that gets there", () => {
    const statuses = calculate(plan({ goals: [live, car, boat, amount, income] }), [], today).goals;
    const [a, b, c, d, e] = statuses;
    expect(statuses.map((status) => goalName(status, EN))).toEqual(["Live in Peru", "A used car", "A boat", "Reach €100,000", "My rent"]);
    expect(goalDetail(a, EN)).toBe("including rent");
    expect(goalDetail(e, EN)).toBeNull();
    expect(a).toMatchObject({ kind: "monthly", amount: 700, target: (700 * 12) / 0.04 });
    expect(b).toMatchObject({ kind: "once", amount: 24_326, target: 24_326 });
    expect(c).toMatchObject({ kind: "once", target: 15_000 });
    expect(d).toMatchObject({ kind: "once", target: 100_000 });
    expect(e).toMatchObject({ kind: "monthly", amount: 1500, target: (1500 * 12) / 0.04 });
    // Without a label it is just what it is.
    const [unnamed] = calculate(plan({ goals: [{ id: "u", kind: "monthly", amount: 900, label: null }] }), [], today).goals;
    expect(goalName(unnamed, EN)).toBe("A monthly amount");
    expect(unnamed).toMatchObject({ kind: "monthly", target: (900 * 12) / 0.04 });
    const withoutHousing = calculate(plan({ goals: [{ ...live, housing: false }] }), [], today).goals[0];
    expect(goalDetail(withoutHousing, EN)).toBe("excluding rent");
    expect(withoutHousing).toMatchObject({ amount: 470 });
    // In Spanish, the same goals in Spanish.
    const ES = getI18n("es");
    expect(statuses.map((status) => goalName(status, ES))).toEqual(["Vivir en Perú", ES.m.things.items["used-car"].name, "A boat", "Llegar a 100.000\u00a0€", "My rent"]);
  });

  it("say when each is reached with the plan, and the year", () => {
    const [b] = calculate(plan({ goals: [car] }), [], today).goals;
    const months = monthsToGoal(1000, 200, r, 24_326);
    expect(b.months).toBeCloseTo(months, 9);
    expect(b.reachable).toBe(true);
    expect(b.date?.getUTCFullYear()).toBe(2033);
    expect(calculate(plan({ invested: 30_000, goals: [car] }), [], today).goals[0]).toMatchObject({ months: 0, date: null });
  });

  it("are independent: each is worked out on the whole plan", () => {
    const alone = calculate(plan({ goals: [car] }), [], today).goals[0];
    const withOthers = calculate(plan({ goals: [amount, income, car, live] }), [], today).goals[2];
    expect(withOthers.months).toBe(alone.months);
    expect(withOthers.target).toBe(alone.target);
  });

  it("keep the order they were added in, whatever their dates", () => {
    const goals = [amount, car, income, boat];
    const statuses = calculate(plan({ goals }), [], today).goals;
    expect(statuses.map((status) => status.goal.id)).toEqual(["d", "b", "e", "c"]);
    // Still that order when the plan changes which comes first.
    expect(calculate(plan({ goals, invested: 90_000 }), [], today).goals.map((status) => status.goal.id)).toEqual(["d", "b", "e", "c"]);
  });

  it("are removed by leaving them out", () => {
    const statuses = calculate(plan({ goals: [live, car, boat].filter((goal) => goal.id !== "b") }), [], today).goals;
    expect(statuses.map((status) => status.goal.id)).toEqual(["a", "c"]);
  });

  it("more than 60 years away: not at this pace, with the monthly amount for 30 years", () => {
    const calc = calculate(plan({ monthlyContribution: 20, goals: [income] }), [], today);
    const [status] = calc.goals;
    expect(status.months).toBeGreaterThan(60 * 12);
    expect(status).toMatchObject({ reachable: false, date: null });
    const needed = requiredMonthlyContribution(1000, r, 360, (1500 * 12) / 0.04);
    expect(status.needed).toBeCloseTo(needed, 6);
    expect(monthsToGoal(1000, needed, r, status.target)).toBeCloseTo(360, 6);
    expect(goalExplain(status, calc.scenario, calc.investment, EN)[1]).toMatch(/It takes more than 60 years\. To get there in 30 years: €[\d,]+ a month\.$/);
  });

  it("explain their calculation", () => {
    const calc = calculate(plan({ goals: [live] }), [], today);
    const explain = goalExplain(calc.goals[0], calc.scenario, calc.investment, EN);
    expect(explain[0]).toBe("€700 a month × 12 ÷ 4% taken out a year = €210,000 needed.");
    expect(explain[1]).toMatch(/^You have €1,000 and add €200 a month\. It grows 7\.5% a year after rising prices \(S&P 500, 1988–2022 average\)\. €210,000 in /);
    expect(explain[2]).toMatch(/^One person, with housing: Numbeo/);
  });

  it("keep an item a file names but the list no longer has, so it can be removed", () => {
    const [gone] = calculate(plan({ goals: [{ id: "x", kind: "buy", item: "sabbatical" }] }), [], today).goals;
    expect(gone).toMatchObject({ known: false, reachable: false });
    expect(goalName(gone, EN)).toBe(EN.m.goals.unknown);
  });

  it("follow the withdrawal rate when they are monthly", () => {
    const at4 = goalStatuses([income], calculate(plan(), [], today).scenario, today)[0];
    const at3 = calculate(plan({ withdrawalRate: 0.03, goals: [income] }), [], today).goals[0];
    expect(at3.target).toBeGreaterThan(at4.target);
  });
});

describe("the things to buy", () => {
  it("are the list, without items priced from a country of the user's own", () => {
    const ids = pricedItems().map((item) => item.id);
    expect(ids).toContain("used-car");
    expect(ids).not.toContain("cushion");
    expect(ids).not.toContain("sabbatical");
  });

  it("price months abroad with housing there", () => {
    const byId = new Map(pricedItems().map((item) => [item.id, item]));
    expect(byId.get("three-months-japan")?.amount).toBe(1060 * 3);
    // Thailand 770, Vietnam 620, Indonesia 510, Malaysia 710, Philippines 600 → 642/month.
    expect(byId.get("southeast-asia")?.amount).toBe(7700);
    expect(byId.get("masters-nl")?.amount).toBe(12 * 2190 + 2601);
    expect(byId.get("six-months-portugal")?.amount).toBe(6 * 1410);
  });

  it("each say now, or when the plan gets there", () => {
    const { scenario } = calculate(plan(), [], today);
    const statuses = itemStatuses(scenario);
    expect(statuses.find((status) => status.item.id === "e-bike")?.months).toBeCloseTo(monthsToGoal(1000, 200, r, 2872), 9);
    expect(itemStatuses({ ...scenario, capital: 5000 }).find((status) => status.item.id === "e-bike")?.months).toBe(0);
  });
});
