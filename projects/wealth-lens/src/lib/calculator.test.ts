import { describe, expect, it } from "vitest";
import {
  calculate,
  countryRows,
  featuredRows,
  goalStatuses,
  itemStatuses,
  pricedItems,
  type CalculatorPlan,
} from "./calculator";
import { parseIsoDate } from "./dates";
import { futureValueWithContributions, monthsToGoal, requiredMonthlyContribution } from "./finance";
import { INDEXES } from "./indexes";
import { cachedSuccessRate } from "./simulation";
import type { Goal } from "./types";

const today = parseIsoDate("2026-09-29");
const r = INDEXES.sp500.averageReturn;

const plan = (overrides: Partial<CalculatorPlan> = {}): CalculatorPlan => ({
  invested: 1000,
  monthlyContribution: 200,
  investment: { kind: "index", index: "sp500" },
  years: 20,
  withdrawalRate: 0.04,
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
    expect(result.lasted).toBe(cachedSuccessRate("index:sp500", INDEXES.sp500.years.map((y) => y.realReturn), 0.04));
  });

  it("follows the years, the investment and the withdrawal rate", () => {
    const base = calculate(plan(), [], today).result;
    expect(calculate(plan({ years: 30 }), [], today).result.total).toBeGreaterThan(base.total);
    expect(calculate(plan({ investment: { kind: "index", index: "world" } }), [], today).result.total).toBeLessThan(base.total);
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

describe("the country table", () => {
  const { countries, result } = calculate(plan(), [], today);

  it("lists every country cheapest first, with and without housing side by side", () => {
    expect(countries).toHaveLength(30);
    const costs = countries.map((row) => row.withoutHousing.amount);
    expect([...costs].sort((a, b) => a - b)).toEqual(costs);
    for (const row of countries) expect(row.withHousing.amount).toBeGreaterThan(row.withoutHousing.amount);
    expect(countries.find((row) => row.code === "PE")).toMatchObject({ withoutHousing: { amount: 470 }, withHousing: { amount: 700 } });
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
    expect(countries[0]).toMatchObject({ code: "IN", withoutHousing: { covered: true } });
    expect(countries.at(-1)).toMatchObject({ code: "CH", withHousing: { covered: false } });
  });

  it("shows the five cheapest, Peru and the Netherlands first", () => {
    expect(featuredRows(countries).map((row) => row.code)).toEqual(["IN", "EG", "ID", "VN", "MA", "PE", "NL"]);
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
  const income: Goal = { id: "e", kind: "income", amount: 1500, name: "My rent" };

  it("there are none unless the user adds some", () => {
    expect(calculate(plan(), [], today).goals).toEqual([]);
  });

  it("work out each kind: its name, amount and the capital that gets there", () => {
    const [a, b, c, d, e] = calculate(plan({ goals: [live, car, boat, amount, income] }), [], today).goals;
    expect(a).toMatchObject({ name: "Live in Peru", detail: "with housing", kind: "monthly", amount: 700, target: (700 * 12) / 0.04 });
    expect(b).toMatchObject({ name: "A used car", kind: "once", amount: 24_326, target: 24_326 });
    expect(c).toMatchObject({ name: "A boat", kind: "once", target: 15_000 });
    expect(d).toMatchObject({ name: "Reach €100,000", kind: "once", target: 100_000 });
    expect(e).toMatchObject({ name: "An income of €1,500 a month", detail: "My rent", kind: "monthly", target: (1500 * 12) / 0.04 });
    const withoutHousing = calculate(plan({ goals: [{ ...live, housing: false }] }), [], today).goals[0];
    expect(withoutHousing).toMatchObject({ detail: "without housing", amount: 470 });
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
    const [status] = calculate(plan({ monthlyContribution: 20, goals: [income] }), [], today).goals;
    expect(status.months).toBeGreaterThan(60 * 12);
    expect(status).toMatchObject({ reachable: false, date: null });
    const needed = requiredMonthlyContribution(1000, r, 360, (1500 * 12) / 0.04);
    expect(status.needed).toBeCloseTo(needed, 6);
    expect(monthsToGoal(1000, needed, r, status.target)).toBeCloseTo(360, 6);
    expect(status.explain[1]).toMatch(/more than 60 years\. In 30 years it would take €[\d,]+ a month\.$/);
  });

  it("explain their calculation", () => {
    const [a] = calculate(plan({ goals: [live] }), [], today).goals;
    expect(a.explain[0]).toBe("€700 a month × 12 ÷ 4% taken out a year = €210,000 needed.");
    expect(a.explain[1]).toMatch(/^€1,000 now \+ €200 a month, growing 7\.5% a year after inflation \(S&P 500, 1988–2022 average\): €210,000 in /);
    expect(a.explain[2]).toMatch(/^One person, with housing: Numbeo/);
  });

  it("keep an item a file names but the list no longer has, so it can be removed", () => {
    const [gone] = calculate(plan({ goals: [{ id: "x", kind: "buy", item: "sabbatical" }] }), [], today).goals;
    expect(gone).toMatchObject({ known: false, name: "Not in the list any more", reachable: false });
  });

  it("follow the withdrawal rate when they are monthly", () => {
    const at4 = goalStatuses([income], calculate(plan(), [], today).scenario, calculate(plan(), [], today).investment, today)[0];
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
