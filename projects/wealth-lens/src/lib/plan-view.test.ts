import { describe, expect, it } from "vitest";
import { costOfLiving } from "./cost-of-living";
import { parseIsoDate } from "./dates";
import { monthlyWithdrawal, monthsToGoal } from "./finance";
import { INDEXES } from "./indexes";
import { activeGoal, countryGoalAmount, derivePlan } from "./plan-view";
import type { Holding, Plan } from "./types";
import { DEFAULT_PLAN } from "./validation";

const today = parseIsoDate("2026-09-29");
const india = costOfLiving.countries.find((country) => country.code === "IN");
if (!india) throw new Error("India missing from the dataset");

const plan: Plan = { ...DEFAULT_PLAN, invested: 20_000, monthlyContribution: 200, goal: { amount: 250_000, targetDate: null } };

describe("monthlyWithdrawal", () => {
  it("is capital × rate ÷ 12", () => {
    expect(monthlyWithdrawal(300_000, 0.04)).toBeCloseTo(1000, 10);
    expect(monthlyWithdrawal(99_000, 0.04)).toBeCloseTo(330, 10);
    expect(monthlyWithdrawal(0, 0.04)).toBe(0);
  });
});

describe("country → goal", () => {
  it("needs the yearly cost of living divided by the withdrawal rate", () => {
    // India with rent: €330 a month → €3,960 a year → ÷ 4 % = €99,000.
    expect(india.monthlyCostEur.withRent).toBe(330);
    expect(countryGoalAmount(india, "rent", 0.04)).toBeCloseTo(99_000, 6);
    expect(countryGoalAmount(india, "own", 0.04)).toBeCloseTo(india.monthlyCostEur.withoutRent * 300, 6);
    expect(countryGoalAmount(india, "rent", 0.03)).toBeCloseTo(132_000, 6);
  });

  it("becomes the active goal, and pays exactly the country's monthly cost", () => {
    const goal = activeGoal({ ...plan, goalCountry: "IN" });
    expect(goal).toMatchObject({ kind: "country", country: { code: "IN" }, monthlyCost: 330 });
    expect(goal.amount).toBeCloseTo(99_000, 6);
    expect(monthlyWithdrawal(goal.amount, plan.withdrawalRate)).toBeCloseTo(330, 6);
  });

  it("goes back to the euro goal, which was kept", () => {
    expect(activeGoal({ ...plan, goalCountry: null })).toEqual({ kind: "amount", amount: 250_000 });
    expect(activeGoal({ ...plan, goalCountry: "ZZ" })).toEqual({ kind: "amount", amount: 250_000 });
  });
});

describe("derivePlan: one plan feeds every figure", () => {
  it("projects the euro goal with the chosen index's average growth", () => {
    const view = derivePlan(plan, [], today);
    expect(view.capital).toEqual({ amount: 20_000, source: "answer" });
    expect(view.investment.name).toBe("S&P 500");
    expect(view.assumptions.realReturn).toBe(INDEXES.sp500.averageReturn);
    expect(view.goal).toEqual({ kind: "amount", amount: 250_000 });
    expect(view.income.today).toBeCloseTo(20_000 * 0.04 / 12, 10);
    expect(view.income.atGoal).toBeCloseTo(250_000 * 0.04 / 12, 10);
  });

  it("aims at a country's capital and reports when it is reached", () => {
    const view = derivePlan({ ...plan, goalCountry: "IN" }, [], today);
    expect(view.goal.amount).toBeCloseTo(99_000, 6);
    expect(view.income.atGoal).toBeCloseTo(330, 6);
    // €20,000 + €200/month at the S&P 500's 6.6 % gets to €99,000 in 162.7 months (Apr 2040).
    expect(view.projection.months).toBeCloseTo(monthsToGoal(20_000, 200, INDEXES.sp500.averageReturn, 99_000), 6);
    expect(view.projection.months).toBeCloseTo(162.7, 1);
    expect(view.projection.reachDate?.toISOString().slice(0, 7)).toBe("2040-04");
  });

  it("updates everything when one input changes", () => {
    const base = derivePlan({ ...plan, goalCountry: "IN" }, [], today);
    const moreMonthly = derivePlan({ ...plan, goalCountry: "IN", monthlyContribution: 800 }, [], today);
    expect(moreMonthly.projection.months).toBeLessThan(base.projection.months);
    const lowerRate = derivePlan({ ...plan, goalCountry: "IN", withdrawalRate: 0.03 }, [], today);
    expect(lowerRate.goal.amount).toBeCloseTo(132_000, 6);
    expect(lowerRate.projection.months).toBeGreaterThan(base.projection.months);
    const nasdaq = derivePlan({ ...plan, goalCountry: "IN", investment: { kind: "index", index: "nasdaq100" } }, [], today);
    expect(nasdaq.projection.months).toBeLessThan(base.projection.months);
  });

  it("starts from the priced euro holdings once there are any", () => {
    const holdings: Holding[] = [
      { id: "1", ticker: "VWCE", quantity: 100, costBasis: 9000, currency: "EUR", currentPrice: 120, priceSource: "manual", priceDate: null },
    ];
    const view = derivePlan({ ...plan, investment: { kind: "portfolio" } }, holdings, today);
    expect(view.capital).toEqual({ amount: 12_000, source: "holdings" });
    expect(view.investment.name).toBe("My portfolio");
    expect(view.assumptions.realReturn).toBeCloseTo(INDEXES.world.averageReturn, 12);
  });
});
