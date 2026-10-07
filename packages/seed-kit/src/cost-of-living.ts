/**
 * The cost of living of 172 countries: seed-kit's one dataset, for every
 * tool that needs it (Wealth Lens, Cost Lens). Validated when the module
 * loads so a bad edit fails loudly instead of rendering NaN:
 * - data/cost-of-living.json: 30 detailed countries, compiled by hand
 *   from public sources on a given date;
 * - data/estimated-countries.json: every other country with World Bank
 *   price data, estimated from its price level next to the Netherlands'
 *   (projects/wealth-lens/scripts/estimate-countries.mts). Each says so
 *   (method "estimated"), and the apps mark it "≈".
 * Approximate estimates, not live data; the apps say which are which, and
 * where each figure comes from.
 */

import raw from "./data/cost-of-living.json" with { type: "json" };
import estimatedRaw from "./data/estimated-countries.json" with { type: "json" };
import { DEFAULT_PRICES_OF } from "./inflation-rates.ts";

export const REGIONS = ["Europe", "North America", "Latin America", "Asia", "Africa", "Oceania"] as const;
export type Region = (typeof REGIONS)[number];

export interface CountryCost {
  /** ISO 3166-1 alpha-2. */
  code: string;
  name: string;
  region: Region;
  /** One person, per month, in EUR. */
  monthlyCostEur: { withoutRent: number; withRent: number };
  /** "detailed": compiled from cost-of-living sources; "estimated": from the country's price level. */
  method: "detailed" | "estimated";
  /** For an estimate: the country's price level next to the Netherlands', and its year. */
  priceLevel: { ratio: number; year: number } | null;
  /** Where the numbers come from. */
  source: string;
  /** Month the source figures refer to, `YYYY-MM`. */
  referenceDate: string;
  /**
   * A long-run reference for its consumer prices: the central bank's
   * inflation target (see the dataset's inflationNote), with where it comes
   * from and when it was checked.
   */
  inflation: {
    rate: number;
    basis: string;
    asOf: string;
    /** The 2015–2024 average, for countries whose prices rose 10% a year or more then. */
    recentAverage?: number;
  };
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

/** An estimate has no source or month of its own: they come from its method and from the Netherlands' basket. */
type EstimateDefaults = { source: (year: number) => string; referenceDate: string };

function parseCountry(value: unknown, index: number, estimate: EstimateDefaults | null = null): CountryCost {
  if (typeof value !== "object" || value === null) fail(`entry ${index} is not an object`);
  const entry = value as Record<string, unknown>;
  const { code, name, region, monthlyCostEur } = entry;
  const label = typeof name === "string" ? name : `entry ${index}`;
  let priceLevel: CountryCost["priceLevel"] = null;
  if (estimate) {
    const level = entry.priceLevel as Record<string, unknown> | undefined;
    if (!isPositive(level?.ratio) || typeof level.year !== "number" || level.year < 2015) fail(`${label}: an estimate needs its price level and year`);
    priceLevel = { ratio: level.ratio, year: level.year };
  }
  const source = estimate && priceLevel ? estimate.source(priceLevel.year) : entry.source;
  const referenceDate = estimate ? estimate.referenceDate : entry.referenceDate;

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
  const { recentAverage } = inflation;
  if (recentAverage !== undefined && (typeof recentAverage !== "number" || !Number.isFinite(recentAverage))) fail(`${label}: recentAverage must be a fraction`);

  return {
    code,
    name,
    region: region as Region,
    method: estimate ? "estimated" : "detailed",
    priceLevel,
    monthlyCostEur: { withoutRent: costs.withoutRent, withRent: costs.withRent },
    source,
    referenceDate,
    inflation: { rate, basis: inflation.basis, asOf: inflation.asOf, ...(recentAverage === undefined ? {} : { recentAverage }) },
  };
}

/** How the estimated countries were worked out (estimated-countries.json), for How it works. */
export interface EstimateMethod {
  basket: { country: string; withoutRent: number; rent: number };
  rentExponent: number;
  fittedRentExponent: number;
  checkedOn: string;
  medianError: { withoutRent: number; withRent: number };
  oneInTenOffBy: { withoutRent: number; withRent: number };
}

/**
 * The detailed countries and, when given, the estimated ones (which must use
 * the detailed Netherlands as their basket), as one list.
 */
export function parseDataset(value: unknown, estimatedValue: unknown = { countries: [] }): CostOfLivingDataset {
  if (typeof value !== "object" || value === null) fail("not an object");
  const data = value as Record<string, unknown>;
  if (!Array.isArray(data.countries) || data.countries.length === 0) fail("no countries");
  const detailed = data.countries.map((entry, index) => parseCountry(entry, index));
  const estimatedData = estimatedValue as { countries?: unknown; method?: EstimateMethod };
  if (!Array.isArray(estimatedData.countries)) fail("estimated countries must be a list");
  const basket = detailed.find((country) => country.code === "NL");
  if (estimatedData.countries.length > 0) {
    const method = estimatedData.method;
    if (!basket || !method || method.basket.withoutRent !== basket.monthlyCostEur.withoutRent || method.basket.rent !== basket.monthlyCostEur.withRent - basket.monthlyCostEur.withoutRent) {
      fail("estimated countries must use the Netherlands' detailed figures as their basket");
    }
  }
  const defaults: EstimateDefaults = {
    source: (year) => `World Bank price level (${year}) next to the Netherlands', applied to its figures`,
    referenceDate: basket?.referenceDate ?? "",
  };
  const countries = [...detailed, ...estimatedData.countries.map((entry, index) => parseCountry(entry, detailed.length + index, defaults))];
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

export const costOfLiving: CostOfLivingDataset = parseDataset(raw, estimatedRaw);

/** The estimates' method and fit, as the script wrote them. */
export const ESTIMATE_METHOD: EstimateMethod = estimatedRaw.method;

/** Countries with World Bank price data that are left out, and why (not enough data, or prices rising over 30% a year). */
export const ESTIMATE_EXCLUDED: readonly { code: string; reason: string }[] = estimatedRaw.excluded;

/** The country "Rising prices in" (Wealth Lens' inflation) starts with: one source, inflation-rates.ts. */
export { DEFAULT_PRICES_OF };

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

