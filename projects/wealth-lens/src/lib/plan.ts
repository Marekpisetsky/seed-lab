/**
 * Small pure helpers that tie the three screens together: which capital the
 * projections start from, progress towards the goal, and which countries the
 * FIRE screen shows first.
 */

import type { CountryCost } from "./cost-of-living";
import { summarizeByCurrency, type CurrencySummary } from "./finance";
import { BASE_CURRENCY, type Holding } from "./types";

export interface StartingCapital {
  amount: number;
  /** Holdings (valued at current prices), the first-use answer, or nothing yet. */
  source: "holdings" | "answer" | "none";
}

/**
 * Holdings win once there are any: their EUR value at current prices. Before
 * that, the amount answered in the first-use questions.
 */
export function startingCapital(holdings: readonly Holding[], invested: number | null): StartingCapital {
  if (holdings.length > 0) {
    const eur = summarizeByCurrency(holdings).find((summary) => summary.currency === BASE_CURRENCY);
    return { amount: eur?.value ?? 0, source: "holdings" };
  }
  if (invested !== null) return { amount: invested, source: "answer" };
  return { amount: 0, source: "none" };
}

/** True once the user answered the first-use questions or added holdings. */
export function hasStarted(holdings: readonly Holding[], invested: number | null): boolean {
  return holdings.length > 0 || invested !== null;
}

/** Share of the goal already reached, between 0 and 1. */
export function goalProgress(current: number, goal: number): number {
  if (goal <= 0) return 1;
  return Math.min(1, Math.max(0, current / goal));
}

/**
 * The gain shown big at the top: the EUR totals when there are priced EUR
 * holdings, otherwise the first currency with prices. The rest are listed
 * small, since amounts in different currencies are never added up.
 */
export function headlineGain(summaries: readonly CurrencySummary[]): {
  main: CurrencySummary | null;
  others: CurrencySummary[];
} {
  const priced = summaries.filter((summary) => summary.pricedCount > 0);
  const main = priced.find((summary) => summary.currency === BASE_CURRENCY) ?? priced[0] ?? null;
  return { main, others: priced.filter((summary) => summary !== main) };
}

/**
 * The countries shown by default: the `count` cheapest, plus the home
 * country when it is not already among them. Input must be sorted cheapest
 * first; order is kept.
 */
export function featuredCountries<T extends { country: CountryCost }>(rows: readonly T[], homeCode: string, count = 5): T[] {
  const featured = rows.slice(0, count);
  const home = rows.find((row) => row.country.code === homeCode);
  if (home && !featured.includes(home)) featured.push(home);
  return featured;
}
