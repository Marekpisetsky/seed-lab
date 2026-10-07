/**
 * How a growth the user types compares with what the data has seen, worked
 * out from the datasets themselves (lib/indexes.ts), never typed in:
 *
 * - the best 20 years in a row of any asset with a history, as a steady
 *   growth a year after rising prices (the geometric average): a typed
 *   growth above it is very rare, since no broad index ever kept it that
 *   long (today the S&P 500 in 1980–1999);
 * - the asset whose average growth is closest to the typed one, and how
 *   much it moved in a year: growth and ups and downs came together;
 * - over 50 % a year, the best average each index and each large company
 *   of the stored prices kept over the plan's years (or over all its data,
 *   when it has fewer): step 3 then says plainly that none kept it, or names
 *   the one that did, and for how long. Never a claim the data denies:
 *   Nvidia kept 64 % a year from 2016 to 2026.
 */

import { seriesVolatility } from "./assets";
import { annualizedReturn, SERIES, SERIES_IDS, type SeriesId } from "./indexes";
import { INSTRUMENTS, MARKET } from "./market-data";
import type { PricesFile } from "./market-format";

/** Years in a row the best average is looked for over. */
export const BEST_RUN_YEARS = 20;

export interface BestRun {
  asset: SeriesId;
  /** First and last calendar year. */
  from: number;
  to: number;
  /** Steady growth a year after rising prices over those years. */
  growth: number;
}

/** The best `years` in a row of any asset's whole dataset. */
export function bestRun(years: number = BEST_RUN_YEARS): BestRun {
  let best: BestRun | null = null;
  for (const asset of SERIES_IDS) {
    const data = SERIES[asset].dataset.years;
    for (let start = 0; start + years <= data.length; start++) {
      const growth = annualizedReturn(data.slice(start, start + years).map((entry) => entry.realReturn));
      if (!best || growth > best.growth) best = { asset, from: data[start].year, to: data[start + years - 1].year, growth };
    }
  }
  if (!best) throw new RangeError(`No dataset has ${years} years`);
  return best;
}

export const BEST_20_YEARS: BestRun = bestRun();

/** Growth after rising prices beyond the best 20 years any asset kept. */
export function beyondHistory(realReturn: number, best: BestRun = BEST_20_YEARS): boolean {
  return realReturn > best.growth;
}

export interface Neighbour {
  asset: SeriesId;
  /** Its average growth a year after rising prices, over the common period. */
  growth: number;
  /** How much it moved in a year: the spread of its yearly returns. */
  volatility: number;
}

/** The asset whose average growth is closest to `realReturn`, with how much it moved. */
export function closestHistory(realReturn: number): Neighbour {
  const all = SERIES_IDS.map((asset) => ({ asset, growth: SERIES[asset].averageReturn, volatility: seriesVolatility(asset) }));
  return all.reduce((best, entry) => (Math.abs(entry.growth - realReturn) < Math.abs(best.growth - realReturn) ? entry : best));
}

/** Over this growth a year after rising prices, step 3's warning names what the data has kept. */
export const STRONG_GROWTH = 0.5;

export interface KeptRecord {
  /** An index of lib/indexes.ts, or a company of the stored prices, by its ticker. */
  kind: "index" | "stock";
  id: string;
  /** Average growth a year: an index's after rising prices; a company's, its price before them (a little more). */
  growth: number;
  /** Years in a row, and their first and last calendar years. */
  years: number;
  from: number;
  to: number;
}

const YEAR_MS = 365.25 * 24 * 3600 * 1000;

/** The best average over `years` consecutive yearly returns. */
function bestWindow(returns: readonly { year: number; value: number }[], years: number): Omit<KeptRecord, "kind" | "id"> | null {
  let best: Omit<KeptRecord, "kind" | "id"> | null = null;
  for (let start = 0; start + years <= returns.length; start++) {
    const growth = annualizedReturn(returns.slice(start, start + years).map((entry) => entry.value));
    if (!best || growth > best.growth) best = { growth, years, from: returns[start].year, to: returns[start + years - 1].year };
  }
  return best;
}

/**
 * The best average a year each index and each large company kept over
 * `years` in a row, or over all its data when it has fewer, best first. A
 * company's calendar years are looked at when there are enough; else its
 * growth since its stored prices begin (about 10 years). Funds are not
 * companies: they follow an index.
 */
export function keptRecords(years: number, market: PricesFile = MARKET): KeptRecord[] {
  const records: KeptRecord[] = [];
  for (const asset of SERIES_IDS) {
    const data = SERIES[asset].dataset.years.map((entry) => ({ year: entry.year, value: entry.realReturn }));
    const best = bestWindow(data, Math.min(years, data.length));
    if (best) records.push({ kind: "index", id: asset, ...best });
  }
  for (const instrument of INSTRUMENTS) {
    const prices = market.prices[instrument.id];
    if (instrument.kind !== "stock" || !prices) continue;
    const calendar = Object.entries(prices.stats?.years ?? {})
      .map(([year, value]) => ({ year: Number(year), value }))
      .sort((a, b) => a.year - b.year);
    if (years <= calendar.length) {
      const best = bestWindow(calendar, years);
      if (best) records.push({ kind: "stock", id: instrument.id, ...best });
    } else if (prices.growth) {
      const span = Math.round((Date.parse(prices.date) - Date.parse(prices.growth.from)) / YEAR_MS);
      records.push({ kind: "stock", id: instrument.id, growth: prices.growth.perYear, years: span, from: Number(prices.growth.from.slice(0, 4)), to: Number(prices.date.slice(0, 4)) });
    }
  }
  return records.sort((a, b) => b.growth - a.growth);
}
