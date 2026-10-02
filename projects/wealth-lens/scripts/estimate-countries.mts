/**
 * Writes packages/seed-kit/src/data/estimated-countries.json: a monthly cost of living for
 * every country with World Bank price data that is not among the detailed
 * countries of packages/seed-kit/src/data/cost-of-living.json, estimated from its price level.
 *
 * Method (documented in How it works and in the file itself):
 * - The price level ratio (World Bank WDI PA.NUS.PPPC.RF: PPP conversion
 *   factor for GDP over the market exchange rate; International Comparison
 *   Program, 2021 benchmark, extrapolated by the World Bank to later years)
 *   of the latest year from 2021 to 2024, divided by the Netherlands' of the
 *   same year: how expensive the country is next to the Netherlands.
 * - Without housing: the Netherlands' basket × that ratio.
 * - Housing: the Netherlands' rent × that ratio squared. Rent moves more than
 *   other prices between rich and poor countries; the square is the rounded
 *   least-squares fit on the detailed countries (printed when run).
 * - Reference inflation, the same criterion as the detailed countries: the
 *   ECB's 2% for the euro area, the central bank's target where it is listed
 *   below, otherwise about the 2015–2024 average of consumer price inflation
 *   (WDI FP.CPI.TOTL.ZG, at least 7 of the 10 years).
 * - Left out: countries without enough inflation data, and those whose
 *   prices rose more than 30% a year on average (a cost in euros from a
 *   price level would not hold for long there).
 *
 * Inputs: the WDI indicator files and the country codes of the open data
 * mirrors at github.com/datasets (world-development-indicators, CC BY 4.0;
 * country-codes, PDDL), downloaded into one folder:
 *
 *   node scripts/estimate-countries.mts <folder>
 *
 * with pa.nus.pppc.rf.csv, fp.cpi.totl.zg.csv and country-codes.csv in it
 * (the README lists the download links). Then run scripts/country-names.mts.
 */

import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const root = new URL("../", import.meta.url);
const folder = process.argv[2];
if (!folder) throw new Error("Usage: node scripts/estimate-countries.mts <folder with the WDI files>");

const MAX_AVERAGE_INFLATION = 0.3;
const RENT_EXPONENT = 2;
const PRICE_YEARS = [2024, 2023, 2022, 2021];
const INFLATION_YEARS = Array.from({ length: 10 }, (_, index) => 2015 + index);
const CHECKED = "2026-09";

/** The euro area in September 2026 (Bulgaria joined on 1 January 2026). */
const EURO_AREA = new Set(["AT", "BE", "BG", "CY", "DE", "EE", "ES", "FI", "FR", "GR", "HR", "IE", "IT", "LT", "LU", "LV", "MT", "NL", "PT", "SI", "SK"]);

/** Central bank targets of the estimated countries, as their banks publish them (the middle of a range). */
const TARGETS: Record<string, { rate: number; basis: string }> = {
  AL: { rate: 0.03, basis: "Bank of Albania target: 3%" },
  AU: { rate: 0.025, basis: "Reserve Bank of Australia target: 2–3%, the middle of the range" },
  AZ: { rate: 0.04, basis: "Central Bank of Azerbaijan target: 4% ± 2" },
  BW: { rate: 0.045, basis: "Bank of Botswana objective: 3–6%, the middle of the range" },
  CA: { rate: 0.02, basis: "Bank of Canada target: 2%, within 1–3%" },
  CZ: { rate: 0.02, basis: "Czech National Bank target: 2% ± 1" },
  DO: { rate: 0.04, basis: "Central Bank of the Dominican Republic target: 4% ± 1" },
  GE: { rate: 0.03, basis: "National Bank of Georgia target: 3%" },
  GH: { rate: 0.08, basis: "Bank of Ghana target: 8% ± 2" },
  GT: { rate: 0.04, basis: "Bank of Guatemala target: 4% ± 1" },
  HN: { rate: 0.04, basis: "Central Bank of Honduras target: 4% ± 1" },
  HU: { rate: 0.03, basis: "Magyar Nemzeti Bank target: 3% ± 1" },
  IL: { rate: 0.02, basis: "Bank of Israel target: 1–3%, the middle of the range" },
  IS: { rate: 0.025, basis: "Central Bank of Iceland target: 2.5%" },
  JM: { rate: 0.05, basis: "Bank of Jamaica target: 4–6%, the middle of the range" },
  KR: { rate: 0.02, basis: "Bank of Korea target: 2%" },
  KZ: { rate: 0.05, basis: "National Bank of Kazakhstan medium-term target: 5%" },
  LK: { rate: 0.05, basis: "Central Bank of Sri Lanka target: 5%" },
  MD: { rate: 0.05, basis: "National Bank of Moldova target: 5% ± 1.5" },
  MN: { rate: 0.06, basis: "Bank of Mongolia target: 6% ± 2" },
  NO: { rate: 0.02, basis: "Norges Bank target: 2% (since 2018)" },
  NZ: { rate: 0.02, basis: "Reserve Bank of New Zealand target: 1–3%, aiming at 2%" },
  PK: { rate: 0.06, basis: "State Bank of Pakistan medium-term target: 5–7%, the middle of the range" },
  RS: { rate: 0.03, basis: "National Bank of Serbia target: 3% ± 1.5" },
  RU: { rate: 0.04, basis: "Bank of Russia target: 4%" },
  RW: { rate: 0.05, basis: "National Bank of Rwanda target: 5%, within 2–8%" },
  SE: { rate: 0.02, basis: "Sveriges Riksbank target: 2%" },
  TR: { rate: 0.05, basis: "Central Bank of the Republic of Türkiye medium-term target: 5%" },
  UA: { rate: 0.05, basis: "National Bank of Ukraine target: 5% ± 1" },
  UG: { rate: 0.05, basis: "Bank of Uganda target: 5% (core inflation)" },
  UY: { rate: 0.045, basis: "Central Bank of Uruguay target: 3–6%, the middle of the range" },
  UZ: { rate: 0.05, basis: "Central Bank of Uzbekistan target: 5%" },
  ZM: { rate: 0.07, basis: "Bank of Zambia target: 6–8%, the middle of the range" },
};

