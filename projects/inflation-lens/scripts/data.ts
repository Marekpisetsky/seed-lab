/**
 * `npm run data`: downloads Eurostat's yearly HICP rates (dataset
 * prc_hicp_aind: all items, annual average rate of change) for the euro
 * area, the EU and its 27 countries, and writes src/data/hicp.json from
 * them: no longer provisional, every series as Eurostat publishes it, with
 * today's date. Needs to reach ec.europa.eu. Run the tests after it: they
 * check the new file as they checked the old one.
 */

import { writeFileSync } from "node:fs";
import { fromJsonStat, HICP, parseHicp, type HicpDataset } from "../src/hicp.ts";

const GEO = ["EA", "EU27_2020", "BE", "BG", "CZ", "DK", "DE", "EE", "IE", "EL", "ES", "FR", "HR", "IT", "CY", "LV", "LT", "LU", "HU", "MT", "NL", "AT", "PL", "PT", "RO", "SI", "SK", "FI", "SE"];

const url = new URL("https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/prc_hicp_aind");
for (const [key, value] of [["format", "JSON"], ["lang", "EN"], ["unit", "RCH_A_AVG"], ["coicop", "CP00"]]) url.searchParams.set(key, value);
for (const geo of GEO) url.searchParams.append("geo", geo);

const response = await fetch(url);
if (!response.ok) throw new Error(`Eurostat answered ${response.status} for ${url}`);
const series = fromJsonStat(await response.json());
const wanted = GEO.map((geo) => (geo === "EL" ? "GR" : geo === "EU27_2020" ? "EU" : geo));
const missing = wanted.filter((code) => !series[code]);
if (missing.length > 0) throw new Error(`Eurostat's answer has no rates for ${missing.join(", ")}`);

const kept: Partial<HicpDataset> = { ...HICP };
delete kept.provisionalNote;
const dataset: HicpDataset = parseHicp({
  ...kept,
  source: "Eurostat, Harmonised index of consumer prices (HICP), annual data (average index and rate of change), all items: dataset prc_hicp_aind.",
  retrievedOn: new Date().toISOString().slice(0, 10),
  provisional: false,
  series: Object.fromEntries(wanted.map((code) => [code, series[code]])),
});
writeFileSync(new URL("../src/data/hicp.json", import.meta.url), `${JSON.stringify(dataset, null, 2)}\n`);
console.log(`Wrote src/data/hicp.json: ${wanted.length} series from Eurostat, up to ${Math.max(...wanted.map((code) => series[code].from + series[code].rates.length - 1))}.`);
