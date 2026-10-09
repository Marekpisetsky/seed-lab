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
 * - over 50 % a year, the best average each asset with a history kept
 *   over the plan's years (or over all its data, when it has fewer): step
 *   3 then says plainly that none kept it. (Single companies' prices went
 *   with the individual stocks on 9 October 2026.)
 */

import { seriesVolatility } from "./assets";
import { annualizedReturn, SERIES, SERIES_IDS, type SeriesId } from "./indexes";

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
  /** An asset of lib/indexes.ts. */
  kind: "index";
  id: string;
  /** Average growth a year after rising prices. */
  growth: number;
  /** Years in a row, and their first and last calendar years. */
  years: number;
  from: number;
  to: number;
}

/** The best average over `years` consecutive yearly returns. */
function bestWindow(returns: readonly { year: number; value: number }[], years: number): Omit<KeptRecord, "kind" | "id"> | null {
  let best: Omit<KeptRecord, "kind" | "id"> | null = null;
  for (let start = 0; start + years <= returns.length; start++) {
    const growth = annualizedReturn(returns.slice(start, start + years).map((entry) => entry.value));
    if (!best || growth > best.growth) best = { growth, years, from: returns[start].year, to: returns[start + years - 1].year };
  }
  return best;
}

/** The best average a year each asset kept over `years` in a row, or over all its data when it has fewer, best first. */
export function keptRecords(years: number): KeptRecord[] {
  const records: KeptRecord[] = [];
  for (const asset of SERIES_IDS) {
    const data = SERIES[asset].dataset.years.map((entry) => ({ year: entry.year, value: entry.realReturn }));
    const best = bestWindow(data, Math.min(years, data.length));
    if (best) records.push({ kind: "index", id: asset, ...best });
  }
  return records.sort((a, b) => b.growth - a.growth);
}
