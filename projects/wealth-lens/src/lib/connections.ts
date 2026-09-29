/**
 * "Things you could buy": the purchase list of src/data/connections.json,
 * each entry with its source, validated when the module loads so a bad edit
 * fails loudly instead of rendering NaN. Prices are worked out in
 * lib/calculator.ts; months of living somewhere are priced from the
 * cost-of-living dataset, with housing.
 */

import raw from "@/data/connections.json";
import { costOfLiving } from "./cost-of-living";

// ---------------------------------------------------------------------------
// Dataset
// ---------------------------------------------------------------------------

export interface BuyItem {
  id: string;
  name: string;
  /** Fixed amount in EUR; absent when derived from living costs (monthsAt). */
  amount?: number;
  /** Months of living costs in these countries (their average, with housing), plus an optional fixed amount. */
  monthsAt?: { countries: string[]; months: number };
  plus?: number;
  /** Inputs of a calculated amount, so tests can recompute it. */
  calc?: Record<string, number | string>;
  source: string;
  referenceDate: string;
}

export interface ConnectionsDataset {
  compiledOn: string;
  usdPerEur: number;
  buy: BuyItem[];
}

function fail(message: string): never {
  throw new Error(`Invalid connections dataset: ${message}`);
}

const isText = (value: unknown): value is string => typeof value === "string" && value !== "";
const isPositive = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value) && value > 0;

/** Validated when the module loads, so a bad edit fails loudly instead of rendering NaN. */
export function parseConnections(value: unknown, countryCodes: ReadonlySet<string>): ConnectionsDataset {
  const data = value as Record<string, unknown>;
  if (typeof data !== "object" || data === null) fail("not an object");
  const conversion = data.conversion as { usdPerEur?: unknown } | undefined;
  if (!isPositive(conversion?.usdPerEur)) fail("missing usdPerEur");
  if (!Array.isArray(data.buy)) fail("expected a buy list");
  const ids = new Set<string>();
  const common = (entry: Record<string, unknown>, index: number) => {
    const label = isText(entry.id) ? entry.id : `entry ${index}`;
    if (!isText(entry.id) || !/^[a-z0-9-]+$/.test(entry.id)) fail(`${label}: invalid id`);
    if (ids.has(entry.id)) fail(`${label}: duplicate id`);
    ids.add(entry.id);
    if (!isText(entry.name)) fail(`${label}: missing name`);
    if (!isText(entry.source)) fail(`${label}: missing source`);
    if (!isText(entry.referenceDate) || !/^\d{4}(-\d{2})?$/.test(entry.referenceDate)) {
      fail(`${label}: referenceDate must be YYYY or YYYY-MM`);
    }
    return label;
  };
  const buy = data.buy.map((entry: Record<string, unknown>, index) => {
    const label = common(entry, index);
    const monthsAt = entry.monthsAt as BuyItem["monthsAt"];
    if (monthsAt) {
      const { countries, months } = monthsAt;
      if (!isPositive(months)) fail(`${label}: monthsAt.months must be positive`);
      if (!(Array.isArray(countries) && countries.length > 0 && countries.every((c) => countryCodes.has(c)))) {
        fail(`${label}: monthsAt.countries must be known country codes`);
      }
      if (entry.plus !== undefined && !isPositive(entry.plus)) fail(`${label}: plus must be positive`);
    } else if (!isPositive(entry.amount)) {
      fail(`${label}: needs an amount or monthsAt`);
    }
    return entry as unknown as BuyItem;
  });
  return { compiledOn: String(data.compiledOn ?? ""), usdPerEur: conversion.usdPerEur, buy };
}

export const connectionsData: ConnectionsDataset = parseConnections(
  raw,
  new Set(costOfLiving.countries.map((country) => country.code)),
);
