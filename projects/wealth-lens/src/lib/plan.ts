/**
 * Small pure helpers shared by both screens: which capital the report starts
 * from, and which gain "My stocks" shows big.
 */

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
