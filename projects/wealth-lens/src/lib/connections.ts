/**
 * "What it means in real life": what the money can pay for, in two kinds.
 *
 * - live: a monthly cost the portfolio's withdrawals would cover forever
 *   (living in a country, paying the rent, working 4 days, stopping work).
 *   Its capital target is the yearly cost ÷ the withdrawal rate.
 * - buy: a one-off amount (a car, a deposit, a year off). Its target is the
 *   amount itself.
 *
 * Countries come from the curated cost-of-living dataset; everything else
 * from src/data/connections.json, where each entry cites its source. Items
 * that depend on the user's country ("Pay your rent", "A year off") are
 * worked out from that country's figures. The user can add their own.
 */

import raw from "@/data/connections.json";
import { costOfLiving, countryInSentence, type CountryCost } from "./cost-of-living";
import { requiredCapital } from "./finance";
import type { CustomConnection, Housing } from "./types";

export type ConnectionKind = "live" | "buy";

export interface Connection {
  /** "country:IN", "life:rent", "buy:new-car" or "custom:<id>". */
  id: string;
  kind: ConnectionKind;
  group: "country" | "life" | "buy" | "custom";
  /** "Live in India", "Pay your rent", "A new car". */
  name: string;
  /** live: monthly cost; buy: one-off amount. Today's euros. */
  amount: number;
  source: string;
  referenceDate: string;
}

// ---------------------------------------------------------------------------
// Dataset
// ---------------------------------------------------------------------------

type Place = "home" | string[];

export interface LiveItem {
  id: string;
  name: string;
  /** Share of the home country's monthly living costs, or "rent" for its rent alone. */
  share: number | "rent";
  source: string;
  referenceDate: string;
}

export interface BuyItem {
  id: string;
  name: string;
  /** Fixed amount in EUR; absent when derived from living costs (monthsAt). */
  amount?: number;
  /** Months of living costs somewhere, plus an optional fixed amount. */
  monthsAt?: { countries: Place; months: number };
  plus?: number;
  /** Inputs of a calculated amount, so tests can recompute it. */
  calc?: Record<string, number | string>;
  source: string;
  referenceDate: string;
}

export interface ConnectionsDataset {
  compiledOn: string;
  usdPerEur: number;
  live: LiveItem[];
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
  if (!Array.isArray(data.live) || !Array.isArray(data.buy)) fail("expected live and buy lists");
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
  const live = data.live.map((entry: Record<string, unknown>, index) => {
    const label = common(entry, index);
    const { share } = entry;
    if (share !== "rent" && !(isPositive(share) && share <= 1)) fail(`${label}: share must be "rent" or 0-1`);
    return entry as unknown as LiveItem;
  });
  const buy = data.buy.map((entry: Record<string, unknown>, index) => {
    const label = common(entry, index);
    const monthsAt = entry.monthsAt as BuyItem["monthsAt"];
    if (monthsAt) {
      const { countries, months } = monthsAt;
      if (!isPositive(months)) fail(`${label}: monthsAt.months must be positive`);
      if (countries !== "home" && !(Array.isArray(countries) && countries.length > 0 && countries.every((c) => countryCodes.has(c)))) {
        fail(`${label}: monthsAt.countries must be "home" or known country codes`);
      }
      if (entry.plus !== undefined && !isPositive(entry.plus)) fail(`${label}: plus must be positive`);
    } else if (!isPositive(entry.amount)) {
      fail(`${label}: needs an amount or monthsAt`);
    }
    return entry as unknown as BuyItem;
  });
  return { compiledOn: String(data.compiledOn ?? ""), usdPerEur: conversion.usdPerEur, live, buy };
}

export const connectionsData: ConnectionsDataset = parseConnections(
  raw,
  new Set(costOfLiving.countries.map((country) => country.code)),
);

// ---------------------------------------------------------------------------
// Connections for a plan
// ---------------------------------------------------------------------------

export function countryMonthlyCost(country: CountryCost, housing: Housing): number {
  return housing === "rent" ? country.monthlyCostEur.withRent : country.monthlyCostEur.withoutRent;
}

const roundTo10 = (value: number) => Math.round(value / 10) * 10;

export interface ConnectionContext {
  homeCountry: string;
  housing: Housing;
  custom: readonly CustomConnection[];
}

/** Every connection for this user, amounts worked out for their country and housing. */
export function allConnections(
  { homeCountry, housing, custom }: ConnectionContext,
  countries: readonly CountryCost[] = costOfLiving.countries,
  data: ConnectionsDataset = connectionsData,
): Connection[] {
  const byCode = new Map(countries.map((country) => [country.code, country]));
  const home = byCode.get(homeCountry) ?? countries[0];
  const homeCost = countryMonthlyCost(home, housing);
  const countrySource = (country: CountryCost) => `${country.source} (cost-of-living.json)`;

  const life: Connection[] = data.live
    // Nothing to pay when the home is owned.
    .filter((item) => !(item.share === "rent" && housing === "own"))
    .map((item) => ({
      id: `life:${item.id}`,
      kind: "live",
      group: "life",
      name: item.name,
      amount:
        item.share === "rent"
          ? home.monthlyCostEur.withRent - home.monthlyCostEur.withoutRent
          : roundTo10(homeCost * item.share),
      source: `${item.source} Country: ${countryInSentence(home.name)}.`,
      referenceDate: item.referenceDate,
    }));

  const living: Connection[] = countries
    .filter((country) => country.code !== home.code)
    .map((country) => ({
      id: `country:${country.code}`,
      kind: "live",
      group: "country",
      name: `Live in ${countryInSentence(country.name)}`,
      amount: countryMonthlyCost(country, housing),
      source: countrySource(country),
      referenceDate: country.referenceDate,
    }));

  const buys: Connection[] = data.buy.map((item) => {
    let amount = item.amount ?? 0;
    if (item.monthsAt) {
      const { countries: place, months } = item.monthsAt;
      // Abroad you rent; at home it depends on the user's housing.
      const monthly =
        place === "home"
          ? homeCost
          : place.reduce((sum, code) => sum + (byCode.get(code)?.monthlyCostEur.withRent ?? 0), 0) / place.length;
      amount = roundTo10(monthly * months) + (item.plus ?? 0);
    }
    return {
      id: `buy:${item.id}`,
      kind: "buy",
      group: "buy",
      name: item.name,
      amount,
      source:
        item.monthsAt && item.monthsAt.countries === "home" ? `${item.source} Country: ${countryInSentence(home.name)}.` : item.source,
      referenceDate: item.referenceDate,
    };
  });

  const own: Connection[] = custom.map((item) => ({
    id: `custom:${item.id}`,
    kind: item.kind,
    group: "custom",
    name: item.name,
    amount: item.amount,
    source: "Your own estimate.",
    referenceDate: "",
  }));

  return [...own, ...life, ...living, ...buys];
}

/** Capital that pays for a connection: live → yearly cost ÷ withdrawal rate; buy → its price. */
export function targetCapital(connection: Pick<Connection, "kind" | "amount">, withdrawalRate: number): number {
  return connection.kind === "live" ? requiredCapital(connection.amount * 12, withdrawalRate) : connection.amount;
}
