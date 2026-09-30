/**
 * The curated cost-of-living dataset (src/data/cost-of-living.json), validated
 * when the module loads so a bad edit fails loudly instead of rendering NaN.
 *
 * The figures are approximate estimates compiled by hand from public sources
 * on a given date. They are not live data and the UI must say so.
 */

import raw from "@/data/cost-of-living.json";

export const REGIONS = ["Europe", "North America", "Latin America", "Asia", "Africa"] as const;
export type Region = (typeof REGIONS)[number];

export interface CountryCost {
  /** ISO 3166-1 alpha-2. */
  code: string;
  name: string;
  region: Region;
  /** One person, per month, in EUR. */
  monthlyCostEur: { withoutRent: number; withRent: number };
  /** Where the numbers come from, with the original values and currencies. */
  source: string;
  /** Month the source figures refer to, `YYYY-MM`. */
  referenceDate: string;
  /**
   * A long-run reference for its consumer prices: the central bank's
   * inflation target (see the dataset's inflationNote), with where it comes
   * from and when it was checked.
   */
  inflation: { rate: number; basis: string; asOf: string };
}

export interface CostOfLivingDataset {
  description: string;
  inflationNote: string;
  compiledOn: string;
  conversion: { note: string; usdPerEur: number; gbpPerEur: number; rateDate: string };
  countries: CountryCost[];
}

function fail(message: string): never {
  throw new Error(`Invalid cost-of-living dataset: ${message}`);
}

function isPositive(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

function parseCountry(value: unknown, index: number): CountryCost {
  if (typeof value !== "object" || value === null) fail(`entry ${index} is not an object`);
  const entry = value as Record<string, unknown>;
  const { code, name, region, monthlyCostEur, source, referenceDate } = entry;
  const label = typeof name === "string" ? name : `entry ${index}`;

  if (typeof code !== "string" || !/^[A-Z]{2}$/.test(code)) fail(`${label}: invalid code`);
  if (typeof name !== "string" || name === "") fail(`entry ${index}: missing name`);
  if (!REGIONS.includes(region as Region)) fail(`${label}: unknown region "${String(region)}"`);
  if (typeof source !== "string" || source === "") fail(`${label}: missing source`);
  if (typeof referenceDate !== "string" || !/^\d{4}-\d{2}$/.test(referenceDate)) {
    fail(`${label}: referenceDate must be YYYY-MM`);
  }
  const costs = monthlyCostEur as Record<string, unknown> | undefined;
  if (!costs || !isPositive(costs.withoutRent) || !isPositive(costs.withRent)) {
    fail(`${label}: monthly costs must be positive numbers`);
  }
  if (costs.withRent <= costs.withoutRent) fail(`${label}: withRent must exceed withoutRent`);
  const inflation = entry.inflation as Record<string, unknown> | undefined;
  const rate = inflation?.rate;
  if (typeof rate !== "number" || !Number.isFinite(rate) || rate < -0.05 || rate > 0.5) fail(`${label}: inflation rate must be a fraction`);
  if (typeof inflation?.basis !== "string" || inflation.basis === "") fail(`${label}: inflation needs its basis`);
  if (typeof inflation.asOf !== "string" || !/^\d{4}-\d{2}$/.test(inflation.asOf)) fail(`${label}: inflation asOf must be YYYY-MM`);

  return {
    code,
    name,
    region: region as Region,
    monthlyCostEur: { withoutRent: costs.withoutRent, withRent: costs.withRent },
    source,
    referenceDate,
    inflation: { rate, basis: inflation.basis, asOf: inflation.asOf },
  };
}

export function parseDataset(value: unknown): CostOfLivingDataset {
  if (typeof value !== "object" || value === null) fail("not an object");
  const data = value as Record<string, unknown>;
  if (!Array.isArray(data.countries) || data.countries.length === 0) fail("no countries");
  const countries = data.countries.map(parseCountry);
  const codes = new Set(countries.map((country) => country.code));
  if (codes.size !== countries.length) fail("duplicate country codes");

  const conversion = data.conversion as CostOfLivingDataset["conversion"] | undefined;
  if (!conversion || !isPositive(conversion.usdPerEur) || !isPositive(conversion.gbpPerEur)) {
    fail("missing conversion rates");
  }
  return {
    description: String(data.description ?? ""),
    inflationNote: String(data.inflationNote ?? ""),
    compiledOn: String(data.compiledOn ?? ""),
    conversion,
    countries,
  };
}

export const costOfLiving: CostOfLivingDataset = parseDataset(raw);

/** The country "Prices of" starts with. */
export const DEFAULT_PRICES_OF = "NL";

/** A country of the list by its code; `undefined` for any other. */
export function countryByCode(code: string, countries: readonly CountryCost[] = costOfLiving.countries): CountryCost | undefined {
  return countries.find((country) => country.code === code);
}

/** The reference inflation of a country of the list, or the default country's for any other code. */
export function referenceInflation(code: string, countries: readonly CountryCost[] = costOfLiving.countries): CountryCost["inflation"] {
  const country = countryByCode(code, countries) ?? countryByCode(DEFAULT_PRICES_OF, countries) ?? countries[0];
  return country.inflation;
}

/** Country names that read with "the" in a sentence. */
const WITH_ARTICLE = new Set(["Netherlands", "United States", "United Kingdom", "Philippines"]);

/** "the Netherlands", "India": the name as it reads in a sentence. */
export function countryInSentence(name: string): string {
  return WITH_ARTICLE.has(name) ? `the ${name}` : name;
}

