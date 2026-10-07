/**
 * "Check your plan": up to three observations about the plan as it is
 * (without a "What if…?"), each shown only when it matters and always with
 * its figure in euros (research/wealth-lens/chequeo.md):
 *
 * - horizon: the plan's years, or a goal, under 5 years away, with money
 *   that moves up and down: how many of the 1,000 possible futures end
 *   below what was put in by then (shown from 1 in 10);
 * - concentration: one stock over a fifth of the mix the plan invests in,
 *   or of My portfolio (index funds aside): its euros and its worst fall;
 * - savings: a savings account for 10 years or more: what it keeps in
 *   today's euros, against what was put in and against world stocks.
 *
 * Numbers only; the words are in i18n/check-text.ts. It informs: it never
 * says what to buy, what to sell or what weights to choose (research/
 * legal/informar-no-aconsejar.md).
 */

import type { AssetId } from "./assets";
import type { Calculation, CalculatorPlan, GoalStatus } from "./calculator";
import { futureValueWithContributions, holdingValue } from "./finance";
import { resolveInvestment } from "./investment";
import { INDEX_TRACKERS, instrumentForHolding, MARKET, type PricesFile } from "./market-data";
import { CONCENTRATION_LIMIT, mixStock } from "./mix";
import { referenceFor } from "./portfolio";
import { bandsFor, FUTURES, samplesFor } from "./projections";
import { percentile } from "./simulation";
import { BASE_CURRENCY, type Holding } from "./types";

/** "Short": the plan's years, or a goal, less than this many years away. */
export const SHORT_YEARS = 5;
/** Shown when at least this share of the futures end below what was put in: 1 in 10, the app's "if it goes badly". */
export const BELOW_SHOWN = 0.1;
/** "Long" for a savings account: this many years or more. */
export const SAVINGS_YEARS = 10;
/** One stock over this share of a mix or of My portfolio: a fifth, the line the mix already uses (lib/mix.ts). */
export { CONCENTRATION_LIMIT };
/** The world reference a savings account is set against: world stocks, the "World" example (MSCI World). */
export const WORLD_REFERENCE: AssetId = "world";

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

export interface ConcentrationCheck {
  id: "concentration";
  where: "mix" | "portfolio";
  /** Its ticker ("NVDA"). */
  name: string;
  /** Its share, 0 to 1. */
  share: number;
  /** Its euros: of today's money, or of the total at the end when there is no money today (a mix with only a monthly amount). */
  amount: number;
  total: number;
  atEnd: boolean;
  /** Its worst fall from a peak in the stored prices (0.57 = −57 %), and since when; `null` without prices. */
  fall: { max: number; from: string } | null;
  /** Its change over the last 12 months; `null` without prices. */
  change1y: number | null;
  /** The index it grows like in the plan. */
  reference: AssetId;
}

export interface SavingsCheck {
  id: "savings";
  years: number;
  /** What the savings account keeps after the years, in today's euros (the big number). */
  total: number;
  putIn: number;
  /** World stocks with the same amounts: the typical result and the one 1 in 10 futures end below. */
  world: { typical: number; bad: number; rate: number; period: [number, number] | null };
}

export type PlanCheck = HorizonCheck | ConcentrationCheck | SavingsCheck;

/** At most one of each, in this order: the risk of the next years first. */
export const CHECK_ORDER = ["horizon", "concentration", "savings"] as const;

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

/** An index fund: an ETF of the list, or a ticker of a well-known one. */
function isIndexFund(holding: Holding): boolean {
  const instrument = instrumentForHolding(holding.ticker, holding.currency);
  if (instrument) return instrument.kind === "etf";
  const ticker = holding.ticker.trim().toUpperCase().split(".")[0];
  return Object.values(INDEX_TRACKERS).some((list) => list.includes(ticker));
}

/** One stock over a fifth: of the mix the plan invests in, or else of My portfolio's holdings in euros. */
export function concentrationCheck(calc: Calculation, holdings: readonly Holding[], market: PricesFile = MARKET): ConcentrationCheck | null {
  const { investment } = calc.investment;
  if (investment.kind === "mix") {
    const stocks = investment.parts.filter((part) => part.stock !== undefined);
    const biggest = stocks.reduce<(typeof stocks)[number] | null>((top, part) => (top === null || part.weight > top.weight ? part : top), null);
    const instrument = mixStock(biggest?.stock);
    if (!biggest || !instrument || biggest.weight / 100 <= CONCENTRATION_LIMIT) return null;
    const share = biggest.weight / 100;
    const atEnd = calc.scenario.capital <= 0;
    const total = atEnd ? calc.result.total : calc.scenario.capital;
    const prices = market.prices[instrument.id];
    return {
      id: "concentration",
      where: "mix",
      name: instrument.id,
      share,
      amount: share * total,
      total,
      atEnd,
      fall: prices?.drawdown ?? null,
      change1y: prices?.change1y ?? null,
      reference: biggest.asset,
    };
  }
  const priced = holdings
    .filter((holding) => holding.currency === BASE_CURRENCY)
    .map((holding) => ({ holding, value: holdingValue(holding) ?? 0 }))
    .filter((entry) => entry.value > 0);
  const total = priced.reduce((sum, entry) => sum + entry.value, 0);
  const biggest = priced.filter((entry) => !isIndexFund(entry.holding)).sort((a, b) => b.value - a.value)[0];
  if (!biggest || total <= 0 || biggest.value / total <= CONCENTRATION_LIMIT) return null;
  const instrument = instrumentForHolding(biggest.holding.ticker, biggest.holding.currency);
  const prices = instrument ? market.prices[instrument.id] : undefined;
  return {
    id: "concentration",
    where: "portfolio",
    name: biggest.holding.ticker,
    share: biggest.value / total,
    amount: biggest.value,
    total,
    atEnd: false,
    fall: prices?.drawdown ?? null,
    change1y: prices?.change1y ?? null,
    reference: referenceFor(biggest.holding).asset,
  };
}

/** A savings account for many years: what it keeps, and what world stocks gave with the same amounts. */
export function savingsCheck(calc: Calculation, plan: Pick<CalculatorPlan, "pricesOf" | "assumptions">): SavingsCheck | null {
  const { investment, scenario, result } = calc;
  if (investment.investment.kind !== "asset" || investment.investment.asset !== "savings" || result.years < SAVINGS_YEARS) return null;
  // World stocks' own figures, with the same rising prices as the plan.
  const world = resolveInvestment({ kind: "asset", asset: WORLD_REFERENCE }, [], { pricesOf: plan.pricesOf, assumptions: { ...plan.assumptions, growth: null, volatility: null } });
  const amounts = { start: scenario.capital, monthly: scenario.monthly, years: result.years };
  return {
    id: "savings",
    years: result.years,
    total: result.total,
    putIn: result.putIn,
    world: {
      typical: futureValueWithContributions(amounts.start, amounts.monthly, world.realReturn, amounts.years),
      bad: bandsFor(world, amounts).p10[amounts.years],
      rate: world.realReturn,
      period: world.period,
    },
  };
}

/** The plan's checks, in CHECK_ORDER: none, one, two or three. */
export function planChecks(calc: Calculation, plan: Pick<CalculatorPlan, "pricesOf" | "assumptions">, holdings: readonly Holding[], market: PricesFile = MARKET): PlanCheck[] {
  return [horizonCheck(calc), concentrationCheck(calc, holdings, market), savingsCheck(calc, plan)].filter((check): check is PlanCheck => check !== null);
}
