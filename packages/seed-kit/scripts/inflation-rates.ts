/**
 * Writes src/data/inflation-rates.json: each country's reference inflation
 * rate, taken from the cost-of-living datasets (src/data/cost-of-living.json
 * and src/data/estimated-countries.json). Run after changing either:
 *
 *   node --experimental-strip-types scripts/inflation-rates.ts
 *
 * test/cost-of-living.test.ts fails while the two disagree.
 */

import { writeFileSync } from "node:fs";
import { costOfLiving } from "../src/cost-of-living.ts";

const rates = Object.fromEntries(costOfLiving.countries.map((country) => [country.code, country.inflation.rate]));
const file = {
  description:
    "Each country's reference inflation rate, the same as in cost-of-living.json and estimated-countries.json, so a page can turn growth after rising prices into growth before them without loading the whole dataset. Written by scripts/inflation-rates.ts.",
  rates,
};
writeFileSync(new URL("../src/data/inflation-rates.json", import.meta.url), `${JSON.stringify(file, null, 2)}\n`);
console.log(`${Object.keys(rates).length} countries`);
