/**
 * Wishes and things to buy: the list of src/data/connections.json, each
 * entry with its source, validated when the module loads so a bad edit
 * fails loudly instead of rendering NaN. Prices are worked out in
 * lib/calculator.ts, for the country of the prices the user sees (lib/
 * wish-country.ts): an item is priced one of four ways.
 *
 * - amount: one published figure (or a calculation from one, see calc);
 *   with `country`, a figure of that country only.
 * - monthsAt: months of living costs in some countries, with housing
 *   (cost-of-living.json), wherever the user's prices are from.
 * - prices: a figure for each country of the prices, each with its own
 *   source; the Netherlands always has one.
 * - monthsHome: months of living costs with housing in the country of the
 *   prices, plus, with `fees`, that country's fee.
 *
 * The method and every source are in research/wealth-lens/deseos.md.
 */

import raw from "@/data/connections.json";
import { costOfLiving } from "./cost-of-living";

// ---------------------------------------------------------------------------
// Dataset
// ---------------------------------------------------------------------------

/** What a published figure measures: the words for each are in the messages (things.basis). */
export const PRICE_BASES = ["asking", "paid", "list", "sales", "valuation", "survey", "suppliers", "official"] as const;
export type PriceBasis = (typeof PRICE_BASES)[number];

/** The icons a wish can have (components/money/wish-icon.tsx). */
export const WISH_ICONS = ["landmark", "backpack", "plane", "house", "car", "car-front", "heart", "sun", "graduation-cap"] as const;
export type WishIcon = (typeof WISH_ICONS)[number];

/**
 * What a wish is about, among the areas docs/direction.md asks to research:
 * "With this you could" shows examples of the first three (lib/wishes.ts).
 */
export const WISH_AREAS = ["experiences", "housing", "time", "learning", "mobility", "celebration"] as const;
export type WishArea = (typeof WISH_AREAS)[number];

/** One country's figure, with its own source. */
export interface CountryPrice {
  amount: number;
  basis: PriceBasis;
  /** Who published it, in the publisher's own words: shown as it is in every language. */
  source: string;
  /** What exactly it is, in English, for whoever reads the dataset (research/wealth-lens/deseos.md says it in Spanish). */
  note: string;
  referenceDate: string;
  /** A rough figure, shown with "≈". */
  estimate?: boolean;
  /** Inputs of a calculated amount, so tests can recompute it. */
  calc?: Record<string, number | string>;
}

export interface BuyItem {
  id: string;
  /** In English, for whoever reads the dataset; the app's names are in the messages (things.items). */
  name: string;
  icon?: WishIcon;
  area?: WishArea;
  /** False: kept only so goals in older files still find it; no list shows it. */
  listed?: boolean;
  /** A figure of this country only: listed when its prices are shown. */
  country?: string;
  /** The country the item is about (a flat in Portugal): not listed when its prices are shown, a home there says it better. */
  place?: string;
  /** Fixed amount in EUR. */
  amount?: number;
  /** Months of living costs in these countries (their average, with housing), plus an optional fixed amount. */
  monthsAt?: { countries: string[]; months: number };
  plus?: number;
  prices?: Record<string, CountryPrice>;
  /** Months of living costs with housing in the country of the prices, plus its fee. */
  monthsHome?: { months: number; fees?: Record<string, CountryPrice> };
  /** A rough figure, shown with "≈" (amount and monthsAt). */
  estimate?: boolean;
  /** Inputs of a calculated amount, so tests can recompute it. */
  calc?: Record<string, number | string>;
  source: string;
  referenceDate: string;
}

export interface ConnectionsDataset {
  compiledOn: string;
  /** The countries whose prices the user can see, the Netherlands first: the one shown when the browser's is not here. */
  priceCountries: string[];
  usdPerEur: number;
  buy: BuyItem[];
}

function fail(message: string): never {
  throw new Error(`Invalid connections dataset: ${message}`);
}

const isText = (value: unknown): value is string => typeof value === "string" && value !== "";
const isPositive = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value) && value > 0;
const isDate = (value: unknown) => isText(value) && /^\d{4}(-\d{2})?$/.test(value);