/** The app's regions: the UN's, with the Caribbean and Central America in Latin America, and Cyprus in Europe. */
function regionOf(code: string, unRegion: string, subRegion: string): string {
  if (code === "CY") return "Europe";
  if (unRegion === "Americas") return subRegion === "Northern America" ? "North America" : "Latin America";
  return unRegion;
}

/** A CSV row split on commas outside quotes. */
function splitCsv(line: string): string[] {
  const cells: string[] = [];
  let cell = "";
  let quoted = false;
  for (const char of line) {
    if (char === '"') quoted = !quoted;
    else if (char === "," && !quoted) {
      cells.push(cell);
      cell = "";
    } else cell += char;
  }
  cells.push(cell);
  return cells;
}

async function readTable(file: string): Promise<Record<string, string>[]> {
  const [header, ...lines] = (await readFile(join(folder, file), "utf8")).split(/\r?\n/).filter(Boolean);
  const names = splitCsv(header);
  return lines.map((line) => Object.fromEntries(splitCsv(line).map((value, index) => [names[index], value])));
}

/** Indicator values by ISO3 code and year. */
async function indicator(file: string): Promise<Map<string, Map<number, number>>> {
  const values = new Map<string, Map<number, number>>();
  for (const row of await readTable(file)) {
    if (row.Value === "" || row.Value === undefined) continue;
    const byYear = values.get(row["Country Code"]) ?? new Map<number, number>();
    byYear.set(Number(row.Year), Number(row.Value));
    values.set(row["Country Code"], byYear);
  }
  return values;
}

const roundTo10 = (value: number) => Math.round(value / 10) * 10;
const median = (values: number[]) => {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
};
const quantile = (values: number[], q: number) => [...values].sort((a, b) => a - b)[Math.min(values.length - 1, Math.floor(q * values.length))];

const detailed = JSON.parse(await readFile(new URL("../../packages/seed-kit/src/data/cost-of-living.json", root), "utf8")) as {
  countries: { code: string; name: string; monthlyCostEur: { withoutRent: number; withRent: number } }[];
};
const priceLevels = await indicator("pa.nus.pppc.rf.csv");
const inflation = await indicator("fp.cpi.totl.zg.csv");
const codes = new Map<string, { iso3: string; name: string; region: string }>();
for (const row of await readTable("country-codes.csv")) {
  const iso2 = row["ISO3166-1-Alpha-2"];
  const iso3 = row["ISO3166-1-Alpha-3"];
  if (!/^[A-Z]{2}$/.test(iso2 ?? "") || !/^[A-Z]{3}$/.test(iso3 ?? "") || !row["Region Name"]) continue;
  codes.set(iso2, { iso3, name: row["CLDR display name"] || row["UNTERM English Short"], region: regionOf(iso2, row["Region Name"], row["Sub-region Name"]) });
}

/** A country's price level next to the Netherlands', in the latest year both have. */
function priceLevel(iso3: string): { ratio: number; year: number } | null {
  const own = priceLevels.get(iso3);
  const netherlands = priceLevels.get("NLD");
  for (const year of PRICE_YEARS) {
    const value = own?.get(year);
    const base = netherlands?.get(year);
    if (value !== undefined && base !== undefined) return { ratio: Math.round((value / base) * 1000) / 1000, year };
  }
  return null;
}

const basket = detailed.countries.find((country) => country.code === "NL");
if (!basket) throw new Error("The detailed countries need the Netherlands");
const withoutRent = basket.monthlyCostEur.withoutRent;
const rent = basket.monthlyCostEur.withRent - withoutRent;
const estimate = (ratio: number) => {
  const without = roundTo10(withoutRent * ratio);
  return { withoutRent: without, withRent: without + Math.max(10, roundTo10(rent * ratio ** RENT_EXPONENT)) };
};

