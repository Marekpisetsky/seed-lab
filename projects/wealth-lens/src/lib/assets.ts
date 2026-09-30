/**
 * What a plan can be projected with. Only assets with a long history and a
 * known range are projected (lib/indexes.ts): the three stock indexes, euro
 * government bonds and gold; plus a savings account, whose growth is its
 * interest rate less inflation, without ups and downs. A single company's
 * shares are never projected on their own: nobody can predict one company's
 * next decades. Silver and other commodities are left out on purpose: they
 * have no long-run growth after inflation that could be defended.
 */

import { SERIES, SERIES_IDS, type SeriesId } from "./indexes";
import { logStats } from "./volatility";

export const ASSET_IDS = [...SERIES_IDS, "savings"] as const;
export type AssetId = (typeof ASSET_IDS)[number];

export function isAssetId(value: unknown): value is AssetId {
  return typeof value === "string" && (ASSET_IDS as readonly string[]).includes(value);
}

export function isSeriesAsset(asset: AssetId): asset is SeriesId {
  return asset !== "savings";
}

/**
 * A typical euro savings-account rate, before inflation: a round figure
 * for what easy-access savings accounts in the euro area paid in 2025–2026,
 * below the European Central Bank's deposit rate (2% since June 2025).
 * Every bank pays its own rate: the user can type theirs.
 */
export const SAVINGS_RATE = 0.015;
/** A savings account's growth after inflation: can be below zero. */
export function savingsRealReturn(inflation: number, rate: number = SAVINGS_RATE): number {
  return (1 + rate) / (1 + inflation) - 1;
}

/** Yearly swings of an asset with a history: the standard deviation of its yearly log returns over the common period. */
export function seriesVolatility(asset: SeriesId): number {
  return logStats(SERIES[asset].years.map((entry) => entry.realReturn)).deviation;
}
