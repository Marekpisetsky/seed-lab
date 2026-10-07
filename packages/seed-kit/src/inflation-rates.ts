/**
 * Each country's reference inflation rate, and nothing else: what a page
 * needs to turn a growth after rising prices into one before them without
 * loading the whole cost-of-living dataset (cost-of-living.ts, which brings
 * every country's costs and sources). Made from that dataset by
 * scripts/inflation-rates.ts; a test checks that the two agree.
 */

import data from "./data/inflation-rates.json" with { type: "json" };

/** The country "Rising prices in" (Wealth Lens' inflation) starts with. */
export const DEFAULT_PRICES_OF = "NL";

const RATES: Readonly<Record<string, number>> = data.rates;

/** A country of the list. */
export function isPriceCountry(code: string): boolean {
  return Object.hasOwn(RATES, code);
}

/** The reference inflation rate of a country of the list, or the default country's for any other code. */
export function referenceRate(code: string): number {
  return RATES[code] ?? RATES[DEFAULT_PRICES_OF];
}
