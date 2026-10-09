/**
 * The plan's currency: any currency with an official exchange rate in the
 * year of the countries' prices (seed-kit money.ts, World Bank yearly
 * averages). A plan's amounts are in it; the countries' costs are shown in
 * it at that year's official rate, and the app's steps ("+€50 a month")
 * are the same size of money in it, rounded to a round figure.
 *
 * Growth is each investment's own after rising prices: changes between
 * currencies are not counted (How it works says so).
 */

import { roundMoney } from "@seed-kit/format.ts";
import { currencyOf, ratePerDollar, RATED_CURRENCIES } from "@seed-kit/money.ts";
import { costOfLiving, type CountryCost } from "./cost-of-living";

/** A first visit's currency, until the browser's language names a country (lib/start.ts). */
export const DEFAULT_CURRENCY = "EUR";

/** The year of the countries' prices, and so of the rates that convert them. */
export const PRICE_YEAR = costOfLiving.priceYear;

/** Every currency a plan can be in, by code: the ones with an official rate in PRICE_YEAR. */
export const PLAN_CURRENCIES: readonly string[] = RATED_CURRENCIES.filter((code) => ratePerDollar(code, PRICE_YEAR) !== null);

export function isPlanCurrency(value: unknown): value is string {
  return typeof value === "string" && PLAN_CURRENCIES.includes(value);
}

/** A country's currency when a plan can be in it, else `null`. */
export function planCurrencyOf(country: string): string | null {
  const currency = currencyOf(country);
  return isPlanCurrency(currency) ? currency : null;
}

/** Units of `currency` per euro in PRICE_YEAR. */
function perEuro(currency: string): number {
  return (ratePerDollar(currency, PRICE_YEAR) ?? Number.NaN) / (ratePerDollar(DEFAULT_CURRENCY, PRICE_YEAR) ?? Number.NaN);
}

/** What an average person lives on a month in a country, in `currency`, rounded as the pages show a cost. */
export function costIn(country: Pick<CountryCost, "monthlyCostUsd">, currency: string): number {
  return roundMoney(country.monthlyCostUsd * (ratePerDollar(currency, PRICE_YEAR) ?? Number.NaN));
}

/** A country of the list with its monthly cost in the plan's currency. */
export interface LocalCost extends CountryCost {
  /** A month, in the plan's currency (costIn). */
  monthlyCost: number;
}

const byCurrency = new Map<string, LocalCost[]>();

/** Every country of the list, its cost in `currency`; made once per currency. */
export function countriesIn(currency: string, countries: readonly CountryCost[] = costOfLiving.countries): LocalCost[] {
  const cached = countries === costOfLiving.countries ? byCurrency.get(currency) : undefined;
  if (cached) return cached;
  const local = countries.map((country) => ({ ...country, monthlyCost: costIn(country, currency) }));
  if (countries === costOfLiving.countries) byCurrency.set(currency, local);
  return local;
}

/** 1, 2 or 5 times a power of ten, the nearest on a log scale: 54 → 50, 8100 → 10,000. */
export function roundFigure(value: number): number {
  if (!(value > 0) || !Number.isFinite(value)) return 1;
  const power = 10 ** Math.floor(Math.log10(value));
  return [1, 2, 5, 10]
    .map((step) => step * power)
    .reduce((best, candidate) => (Math.abs(Math.log(candidate / value)) < Math.abs(Math.log(best / value)) ? candidate : best));
}

/** The app's €50 step in `currency`, as a round figure: 50 in euros or dollars, ¥10,000, S/ 200. */
export function moneyStep(currency: string): number {
  return currency === DEFAULT_CURRENCY ? 50 : roundFigure(50 * perEuro(currency));
}
