/**
 * Writes src/data/country-names.json: every country of
 * src/data/cost-of-living.json and src/data/estimated-countries.json by
 * name in each language the app speaks,
 * from the CLDR names built into Node (Intl.DisplayNames), with a few
 * shorter or friendlier names where CLDR's would read oddly in a table.
 *
 * Generated once and committed, so the server and every browser show the
 * very same names (browsers ship different CLDR versions). Run again after
 * adding countries or a language: `node scripts/country-names.mts`.
 */

import { readFile, writeFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const LOCALES = ["en", "es"] as const;

/** CLDR's name, replaced where it reads badly in a list. */
const OVERRIDES: Record<string, Partial<Record<(typeof LOCALES)[number], string>>> = {
  CD: { en: "DR Congo", es: "RD del Congo" },
  CG: { en: "Congo", es: "Congo" },
  HK: { en: "Hong Kong", es: "Hong Kong" },
  MO: { en: "Macao", es: "Macao" },
  MM: { en: "Myanmar", es: "Myanmar" },
  PS: { en: "Palestine", es: "Palestina" },
  CI: { en: "Côte d’Ivoire", es: "Costa de Marfil" },
};

const read = async (file: string) => (JSON.parse(await readFile(new URL(file, root), "utf8")) as { countries: { code: string }[] }).countries;
const listed = [...(await read("src/data/cost-of-living.json")), ...(await read("src/data/estimated-countries.json"))];
const codes = [...new Set(listed.map((country) => country.code))].sort();
const displays = Object.fromEntries(LOCALES.map((locale) => [locale, new Intl.DisplayNames([locale], { type: "region" })]));

const names: Record<string, Record<string, string>> = {};
for (const code of codes) {
  names[code] = Object.fromEntries(LOCALES.map((locale) => [locale, OVERRIDES[code]?.[locale] ?? displays[locale].of(code) ?? code]));
}
const lines = Object.entries(names).map(([code, byLocale]) => `${JSON.stringify(code)}: ${JSON.stringify(byLocale)}`);
await writeFile(new URL("src/data/country-names.json", root), `{\n${lines.join(",\n")}\n}\n`);
console.log(`${codes.length} countries named in ${LOCALES.join(", ")}.`);
