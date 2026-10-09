/**
 * What it costs to live in each country, as the pages read it: a small
 * table (data/living-costs.json, about 15 KB) made at build time from the
 * official data by scripts/living-costs.ts (method: official/living-costs.ts
 * and research/wealth-lens/coste-de-vida.md), with each country's reference
 * inflation (data/inflation-reference.json). A test keeps the table equal
 * to what the official data give. Countries the official data cannot price
 * are not in it: no figure is invented.
 */

import inflationReference from "./data/inflation-reference.json" with { type: "json" };
import livingCosts from "./data/living-costs.json" with { type: "json" };
import { DEFAULT_PRICES_OF } from "./inflation-rates.ts";

export { DEFAULT_PRICES_OF };

export interface ReferenceInflation {
  rate: number;
  /** Where it comes from: "European Central Bank target: 2%". */
  basis: string;
  /** YYYY-MM. */
  asOf: string;
  /** The 2015–2024 average, for countries whose prices rose 10% a year or more then. */
  recentAverage?: number;
}

/** One country's figures, as data/living-costs.json keeps them. */
export interface LivingCost {
  /** ISO 3166-1 alpha-2. */
  code: string;
  /** What an average person there lives on, a month, in US dollars of `priceYear`. */
  monthlyCostUsd: number;
  /** The same in euros, at the official exchange rate of `priceYear`: to the nearest 10, or to the nearest euro under 100. */
  monthlyCostEur: number;
  /** The year of the prices: the country's latest price level. */
  priceYear: number;
  /** The year of the country's latest household survey. */
  surveyYear: number;
}

export interface CountryCost extends LivingCost {
  /** "YYYY": the year of the prices, as the tools date a figure. */
  referenceDate: string;
  /** Where the figure comes from, in a line (English; each tool writes its own). */
  source: string;
  /** A long-run reference for its consumer prices; null if it has none. */
  inflation: ReferenceInflation | null;
}

export interface CostOfLivingDataset {
  description: string;
  /** The latest year of prices any country has. */
  priceYear: number;
  /** YYYY-MM-DD: when the official data were downloaded. */
  compiledOn: string;
  /** Set when the official data are a provisional start (official/data.ts). */
  provisional: string | null;
  countries: CountryCost[];
}

const INFLATION = inflationReference.countries as Readonly<Record<string, ReferenceInflation>>;
const TABLE = livingCosts as Omit<CostOfLivingDataset, "countries"> & { countries: LivingCost[] };

export const costOfLiving: CostOfLivingDataset = {
  ...TABLE,
  countries: TABLE.countries.map((country) => ({
    ...country,
    referenceDate: String(country.priceYear),
    source: `World Bank: household survey mean (${country.surveyYear}), price level (${country.priceYear})`,
    inflation: INFLATION[country.code] ?? null,
  })),
};

/** A country of the list by its code; `undefined` for any other. */
export function countryByCode(code: string, countries: readonly CountryCost[] = costOfLiving.countries): CountryCost | undefined {
  return countries.find((country) => country.code === code);
}

/** The reference inflation of a country, or the default country's for any other code. */
export function referenceInflation(code: string): ReferenceInflation {
  return INFLATION[code] ?? INFLATION[DEFAULT_PRICES_OF];
}

/** Every country with a reference inflation. */
export const REFERENCE_INFLATION: Readonly<Record<string, ReferenceInflation>> = INFLATION;
