/**
 * Everything the "time to goal" panel shows, computed in one pure function
 * from the finance primitives, so the component only renders.
 */

import { addMonths, parseIsoDate, wholeMonthsBetween } from "./dates";
import {
  futureValueWithContributions,
  monthsToGoal,
  nominalReturn,
  requiredMonthlyContribution,
} from "./finance";
import type { Assumptions, Goal } from "./types";

/** Returns shown side by side so the effect of the assumption is visible. */
export const SENSITIVITY_RATES = [0.03, 0.05, 0.07, 0.1] as const;

export interface TargetDateProjection {
  date: Date;
  /** Whole months from today; zero or negative when the date has passed. */
  months: number;
  /** Projected balance on that date with the current contribution. */
  projectedValue: number;
  /** projectedValue − goal: positive means ahead of the goal. */
  gap: number;
  /** Monthly contribution that would land exactly on the goal by that date. */
  requiredContribution: number;
}

export interface GoalProjection {
  /** Fractional months until the goal; 0 if met, Infinity if never. */
  months: number;
  /** Month in which the goal is reached; `null` if never. */
  reachDate: Date | null;
  /** The real return expressed in nominal terms, for context. */
  nominalReturn: number;
  target: TargetDateProjection | null;
  sensitivity: { rate: number; months: number }[];
}

export interface GoalProjectionInput {
  startingCapital: number;
  goal: Goal;
  assumptions: Assumptions;
  /** Today's date at 00:00 UTC, passed in to keep the function pure. */
  today: Date;
}

export function projectGoal({ startingCapital, goal, assumptions, today }: GoalProjectionInput): GoalProjection {
  const { realReturn, monthlyContribution, inflation } = assumptions;
  const months = monthsToGoal(startingCapital, monthlyContribution, realReturn, goal.amount);

  let target: TargetDateProjection | null = null;
  if (goal.targetDate !== null) {
    const date = parseIsoDate(goal.targetDate);
    const monthsLeft = wholeMonthsBetween(today, date);
    const horizon = Math.max(0, monthsLeft);
    const projectedValue = futureValueWithContributions(startingCapital, monthlyContribution, realReturn, horizon / 12);
    target = {
      date,
      months: monthsLeft,
      projectedValue,
      gap: projectedValue - goal.amount,
      requiredContribution: requiredMonthlyContribution(startingCapital, realReturn, horizon, goal.amount),
    };
  }

  return {
    months,
    reachDate: Number.isFinite(months) ? addMonths(today, Math.ceil(months - 1e-9)) : null,
    nominalReturn: nominalReturn(realReturn, inflation),
    target,
    sensitivity: SENSITIVITY_RATES.map((rate) => ({
      rate,
      months: monthsToGoal(startingCapital, monthlyContribution, rate, goal.amount),
    })),
  };
}
