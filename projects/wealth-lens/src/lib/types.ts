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

/** Savings goal, in BASE_CURRENCY and in today's money. */
export interface Goal {
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

/** Compare living costs with rent included, or for someone who owns their home. */
export type Housing = "rent" | "own";

/** Something the user adds to "What it means in real life". */
export interface CustomConnection {
  id: string;
  name: string;
  /** "live": a monthly cost to cover; "buy": a one-off amount. */
  kind: "live" | "buy";
  /** Monthly cost or one-off amount, in today's euros. */
  amount: number;
}

/**
 * The one plan every screen reads and edits. It lives in memory only: nothing
 * is saved, and reloading the page starts over (see lib/app-store.ts).
 * All rates are decimal fractions: 0.07 means 7 %.
 */
export interface Plan {
  /** Amount invested, answered in the first questions; `null` until answered. Priced EUR holdings win. */
  invested: number | null;
  /** Added every month, in BASE_CURRENCY, constant in today's money. */
  monthlyContribution: number;
  /** The goal in euros (today's money). */
  goal: Goal;
  /** ISO code of a country whose cost of living is the active goal instead; `null` = the euro goal. */
  goalCountry: string | null;
  investment: Investment;
  /** Share of the portfolio withdrawn per year once the goal is reached. */
  withdrawalRate: number;
  /** Expected annual inflation, used to translate real figures to nominal. */
  inflation: number;
  housing: Housing;
  /** ISO code of the country always shown next to the cheapest ones. */
  homeCountry: string;
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
