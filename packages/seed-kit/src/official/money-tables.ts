/**
 * The two small money tables the pages carry, made at build time from the
 * official data (A1): each country's currency (Unicode CLDR) and each
 * currency's official exchange rate against the US dollar, a yearly
 * average (World Bank, PA.NUS.FCRF). scripts/money-tables.ts writes them to
 * data/currencies.json and data/exchange-rates.json; ../money.ts reads them;
 * test/money.test.ts keeps them equal to what the official data give.
 *
 * A currency's rate is the one of a country that uses it (for a shared
 * one, a fixed country, completed by others that agree with it). Only years from
 * RATES_FROM on are kept: a page converts figures of recent years.
 */

import { COUNTRIES, OFFICIAL } from "./data.ts";
import { valueIn, type Row } from "./series.ts";

/** The first year of the exchange-rate table. */
export const RATES_FROM = 2015;

/** The country a shared currency takes its rate from. */
const RATE_COUNTRY: Readonly<Record<string, string>> = { EUR: "DE", USD: "US", XOF: "SN", XAF: "CM", XCD: "LC", AUD: "AU", CHF: "CH", NZD: "NZ", ZAR: "ZA", INR: "IN", ILS: "IL", DKK: "DK", NOK: "NO", GBP: "GB" };

export interface ExchangeRates {
  description: string;
  source: string;
  license: string;
  url: string;
  retrievedOn: string;
  provisional: string | null;
  /** Units of each currency per US dollar, by year: { "PEN": { "2024": 3.75 } }. */
  rates: Record<string, Record<string, number>>;
}

/** Every country with a currency, as data/currencies.json keeps it: { "PE": "PEN" }. */
export function buildCurrencies(): Record<string, string> {
  return Object.fromEntries(
    Object.entries(COUNTRIES)
      .filter((entry): entry is [string, (typeof entry)[1] & { currency: string }] => entry[1].currency !== null)
      .map(([code, info]) => [code, info.currency])
      .sort(([a], [b]) => a.localeCompare(b)),
  );
}

/** A jump this big from one year to the next is a new currency (a redenomination), not a devaluation. */
export const NEW_CURRENCY_JUMP = 20;

/**
 * The first whole year of a currency in a country: the year of its CLDR
 * start when it began on 1 January (the euro in Croatia, 2023), else the
 * year after (a yearly average of 2018 in Venezuela mixes two bolívars).
 */
export function firstWholeYear(since: string | null | undefined): number {
  if (!since) return Number.NEGATIVE_INFINITY;
  const year = Number(since.slice(0, 4));
  return since.slice(5) === "01-01" ? year : year + 1;
}

/**
 * A country's rates from RATES_FROM on, in the currency it uses today: the
 * World Bank gives each year in the currency of that year, so years before
 * the currency began (CLDR: the bolívar soberano in 2018, the ouguiya of
 * 2018) or before a redenomination the data show (a jump of ×20: Zimbabwe,
 * 2024–2025) are left out rather than mixed.
 */
function yearsOf(row: Row | undefined, last: number, since: string | null | undefined): Record<string, number> {
  const kept: [number, number][] = [];
  const first = Math.max(RATES_FROM, firstWholeYear(since));
  for (let year = last; year >= first; year -= 1) {
    const value = valueIn(row, year);
    if (value === null || !(value > 0)) continue;
    const next = kept.at(-1);
    if (next && (next[1] / value > NEW_CURRENCY_JUMP || value / next[1] > NEW_CURRENCY_JUMP)) break;
    kept.push([year, value]);
  }
  return Object.fromEntries(kept.reverse().map(([year, value]) => [String(year), value]));
}

/** Each currency's rate per US dollar, from RATES_FROM to the latest year of the data. */
export function buildExchangeRates(): ExchangeRates {
  const fx = OFFICIAL["wb-fx"];
  const last = fx.meta.dataYear;
  const currencies = buildCurrencies();
  const rates: Record<string, Record<string, number>> = {};
  for (const currency of [...new Set(Object.values(currencies))].sort()) {
    const users = Object.keys(currencies).filter((code) => currencies[code] === currency);
    // The fixed country (or the user with the most years), then the years it lacks from users that
    // agree with it on every year both have: a country that took the currency late (Croatia, Bulgaria)
    // gives its old currency for the years before, and is left out.
    const series = [...new Set([RATE_COUNTRY[currency], ...users])]
      .filter((code): code is string => Boolean(code) && fx.values[code] !== undefined)
      .map((code) => ({ code, years: yearsOf(fx.values[code], last, COUNTRIES[code]?.currencySince) }))
      .filter((entry) => Object.keys(entry.years).length > 0)
      .sort((a, b) => Number(b.code === RATE_COUNTRY[currency]) - Number(a.code === RATE_COUNTRY[currency]) || Object.keys(b.years).length - Object.keys(a.years).length);
    const best = series[0] ? { code: series[0].code, years: { ...series[0].years } } : undefined;
    for (const other of series.slice(1)) {
      if (!best) break;
      const shared = Object.keys(other.years).filter((year) => year in best.years);
      const agrees = shared.length > 0 && shared.every((year) => Math.abs(other.years[year] / best.years[year] - 1) < 0.01);
      if (!agrees) continue;
      for (const [year, value] of Object.entries(other.years)) if (!(year in best.years)) best.years[year] = value;
    }
    if (best) best.years = Object.fromEntries(Object.entries(best.years).sort(([a], [b]) => Number(a) - Number(b)));
    if (best && Object.keys(best.years).length > 0) rates[currency] = best.years;
  }
  // The US dollar is the unit.
  rates.USD = Object.fromEntries(Array.from({ length: last - RATES_FROM + 1 }, (_, index) => [String(RATES_FROM + index), 1]));
  return {
    description: "Official exchange rate, local currency units per US dollar, yearly average, by currency and year (from a country that uses the currency; years before a redenomination left out).",
    source: fx.meta.source,
    license: fx.meta.license,
    url: fx.meta.url,
    retrievedOn: fx.meta.retrievedOn,
    provisional: fx.meta.provisional ?? null,
    rates: Object.fromEntries(Object.entries(rates).sort(([a], [b]) => a.localeCompare(b))),
  };
}
