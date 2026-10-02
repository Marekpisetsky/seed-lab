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
      withoutRent: country.monthlyCostEur.withoutRent,
      withRent: country.monthlyCostEur.withRent,
      estimated: country.method === "estimated",
    }))
    .sort((a, b) => collator.compare(a.name, b.name));
}

/** Where the numbers come from, for the page's sources. */
export const DATA = (() => {
  const detailed = costOfLiving.countries.filter((country) => country.method === "detailed");
  const estimated = costOfLiving.countries.filter((country) => country.method === "estimated");
  const latest = (dates: string[]) => dates.sort().at(-1) ?? "";
  return {
    detailed: detailed.length,
    estimated: estimated.length,
    /** The month the detailed figures refer to, YYYY-MM (the latest). */
    detailedMonth: latest(detailed.map((country) => country.referenceDate)),
    /** The year of the World Bank price levels behind the estimates (the latest). */
    priceYear: Math.max(...estimated.map((country) => country.priceLevel?.year ?? 0)),
    compiledOn: costOfLiving.compiledOn,
  };
})();

/** The country Cost Lens opens with, and the one it compares to. */
export const DEFAULTS = { amount: 2500, from: "NL", to: "PE" } as const;