// How well the method does on the detailed countries, whose figures are known.
const checks = detailed.countries
  .filter((country) => country.code !== "NL")
  .map((country) => ({ country, level: priceLevel(codes.get(country.code)?.iso3 ?? "") }))
  .filter((entry): entry is { country: (typeof detailed.countries)[number]; level: { ratio: number; year: number } } => entry.level !== null);
const fitted =
  checks.reduce((sum, { country, level }) => sum + Math.log(level.ratio) * Math.log((country.monthlyCostEur.withRent - country.monthlyCostEur.withoutRent) / rent), 0) /
  checks.reduce((sum, { level }) => sum + Math.log(level.ratio) ** 2, 0);
const errors = (pick: (costs: { withoutRent: number; withRent: number }) => number) =>
  checks.map(({ country, level }) => Math.abs(pick(estimate(level.ratio)) / pick(country.monthlyCostEur) - 1));
const withoutErrors = errors((costs) => costs.withoutRent);
const withErrors = errors((costs) => costs.withRent);
const round2 = (value: number) => Math.round(value * 100) / 100;

const detailedCodes = new Set(detailed.countries.map((country) => country.code));
const countries: unknown[] = [];
const excluded: { code: string; name: string; reason: string }[] = [];
for (const [code, { iso3, name, region }] of [...codes].sort(([a], [b]) => a.localeCompare(b))) {
  if (detailedCodes.has(code)) continue;
  const level = priceLevel(iso3);
  if (!level) continue;
  const yearly = INFLATION_YEARS.map((year) => inflation.get(iso3)?.get(year)).filter((value): value is number => value !== undefined);
  if (yearly.length < 7) {
    excluded.push({ code, name, reason: "not enough inflation data (fewer than 7 of the years 2015–2024)" });
    continue;
  }
  const average = Math.exp(yearly.reduce((sum, value) => sum + Math.log1p(value / 100), 0) / yearly.length) - 1;
  if (average > MAX_AVERAGE_INFLATION) {
    excluded.push({ code, name, reason: `prices rose about ${Math.round(average * 100)}% a year on average in 2015–2024` });
    continue;
  }
  const reference = EURO_AREA.has(code)
    ? { rate: 0.02, basis: "European Central Bank target for the euro area: 2%, symmetric (strategy of July 2021)" }
    : (TARGETS[code] ?? { rate: Math.round(average * 200) / 200, basis: `About the 2015–2024 average of consumer price inflation (World Bank): ${(average * 100).toFixed(1)}% a year` });
  countries.push({
    code,
    name,
    region,
    priceLevel: level,
    monthlyCostEur: estimate(level.ratio),
    inflation: { ...reference, asOf: CHECKED, ...(average >= 0.1 ? { recentAverage: Math.round(average * 1000) / 1000 } : {}) },
  });
}

const dataset = {
  description:
    "Monthly cost of living for one person, in EUR, estimated from each country's price level: the Netherlands' figures (see cost-of-living.json) × the country's price level ratio next to the Netherlands' for costs without housing, and × that ratio squared for rent. Rounded to the nearest 10. Rough estimates: countries differ from the Netherlands in more than their price level.",
  method: {
    basket: { country: "NL", withoutRent, rent },
    rentExponent: RENT_EXPONENT,
    fittedRentExponent: round2(fitted),
    checkedOn: `${checks.length} detailed countries`,
    medianError: { withoutRent: round2(median(withoutErrors)), withRent: round2(median(withErrors)) },
    oneInTenOffBy: { withoutRent: round2(quantile(withoutErrors, 0.9)), withRent: round2(quantile(withErrors, 0.9)) },
  },
  source: {
    priceLevel:
      "World Bank, World Development Indicators PA.NUS.PPPC.RF: price level ratio of the PPP conversion factor (GDP) to the market exchange rate. International Comparison Program 2021 benchmark, extrapolated by the World Bank to later years. CC BY 4.0.",
    inflation: "World Bank, World Development Indicators FP.CPI.TOTL.ZG: inflation, consumer prices (annual %). CC BY 4.0.",
    mirror: "https://github.com/datasets/world-development-indicators",
  },
  inflationNote:
    "The same criterion as the detailed countries: the ECB's 2% in the euro area, the central bank's published target where listed, otherwise about the 2015–2024 average of consumer price inflation. recentAverage marks countries whose prices rose 10% a year or more on average in 2015–2024.",
  excluded,
  compiledOn: new Date().toISOString().slice(0, 10),
  countries,
};

await writeFile(new URL("../../packages/seed-kit/src/data/estimated-countries.json", root), `${JSON.stringify(dataset, null, 2)}\n`);
console.log(`${countries.length} estimated countries, ${excluded.length} left out.`);
console.log(`Rent exponent fitted on ${checks.length} detailed countries: ${round2(fitted)} (used: ${RENT_EXPONENT}).`);
console.log(`Median error without housing ${Math.round(median(withoutErrors) * 100)}%, with housing ${Math.round(median(withErrors) * 100)}%.`);
console.log(`One in ten is off by ${Math.round(quantile(withoutErrors, 0.9) * 100)}% / ${Math.round(quantile(withErrors, 0.9) * 100)}% or more.`);
