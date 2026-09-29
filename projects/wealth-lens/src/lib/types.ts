/**
 * Shared domain types. Everything the user owns or configures is described
 * here; market data (price series) and static datasets live in their own
 * modules.
 */

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
   * Latest price per share in `currency`, entered by the user.
   * `null` means "unknown": the holding is left out of value and gain totals.
   */
  currentPrice: number | null;
}

/** Savings goal, in BASE_CURRENCY and in today's money. */
export interface Goal {
  amount: number;
  /** Optional target date, ISO `YYYY-MM-DD`. */
  targetDate: string | null;
}

/** All rates are decimal fractions: 0.07 means 7 %. */
export interface Assumptions {
  /** Expected annual return AFTER inflation (real, not nominal). */
  realReturn: number;
  /** Share of the portfolio withdrawn per year in retirement. */
  withdrawalRate: number;
  /** Monthly contribution in BASE_CURRENCY, constant in today's money. */
  monthlyContribution: number;
  /** Expected annual inflation, used to translate real figures to nominal. */
  inflation: number;
}

/** Settings of the FIRE simulator. */
export interface FireSettings {
  /** Capital typed by the user; `null` means "use my EUR portfolio value". */
  capitalOverride: number | null;
  /** Compare costs with rent included, or for someone who owns their home. */
  housing: "rent" | "own";
}
