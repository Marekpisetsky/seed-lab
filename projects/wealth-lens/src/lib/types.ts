/**
 * Shared domain types. Everything the user owns or configures is described
 * here; market data (price series) and static datasets live in their own
 * modules.
 */

import type { IndexId } from "./index-ids";

/** ISO 4217 currency code, upper case (e.g. "EUR", "USD"). */
export type CurrencyCode = string;

/**
 * The goal, the FIRE simulator and the cost-of-living dataset are expressed in
 * euros (see README). Holdings may be in any currency; the app never converts
 * between currencies, it only groups by them.
 */
export const BASE_CURRENCY: CurrencyCode = "EUR";

/** A position the user holds, entered by hand or imported from a CSV. */
export interface Holding {
  id: string;
  /** Ticker as the user knows it (e.g. "AAPL", "VWCE"). */
  ticker: string;
  /** Number of shares/units; fractional shares are allowed. */
  quantity: number;
  /** Total amount paid for the position (not per share), in `currency`. */
  costBasis: number;
  currency: CurrencyCode;
  /**
   * Latest price per share in `currency`. `null` means "unknown": the holding
   * is left out of value and gain totals.
   */
  currentPrice: number | null;
  /**
   * "auto": filled with the latest close from the price source and refreshed;
   * "manual": typed by the user and never overwritten automatically.
   */
  priceSource: "auto" | "manual";
  /** Trading day of an automatic price (`YYYY-MM-DD`); `null` otherwise. */
  priceDate: string | null;
}

/** The fields a user or a file provides; price bookkeeping is added on top. */
export type HoldingInput = Omit<Holding, "id" | "priceSource" | "priceDate">;

/** The euro goal of version 1 plans, in BASE_CURRENCY and in today's money. */
export interface LegacyGoal {
  amount: number;
  /** Optional target date, ISO `YYYY-MM-DD`. */
  targetDate: string | null;
}

/**
 * What the plan's money is invested in; it sets the growth used for every
 * projection and the history used by the Monte Carlo simulation.
 * - index: one of the three indexes (bought through its well-known ETF);
 * - stock: a curated stock, projected with its closest index (a single
 *   stock's past is shown, never projected);
 * - portfolio: the user's holdings, each index weighted by holding value;
 * - custom: a growth rate the user types.
 */
export type Investment =
  | { kind: "index"; index: IndexId }
  | { kind: "stock"; id: string }
  | { kind: "portfolio" }
  | { kind: "custom"; realReturn: number };

/**
 * A goal the user adds to "My goals": optional, as many as they like, each
 * worked out on its own against the same plan. Nothing about the user's
 * life is assumed; they say what the goal costs, or pick it from a list.
 * - live: living in a country of the cost-of-living list, with or without
 *   paying for housing there;
 * - buy: an item of the "Buy it" list (src/data/connections.json, its id);
 * - buy-own: something of the user's own, at the price they give;
 * - amount: an amount to reach;
 * - monthly: a monthly amount the money should pay (expenses, a mortgage,
 *   anything), with an optional label the user writes.
 */
export type Goal =
  | { id: string; kind: "live"; country: string; housing: boolean }
  | { id: string; kind: "buy"; item: string }
  | { id: string; kind: "buy-own"; name: string; amount: number }
  | { id: string; kind: "amount"; amount: number }
  | { id: string; kind: "monthly"; amount: number; label: string | null };

/** A goal before it gets its id. */
export type NewGoal = Goal extends infer G ? (G extends Goal ? Omit<G, "id"> : never) : never;

/**
 * The one plan every screen reads and edits. It lives in memory only: nothing
 * is saved, and reloading the page starts over (see lib/app-store.ts).
 * All rates are decimal fractions: 0.07 means 7 %.
 */
export interface Plan {
  /** Amount invested, typed in the calculator. Priced EUR holdings win. */
  invested: number;
  /** Added every month, in BASE_CURRENCY, constant in today's money. */
  monthlyContribution: number;
  investment: Investment;
  /** How many years ahead the result looks: 1 to 60. */
  years: number;
  /** Share of the money taken out per year for "It could pay you". */
  withdrawalRate: number;
  /** Expected annual inflation, used to translate real figures to nominal. */
  inflation: number;
  /** Goals the user added, in that order; none at first. */
  goals: Goal[];
}

/** Growth assumptions of a projection. */
export interface Assumptions {
  /** Expected annual return AFTER inflation (real, not nominal). */
  realReturn: number;
  /** Monthly contribution in BASE_CURRENCY, constant in today's money. */
  monthlyContribution: number;
  /** Expected annual inflation, used to translate real figures to nominal. */
  inflation: number;
}
