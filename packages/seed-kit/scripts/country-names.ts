/**
 * Writes src/data/country-names.json: every country of the official data
 * (src/data/official/countries.json) by name in each language the tools
 * speak, from the CLDR names built into Node (Intl.DisplayNames), with a
 * few shorter or friendlier names where CLDR's would read oddly in a list.
 *
 * Generated once and committed, so the build and every browser show the
 * very same names (browsers ship different CLDR versions). Run again after
 * the yearly data or a new language: `npm run country-names`.
 */

import { readFileSync, writeFileSync } from "node:fs";
import { LOCALES } from "../src/locales.ts";

/** CLDR's name, replaced where it reads badly in a list. */
const OVERRIDES: Record<string, Partial<Record<string, string>>> = {
  CD: { en: "DR Congo", es: "RD del Congo", nl: "DR Congo" },
  CG: { en: "Congo", es: "Congo", nl: "Congo" },
  HK: { en: "Hong Kong", es: "Hong Kong", nl: "Hongkong" },
  MO: { en: "Macao", es: "Macao", nl: "Macau" },
  MM: { en: "Myanmar", es: "Myanmar", nl: "Myanmar" },
  PS: { en: "Palestine", es: "Palestina", nl: "Palestina" },
  CI: { en: "Côte d’Ivoire", es: "Costa de Marfil", nl: "Ivoorkust" },
  XK: { en: "Kosovo", es: "Kosovo", nl: "Kosovo" },
};

const countries = (JSON.parse(readFileSync(new URL("../src/data/official/countries.json", import.meta.url), "utf8")) as { countries: Record<string, unknown> }).countries;
const codes = Object.keys(countries).sort();
const displays = Object.fromEntries(LOCALES.map((locale) => [locale, new Intl.DisplayNames([locale], { type: "region" })]));
const lines = codes.map((code) => `"${code}": ${JSON.stringify(Object.fromEntries(LOCALES.map((locale) => [locale, OVERRIDES[code]?.[locale] ?? displays[locale].of(code) ?? code])))}`);
writeFileSync(new URL("../src/data/country-names.json", import.meta.url), `{\n${lines.join(",\n")}\n}\n`);
console.log(`${codes.length} countries in ${LOCALES.join(", ")}`);
