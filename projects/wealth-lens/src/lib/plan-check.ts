/**
 * "Check your plan": up to three observations about the plan as it is
 * (without a "What if…?"), each shown only when it matters and always with
 * its figure in euros (research/wealth-lens/chequeo.md):
 *
 * - horizon: the plan's years, or a goal, under 5 years away, with money
 *   that moves up and down: how many of the 1,000 possible futures end
 *   below what was put in by then (shown from 1 in 10);
 * - savings: a savings account for 10 years or more: what it keeps in
 *   today's euros, against what was put in and against US stocks, with
 *   both sides of them: what savings give up, and their worst fall.
 *
 * (The concentration check, one stock over a fifth of a mix, went with the
 * individual stocks on 9 October 2026.)
 *
 * Numbers only; the words are in i18n/check-text.ts. It informs: it never
 * says what to buy, what to sell or what weights to choose (research/
 * legal/informar-no-aconsejar.md).
 */

import type { AssetId } from "./assets";
import type { Calculation, CalculatorPlan, GoalStatus } from "./calculator";
import { futureValueWithContributions } from "./finance";
import { CRISES, crisisResults } from "./history-test";
import { resolveInvestment } from "./investment";
import { bandsFor, FUTURES, samplesFor } from "./projections";
import { percentile } from "./simulation";

/** "Short": the plan's years, or a goal, less than this many years away. */
export const SHORT_YEARS = 5;
/** Shown when at least this share of the futures end below what was put in: 1 in 10, the app's "if it goes badly". */
export const BELOW_SHOWN = 0.1;
/** "Long" for a savings account: this many years or more. */
export const SAVINGS_YEARS = 10;
/** What a savings account is set against: US stocks, the one stock series with open data. */
export const STOCKS_REFERENCE: AssetId = "sp500";

export interface HorizonCheck {
  id: "horizon";
  /** Whole years ahead: the plan's, or until the goal. */
  years: number;
  /** The goal it is about; `null` when it is the plan's own years. */
  goal: GoalStatus | null;
  /** What was put in by then: today's money plus every monthly amount. */
  putIn: number;
  /** How many of `futures` end below `putIn`. */
  below: number;
  futures: number;
  /** 1 in 10 futures end below this. */
  bad: number;
}

export interface SavingsCheck {
  id: "savings";
  years: number;
  /** What the savings account keeps after the years, in today's euros (the big number). */
  total: number;
  putIn: number;
  /**
   * US stocks with the same amounts: the typical result, the one 1 in 10
   * futures end below, and their worst fall in the data (its share, and its
   * first and last calendar years).
   */
  stocks: { typical: number; bad: number; rate: number; period: [number, number] | null; fall: WorstFall | null };
}

export interface WorstFall {
  /** 0.46 = −46%, after rising prices. */
  drop: number;
  from: number;
  to: number;
}

export type PlanCheck = HorizonCheck | SavingsCheck;

/** At most one of each, in this order: the risk of the next years first. */
export const CHECK_ORDER = ["horizon", "savings"] as const;

/** The soonest goal the plan reaches later but within SHORT_YEARS. */
function shortGoal(goals: readonly GoalStatus[]): GoalStatus | null {
  const soon = goals.filter((goal) => goal.known && goal.reachable && goal.months > 1e-9 && goal.months < SHORT_YEARS * 12);
  return soon.reduce<GoalStatus | null>((first, goal) => (first === null || goal.months < first.months ? goal : first), null);
}

/** Few years, money that moves: how many possible futures end below what was put in. */
export function horizonCheck(calc: Calculation): HorizonCheck | null {
  const { investment, scenario, result } = calc;
  if (investment.volatility <= 0) return null;
  const goal = result.years < SHORT_YEARS ? null : shortGoal(calc.goals);
  const years = result.years < SHORT_YEARS ? result.years : goal ? Math.ceil(goal.months / 12 - 1e-9) : 0;
  if (years <= 0) return null;
  const putIn = scenario.capital + scenario.monthly * 12 * years;
  if (putIn <= 0) return null;
  const paths = samplesFor(investment, { start: scenario.capital, monthly: scenario.monthly, years }, FUTURES);
  if (paths.length === 0) return null;
  const ends = Float64Array.from(paths, (path) => path[years]).sort();
  const below = ends.filter((value) => value < putIn).length;
  if (below < BELOW_SHOWN * paths.length) return null;
  return { id: "horizon", years, goal, putIn, below, futures: paths.length, bad: percentile(ends, 0.1) };
}

let stocksFall: WorstFall | null | undefined;

/** US stocks' worst fall in the data: the deepest of the crashes "Test my plan" runs through (lib/history-test.ts). */
export function worstStocksFall(): WorstFall | null {
  if (stocksFall !== undefined) return stocksFall;
  const results = Object.values(crisisResults({ parts: [{ asset: STOCKS_REFERENCE, weight: 1 }], rebalance: true, savingsReturn: 0 }, { start: 1, monthly: 0 }, 1));
  let worst: WorstFall | null = null;
  for (const result of results) {
    const crisis = result && CRISES.find((entry) => entry.id === result.id);
    if (!result?.fall || !crisis || (worst && result.fall.drop <= worst.drop)) continue;
    worst = { drop: result.fall.drop, from: crisis.year, to: crisis.year + crisis.years - 1 };
  }
  stocksFall = worst;
  return worst;
}

/** A savings account for many years: what it keeps, and what US stocks gave with the same amounts. */
export function savingsCheck(calc: Calculation, plan: Pick<CalculatorPlan, "pricesOf" | "assumptions">): SavingsCheck | null {
  const { investment, scenario, result } = calc;
  if (investment.investment.kind !== "asset" || investment.investment.asset !== "savings" || result.years < SAVINGS_YEARS) return null;
  // US stocks' own figures, with the same rising prices as the plan.
  const stocks = resolveInvestment({ kind: "asset", asset: STOCKS_REFERENCE }, { pricesOf: plan.pricesOf, assumptions: { ...plan.assumptions, growth: null, volatility: null } });
  const amounts = { start: scenario.capital, monthly: scenario.monthly, years: result.years };
  return {
    id: "savings",
    years: result.years,
    total: result.total,
    putIn: result.putIn,
    stocks: {
      typical: futureValueWithContributions(amounts.start, amounts.monthly, stocks.realReturn, amounts.years),
      bad: bandsFor(stocks, amounts).p10[amounts.years],
      rate: stocks.realReturn,
      period: stocks.period,
      fall: worstStocksFall(),
    },
  };
}

/** The plan's checks, in CHECK_ORDER: none, one, two or three. */
export function planChecks(calc: Calculation, plan: Pick<CalculatorPlan, "pricesOf" | "assumptions">): PlanCheck[] {
  return [horizonCheck(calc), savingsCheck(calc, plan)].filter((check): check is PlanCheck => check !== null);
}
