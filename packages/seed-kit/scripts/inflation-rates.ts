/**
 * Writes src/data/inflation-rates.json: each country's reference inflation
 * rate alone, from src/data/inflation-reference.json (with its basis and
 * date), so a page's first screen does not load the bases. Run after
 * changing the reference:
 *
 *   node --experimental-strip-types scripts/inflation-rates.ts
 *
 * test/cost-of-living.test.ts fails while the two disagree.
 */

import { writeFileSync } from "node:fs";
import { REFERENCE_INFLATION } from "../src/cost-of-living.ts";

const rates = Object.fromEntries(Object.entries(REFERENCE_INFLATION).map(([code, reference]) => [code, reference.rate]));
const file = {
  description:
    "Each country's reference inflation rate, the same as in inflation-reference.json, so a page can turn growth after rising prices into growth before them without loading the bases. Written by scripts/inflation-rates.ts.",
  rates,
};
writeFileSync(new URL("../src/data/inflation-rates.json", import.meta.url), `${JSON.stringify(file, null, 2)}\n`);
console.log(`${Object.keys(rates).length} countries`);
