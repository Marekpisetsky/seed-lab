/**
 * The 172 countries by name, in each language: as a table lists them
 * ("Netherlands", "Países Bajos") and as a sentence says them ("the
 * Netherlands", "los Países Bajos"). The names come from
 * data/country-names.json (projects/wealth-lens/scripts/country-names.mts).
 */

import names from "./data/country-names.json" with { type: "json" };
import type { Locale } from "./locales.ts";

const NAMES: Readonly<Record<string, Readonly<Record<Locale, string>>>> = names;

/** Names that read with an article in a sentence ("live in the Netherlands"); the rest read as they are listed. */
export const IN_SENTENCE: Readonly<Record<Locale, Readonly<Record<string, string>>>> = {
  en: {
    NL: "the Netherlands",
    US: "the United States",
    GB: "the United Kingdom",
    PH: "the Philippines",
    AE: "the United Arab Emirates",
    DO: "the Dominican Republic",
    CF: "the Central African Republic",
    BS: "the Bahamas",
    GM: "the Gambia",
    MV: "the Maldives",
    KM: "the Comoros",
    CZ: "the Czech Republic",
  },
  es: {
    NL: "los Países Bajos",
    GB: "el Reino Unido",
  },
};

/** A country's name in a language, as a list shows it; its code when it has none. */
export function countryName(code: string, locale: Locale): string {
  return NAMES[code]?.[locale] ?? NAMES[code]?.en ?? code;
}

/** A country's name as a sentence says it: "the Netherlands", "India". */
export function countryInSentence(code: string, locale: Locale): string {
  return IN_SENTENCE[locale][code] ?? countryName(code, locale);
}
