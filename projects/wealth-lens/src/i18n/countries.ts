/**
 * Countries by name in the page's language (src/data/country-names.json,
 * made by scripts/country-names.mts), as a table lists them ("Netherlands")
 * and as a sentence says them ("the Netherlands", "los Países Bajos").
 */

import type { I18n } from ".";
import names from "@/data/country-names.json";
import { LOCALE_SETTINGS } from "./locales";

const NAMES: Readonly<Record<string, Readonly<Record<string, string>>>> = names;

export function countryName(code: string, { locale }: Pick<I18n, "locale">): string {
  return NAMES[code]?.[locale] ?? NAMES[code]?.en ?? code;
}

export function countryInSentence(code: string, i18n: I18n): string {
  const sentence: Readonly<Record<string, string>> = i18n.m.countries.inSentence;
  return sentence[code] ?? countryName(code, i18n);
}

/** Codes sorted by their name in the page's language. */
export function byCountryName<T extends { code: string }>(countries: readonly T[], i18n: I18n): T[] {
  const collator = new Intl.Collator(LOCALE_SETTINGS[i18n.locale].intl);
  return [...countries].sort((a, b) => collator.compare(countryName(a.code, i18n), countryName(b.code, i18n)));
}

/** A country found by its name in the page's language or in English, or by its code; accents do not matter. */
export function matchesCountry(code: string, query: string, i18n: Pick<I18n, "locale">): boolean {
  const plain = (text: string) => text.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLocaleLowerCase();
  const wanted = plain(query.trim());
  return wanted === "" || [countryName(code, i18n), countryName(code, { locale: "en" }), code].some((name) => plain(name).includes(wanted));
}
