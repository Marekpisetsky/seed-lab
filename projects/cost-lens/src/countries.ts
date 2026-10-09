/**
 * The countries as the page carries them: from seed-kit's cost of living
 * (packages/seed-kit/src/cost-of-living.ts, the data Wealth Lens uses
 * too), named in the page's language and sorted by that name. Only what
 * Cost Lens shows goes into the page; the browser gets this list inside
 * it, never from elsewhere. Read when the site is built, not in the
 * browser.
 */

import { costOfLiving } from "../../../packages/seed-kit/src/cost-of-living.ts";
import { countryInSentence, countryName } from "../../../packages/seed-kit/src/country-names.ts";
import { LOCALE_SETTINGS, type Locale } from "../../../packages/seed-kit/src/locales.ts";
import { currencyOf, EXCHANGE_RATES_SOURCE, ratePerDollar } from "../../../packages/seed-kit/src/money.ts";
import { monthlyCost, type Country } from "./calc.ts";

/**
 * A country's currency and its official rate in the year of the prices,
 * or US dollars when the data have no rate for that year: a rate of
 * another year would mix two years' prices.
 */
function money(code: string): Pick<Country, "currency" | "ownCurrency" | "perDollar" | "rateYear"> {
  const year = costOfLiving.priceYear;
  const currency = currencyOf(code);
  const perDollar = currency ? ratePerDollar(currency, year) : null;
  const ownCurrency = currency ?? "USD";
  return currency && perDollar ? { currency, ownCurrency, perDollar, rateYear: year } : { currency: "USD", ownCurrency, perDollar: 1, rateYear: year };
}

/** Every country of the data, in a language, sorted by its name there. */
export function countriesFor(locale: Locale): Country[] {
  const collator = new Intl.Collator(LOCALE_SETTINGS[locale].intl);
  return costOfLiving.countries
    .map((country) => ({
      code: country.code,
      name: countryName(country.code, locale),
      sentence: countryInSentence(country.code, locale),
      cost: country.monthlyCostUsd,
      ...money(country.code),
    }))
    .sort((a, b) => collator.compare(a.name, b.name));
}

/** Where the numbers come from, for the page's sources. */
export const DATA = (() => {
  const surveys = costOfLiving.countries.map((country) => country.surveyYear);
  return {
    countries: costOfLiving.countries.length,
    /** The year of the prices. */
    priceYear: costOfLiving.priceYear,
    /** The oldest and newest household surveys behind the figures. */
    surveyFrom: Math.min(...surveys),
    surveyTo: Math.max(...surveys),
    compiledOn: costOfLiving.compiledOn,
    /** Read from a public copy of the World Bank's data until the yearly download: the page says so. */
    provisional: costOfLiving.provisional !== null || EXCHANGE_RATES_SOURCE.provisional !== null,
  };
})();

/** The country Cost Lens opens with (until the browser's language names another), and the one it compares to. */
export const DEFAULTS = { from: "NL", to: "PE" } as const;

/** The page as built: the default countries, and the amount an average person lives on in the first, in its currency. */
export function defaultChoice(countries: readonly Country[]): { amount: number; from: string; to: string } {
  const home = countries.find((country) => country.code === DEFAULTS.from);
  return { amount: home ? monthlyCost(home) : Number.NaN, ...DEFAULTS };
}
