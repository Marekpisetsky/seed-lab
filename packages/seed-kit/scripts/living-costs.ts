/**
 * Writes src/data/living-costs.json: what an average person lives on in
 * each country, worked out from the official data (src/official/living-costs.ts),
 * so the pages carry a small table instead of the whole series. Run after
 * the yearly official data:
 *
 *   npm run living-costs
 *
 * test/cost-of-living.test.ts fails while the table and the data disagree.
 */

import { writeFileSync } from "node:fs";
import { buildLivingCosts } from "../src/official/living-costs.ts";

const table = buildLivingCosts();
const { countries, ...about } = table;
// One line per country, only the figures: the pages name countries in their own language and write the source from the years.
const rows = countries.map(({ code, monthlyCostUsd, monthlyCostEur, priceYear, surveyYear }) => JSON.stringify({ code, monthlyCostUsd: Math.round(monthlyCostUsd * 100) / 100, monthlyCostEur, priceYear, surveyYear }));
writeFileSync(new URL("../src/data/living-costs.json", import.meta.url), `${JSON.stringify(about, null, 1).slice(0, -2)},\n "countries": [\n${rows.join(",\n")}\n ]\n}\n`);
console.log(`${table.countries.length} countries, prices of ${table.priceYear}`);
