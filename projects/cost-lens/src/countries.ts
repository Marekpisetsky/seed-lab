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
import type { Country } from "./calc.ts";

/** Every country of the data, in a language, sorted by its name there. */
export function countriesFor(locale: Locale): Country[] {
  const collator = new Intl.Collator(LOCALE_SETTINGS[locale].intl);
  return costOfLiving.countries
    .map((country) => ({
      code: country.code,
      name: countryName(country.code, locale),
      sentence: countryInSentence(country.code, locale),
      cost: country.monthlyCostEur,
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
    provisional: costOfLiving.provisional !== null,
  };
})();

/** The country Cost Lens opens with, and the one it compares to. */
export const DEFAULTS = { amount: 2500, from: "NL", to: "PE" } as const;
