/**
 * Cost Lens's calculation: what a monthly amount in one country is worth
 * in another, from seed-kit's cost of living (official World Bank data). Pure (no
 * page, no browser, no data of its own: it gets the countries), so the
 * page built ahead, the browser and the tests run the same code.
 *
 * Every amount is in a country's own currency: the one typed in the
 * currency of where you live, the result in the currency of where you
 * compare, at the official yearly rates (seed-kit money.ts). Every figure
 * is an estimate: the countries' costs are national averages.
 */

import { countryFromLanguage } from "../../../packages/seed-kit/src/detect.ts";
import { roundMoney } from "../../../packages/seed-kit/src/format.ts";

/** A country as Cost Lens uses it: what an average person there lives on a month, housing included, in US dollars, and its currency. */
export interface Country {
  /** ISO 3166-1 alpha-2. */
  code: string;
  /** In the page's language, as a list shows it ("Netherlands"). */
  name: string;
  /** As a sentence says it ("the Netherlands"). */
  sentence: string;
  /** A month, in US dollars of the data's price year. */
  cost: number;
  /** The currency its amounts are in (ISO 4217): its own, or "USD" when the data have no rate for its own in the prices' year. */
  currency: string;
  /** Its own currency (ISO 4217), even when its amounts are in dollars. */
  ownCurrency: string;
  /** Units of that currency per US dollar, the official yearly average of `rateYear`. */
  perDollar: number;
  /** The year of that rate: the year of the prices. */
  rateYear: number;
}

/** What an average person lives on a month there, in its own currency, rounded as the pages show a cost. */
export function monthlyCost(country: Country): number {
  return roundMoney(country.cost * country.perDollar);
}

/** An amount that can be compared: a number above zero. */
function usable(amount: number): boolean {
  return Number.isFinite(amount) && amount > 0;
}

/**
 * What you would need a month in `to`, in its currency, to live like
 * `amount` a month in `from`, in its currency: the amount in dollars
 * times how much more (or less) living costs there, in `to`'s currency.
 * Null without a usable amount.
 */
export function equivalent(amount: number, from: Country, to: Country): number | null {
  if (!usable(amount)) return null;
  return ((amount / from.perDollar) * to.cost * to.perDollar) / from.cost;
}

/**
 * The amount typed for `from`, in `to`'s currency instead: when the person
 * changes where they live, their money stays the same money (1950 € in the
 * Netherlands become about 290,000 ¥ when they pick Japan).
 */
export function sameMoney(amount: number, from: Country, to: Country): number {
  return (amount * to.perDollar) / from.perDollar;
}

/** Units of `to`'s currency for one of `from`'s, at the official rates. */
export function exchangeRate(from: Country, to: Country): number {
  return to.perDollar / from.perDollar;
}

/** How many times as far money from `from` goes in `to`: 2 is twice as far, 0.5 half as far. */
export function reach(from: Country, to: Country): number {
  return from.cost / to.cost;
}

export interface Ranked {
  country: Country;
  reach: number;
}

/**
 * The countries where money from `from` goes furthest and least far,
 * `count` of each, `from` itself left out. Equal reaches keep the list's order.
 */
export function extremes(from: Country, countries: readonly Country[], count = 5): { furthest: Ranked[]; least: Ranked[] } {
  const ranked = countries
    .filter((country) => country.code !== from.code)
    .map((country) => ({ country, reach: reach(from, country) }))
    .sort((a, b) => b.reach - a.reach);
  const size = Math.min(count, Math.floor(ranked.length / 2));
  return { furthest: ranked.slice(0, size), least: ranked.slice(ranked.length - size).reverse() };
}

/** A country by its code, or undefined. */
export function byCode(code: string, countries: readonly Country[]): Country | undefined {
  return countries.find((country) => country.code === code);
}

/**
 * What the page starts with: the country the browser's language names
 * (es-MX → Mexico) when the data have it, else `fallback`; the amount an
 * average person lives on there, in its currency; and a country to
 * compare it with. Worked out on the device; nothing is stored or sent.
 */
export function startingChoice(language: string | undefined, countries: readonly Country[], fallback: { from: string; to: string }): { amount: number; from: string; to: string } {
  const from = countryFromLanguage(language, countries.map((country) => country.code), fallback.from);
  const to = from === fallback.to ? fallback.from : fallback.to;
  const home = byCode(from, countries);
  return { amount: home ? monthlyCost(home) : Number.NaN, from, to };
}
