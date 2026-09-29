/**
 * Everything the screens show about the plan, derived in one place from the
 * one shared plan (lib/app-store.ts). Portfolio, Charts and FIRE all read
 * this, so changing any number updates every screen the same way.
 */

import { costOfLiving, type CountryCost } from "./cost-of-living";
import { monthlyWithdrawal, requiredCapital } from "./finance";
import { monthlyCost } from "./fire";
import { projectGoal, type GoalProjection } from "./goal-projection";
import { resolveInvestment, type ResolvedInvestment } from "./investment";
import { startingCapital, type StartingCapital } from "./plan";
import type { Assumptions, Holding, Housing, Plan } from "./types";

/** The goal the progress bar and the projections aim at. */
export type ActiveGoal =
  | { kind: "amount"; amount: number }
  | {
      kind: "country";
      /** Capital whose withdrawals cover the country's cost of living. */
      amount: number;
      country: CountryCost;
      /** Cost of living there per month, which is also what the capital pays. */
      monthlyCost: number;
    };

/** Capital needed to live in a country: its yearly cost ÷ withdrawal rate. */
export function countryGoalAmount(country: CountryCost, housing: Housing, withdrawalRate: number): number {
  return requiredCapital(monthlyCost(country, housing) * 12, withdrawalRate);
}

export function activeGoal(plan: Plan, countries: readonly CountryCost[] = costOfLiving.countries): ActiveGoal {
  const country = plan.goalCountry ? countries.find((item) => item.code === plan.goalCountry) : undefined;
  if (!country) return { kind: "amount", amount: plan.goal.amount };
  return {
    kind: "country",
    amount: countryGoalAmount(country, plan.housing, plan.withdrawalRate),
    country,
    monthlyCost: monthlyCost(country, plan.housing),
  };
}

export interface PlanView {
  capital: StartingCapital;
  investment: ResolvedInvestment;
  assumptions: Assumptions;
  goal: ActiveGoal;
  projection: GoalProjection;
  /** What the money would pay per month at the plan's withdrawal rate, in today's euros. */
  income: { today: number; atGoal: number };
}

/** `holdings` must already carry their prices (lib/auto-price.ts). */
export function derivePlan(plan: Plan, holdings: readonly Holding[], today: Date): PlanView {
  const capital = startingCapital(holdings, plan.invested);
  const investment = resolveInvestment(plan.investment, holdings);
  const assumptions: Assumptions = {
    realReturn: investment.realReturn,
    monthlyContribution: plan.monthlyContribution,
    inflation: plan.inflation,
  };
  const goal = activeGoal(plan);
  const projection = projectGoal({
    startingCapital: capital.amount,
    goal: { amount: goal.amount, targetDate: plan.goal.targetDate },
    assumptions,
    today,
  });
  return {
    capital,
    investment,
    assumptions,
    goal,
    projection,
    income: {
      today: monthlyWithdrawal(capital.amount, plan.withdrawalRate),
      atGoal: monthlyWithdrawal(goal.amount, plan.withdrawalRate),
    },
  };
}
