/**
 * Shared domain types. Everything the user owns or configures is described
 * here; market data (price series) and static datasets live in their own
 * modules.
 */

import type { AssetId } from "./assets";

/** The euro goal of version 1 plans, in euros and in today's money. */
export interface LegacyGoal {
  amount: number;
  /** Optional target date, ISO `YYYY-MM-DD`. */
  targetDate: string | null;
}

/**
 * What the plan's money is invested in; it sets the standard growth and
 * swings of every projection (lib/investment.ts). Only what has a long
 * history and a known range is projected; a single stock never is.
 * - asset: US stocks, German government bonds, gold or a savings account
 *   (lib/assets.ts);
 * - mix: assets with weights in percent the user sets (lib/mix.ts),
 *   drifting with growth or rebalanced every year;
 * - custom: "Custom growth", the growth and swings the user types
 *   (Plan.assumptions), with no asset behind them.
 */
export type Investment =
  | { kind: "asset"; asset: AssetId }
  | { kind: "mix"; parts: MixPart[]; rebalance: boolean }
  | { kind: "custom" };

/** A part of a mix: an asset and its weight in percent (lib/mix.ts). */
export interface MixPart {
  asset: AssetId;
  weight: number;
}

/**
 * What the user changed of the standard assumptions (the investment's own
 * figures and the country's inflation); `null` keeps the standard one.
 */
export interface AssumptionOverrides {
  /**
   * Growth a year after rising prices, as the user typed it in "My %"
   * (Custom growth): the one number the calculator shows; its equivalent
   * before rising prices is only shown beside it.
   */
  growth: number | null;
  /** Swings a year: the standard deviation of yearly log returns. */
  volatility: number | null;
  /** Inflation a year, instead of the "Rising prices in" country's reference. */
  inflation: number | null;
}

export const STANDARD_ASSUMPTIONS: AssumptionOverrides = { growth: null, volatility: null, inflation: null };

/**
 * A goal the user adds to "My goals": optional, as many as they like, each
 * worked out on its own against the same plan. Nothing about the user's
 * life is assumed; they say what the goal costs (an example in grey shows
 * the kind of figure, never a price list).
 * - live: living in a country of the cost-of-living list, at what an
 *   average person there lives on (official data, seed-kit);
 * - buy-own: something of the user's own, at the price they give;
 * - amount: an amount to reach;
 * - monthly: a monthly amount the money should pay (expenses, a mortgage,
 *   anything), with an optional label the user writes.
 */
export type Goal = (
  | { id: string; kind: "live"; country: string }
  | { id: string; kind: "buy-own"; name: string; amount: number }
  | { id: string; kind: "amount"; amount: number; label?: string }
  | { id: string; kind: "monthly"; amount: number; label: string | null }
  /** Total monthly living expenses, including housing. Country is only the estimate's source; null means personal expenses. */
  | { id: string; kind: "freedom"; amount: number; country: string | null; estimateDate?: string }
) & { important?: true };

/** A goal before it gets its id. */
export type NewGoal = Goal extends infer G ? (G extends Goal ? Omit<G, "id"> : never) : never;

/**
 * The one plan every screen reads and edits. It lives in memory only: nothing
 * is saved, and reloading the page starts over (see lib/app-store.ts).
 * All rates are decimal fractions: 0.07 means 7 %.
 */
export interface Plan {
  /** Amount invested, typed in the calculator; `null` until it is typed (a first visit asks). */
  invested: number | null;
  /** Added every month, in euros, constant in today's money; `null` until it is typed. */
  monthlyContribution: number | null;
  investment: Investment;
  /** How many years ahead the result looks: 1 to 60. */
  years: number;
  /** Share of the money taken out per year for "It could pay you". */
  withdrawalRate: number;
  /**
   * "Rising prices in" (More options): the country (a code of the
   * cost-of-living list) whose reference inflation turns growth before
   * inflation into growth after it.
   */
  pricesOf: string;
  /** What the user changed of the standard assumptions. */
  assumptions: AssumptionOverrides;
  /** Goals the user added, in that order; none at first. */
  goals: Goal[];
}