function parsePrices(value: unknown, label: string, countries: readonly string[], { all, zero }: { all: boolean; zero: boolean }): Record<string, CountryPrice> {
  if (typeof value !== "object" || value === null) fail(`${label}: expected a price for each country`);
  const prices = value as Record<string, Record<string, unknown>>;
  for (const [code, price] of Object.entries(prices)) {
    const where = `${label} ${code}`;
    if (!countries.includes(code)) fail(`${where}: not a country of the prices`);
    const amountOk = zero ? typeof price.amount === "number" && Number.isFinite(price.amount) && price.amount >= 0 : isPositive(price.amount);
    if (!amountOk) fail(`${where}: invalid amount`);
    if (!(PRICE_BASES as readonly unknown[]).includes(price.basis)) fail(`${where}: unknown basis`);
    if (!isText(price.source)) fail(`${where}: missing source`);
    if (!isText(price.note)) fail(`${where}: missing note`);
    if (!isDate(price.referenceDate)) fail(`${where}: referenceDate must be YYYY or YYYY-MM`);
  }
  const missing = (all ? countries : countries.slice(0, 1)).filter((code) => !(code in prices));
  if (missing.length > 0) fail(`${label}: no price for ${missing.join(", ")}`);
  return prices as unknown as Record<string, CountryPrice>;
}

/** Validated when the module loads, so a bad edit fails loudly instead of rendering NaN. */
export function parseConnections(value: unknown, countryCodes: ReadonlySet<string>): ConnectionsDataset {
  const data = value as Record<string, unknown>;
  if (typeof data !== "object" || data === null) fail("not an object");
  const conversion = data.conversion as { usdPerEur?: unknown } | undefined;
  if (!isPositive(conversion?.usdPerEur)) fail("missing usdPerEur");
  const priceCountries = data.priceCountries;
  if (!(Array.isArray(priceCountries) && priceCountries.length > 0 && priceCountries.every((code) => countryCodes.has(code)))) {
    fail("priceCountries must be known country codes");
  }
  if (!Array.isArray(data.buy)) fail("expected a buy list");
  const ids = new Set<string>();
  const buy = data.buy.map((entry: Record<string, unknown>, index) => {
    const label = isText(entry.id) ? entry.id : `entry ${index}`;
    if (!isText(entry.id) || !/^[a-z0-9-]+$/.test(entry.id)) fail(`${label}: invalid id`);
    if (ids.has(entry.id)) fail(`${label}: duplicate id`);
    ids.add(entry.id);
    if (!isText(entry.name)) fail(`${label}: missing name`);
    if (!isText(entry.source)) fail(`${label}: missing source`);
    if (!isDate(entry.referenceDate)) fail(`${label}: referenceDate must be YYYY or YYYY-MM`);
    if (entry.icon !== undefined && !(WISH_ICONS as readonly unknown[]).includes(entry.icon)) fail(`${label}: unknown icon`);
    if (entry.area !== undefined && !(WISH_AREAS as readonly unknown[]).includes(entry.area)) fail(`${label}: unknown area`);
    if (entry.area !== undefined && entry.icon === undefined) fail(`${label}: a wish needs an icon`);
    if (entry.country !== undefined && !priceCountries.includes(entry.country)) fail(`${label}: country must be a country of the prices`);
    if (entry.place !== undefined && !countryCodes.has(entry.place as string)) fail(`${label}: place must be a known country code`);
    const ways = ["amount", "monthsAt", "prices", "monthsHome"].filter((key) => entry[key] !== undefined);
    if (ways.length !== 1) fail(`${label}: needs exactly one of amount, monthsAt, prices or monthsHome`);
    const monthsAt = entry.monthsAt as BuyItem["monthsAt"];
    const monthsHome = entry.monthsHome as BuyItem["monthsHome"];
    if (monthsAt) {
      const { countries, months } = monthsAt;
      if (!isPositive(months)) fail(`${label}: monthsAt.months must be positive`);
      if (!(Array.isArray(countries) && countries.length > 0 && countries.every((c) => countryCodes.has(c)))) {
        fail(`${label}: monthsAt.countries must be known country codes`);
      }
      if (entry.plus !== undefined && !isPositive(entry.plus)) fail(`${label}: plus must be positive`);
    } else if (entry.prices !== undefined) {
      parsePrices(entry.prices, label, priceCountries, { all: false, zero: false });
    } else if (monthsHome) {
      if (!isPositive(monthsHome.months)) fail(`${label}: monthsHome.months must be positive`);
      if (monthsHome.fees !== undefined) parsePrices(monthsHome.fees, `${label} fees`, priceCountries, { all: true, zero: true });
    } else if (!isPositive(entry.amount)) {
      fail(`${label}: invalid amount`);
    }
    return entry as unknown as BuyItem;
  });
  return { compiledOn: String(data.compiledOn ?? ""), priceCountries, usdPerEur: conversion.usdPerEur, buy };
}

export const connectionsData: ConnectionsDataset = parseConnections(
  raw,
  new Set(costOfLiving.countries.map((country) => country.code)),
);

/** The countries whose prices the user can see; the first, the Netherlands, when the browser's country is not among them. */
export const PRICE_COUNTRIES: readonly string[] = connectionsData.priceCountries;
export const DEFAULT_PRICE_COUNTRY = PRICE_COUNTRIES[0];
