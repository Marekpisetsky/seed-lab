/**
 * Countries, currencies and official exchange rates, for any Horalis tool,
 * in the browser too (light: two small tables made at build time by
 * scripts/money-tables.ts from the official data, src/official/).
 *
 * - Every country's currency: ISO 4217, from Unicode CLDR.
 * - Every currency's official exchange rate against the US dollar, a
 *   yearly average (World Bank, PA.NUS.FCRF). A conversion always uses one
 *   year's rates for both currencies and says which year: never a live
 *   rate, never a rate typed by hand.
 * - Where someone is: the country their browser's language names (es-MX →
 *   Mexico), worked out on the device; never their location.
 */

import currencies from "./data/currencies.json" with { type: "json" };
import exchangeRates from "./data/exchange-rates.json" with { type: "json" };

// Light enough for the browser on their own (no tables): kept beside the
// code they belong to, and offered here too.
export { countryFromLanguage } from "./detect.ts";
export { roundMoney } from "./format.ts";

const CURRENCIES: Readonly<Record<string, string>> = currencies;
const RATES: Readonly<Record<string, Readonly<Record<string, number>>>> = exchangeRates.rates;

/** Where the rates come from, for a page's sources. */
export const EXCHANGE_RATES_SOURCE = {
  source: exchangeRates.source,
  license: exchangeRates.license,
  url: exchangeRates.url,
  retrievedOn: exchangeRates.retrievedOn,
  provisional: exchangeRates.provisional as string | null,
};

/** A country's currency (ISO 4217): "PE" → "PEN"; `null` for a code it does not know. */
export function currencyOf(country: string): string | null {
  return CURRENCIES[country] ?? null;
}

/** Every currency with official rates, sorted by code. */
export const RATED_CURRENCIES: readonly string[] = Object.keys(RATES).sort();

/** Units of `currency` per US dollar in `year`, or `null` if the data have no rate for that year. */
export function ratePerDollar(currency: string, year: number): number | null {
  return RATES[currency]?.[String(year)] ?? null;
}

/** The latest year with a rate for every one of `currencies`; `null` if they share none. */
export function latestSharedYear(...currencyCodes: string[]): number | null {
  const years = currencyCodes.map((code) => new Set(Object.keys(RATES[code] ?? {}).map(Number)));
  const shared = [...(years[0] ?? [])].filter((year) => years.every((set) => set.has(year)));
  return shared.length > 0 ? Math.max(...shared) : null;
}

export interface Converted {
  value: number;
  /** The year of the rates used: both currencies at that year's average. */
  year: number;
  /** Units of `to` for one unit of `from` that year. */
  rate: number;
}

/**
 * `amount` of `from` in `to`, at the official rates of `year` (the latest
 * year both have when `year` is not given, or the nearest year both have
 * when `year` lacks one, which the result says). `null` when no year has
 * both.
 */
export function convert(amount: number, from: string, to: string, year?: number): Converted | null {
  if (from === to) return { value: amount, year: year ?? latestSharedYear(from) ?? 0, rate: 1 };
  let at = year;
  if (at === undefined || ratePerDollar(from, at) === null || ratePerDollar(to, at) === null) {
    const shared = Object.keys(RATES[from] ?? {})
      .map(Number)
      .filter((candidate) => ratePerDollar(to, candidate) !== null);
    if (shared.length === 0) return null;
    at = year === undefined ? Math.max(...shared) : shared.reduce((best, candidate) => (Math.abs(candidate - year) < Math.abs(best - year) || (Math.abs(candidate - year) === Math.abs(best - year) && candidate > best) ? candidate : best));
  }
  const rate = (ratePerDollar(to, at) ?? Number.NaN) / (ratePerDollar(from, at) ?? Number.NaN);
  return { value: amount * rate, year: at, rate };
}
