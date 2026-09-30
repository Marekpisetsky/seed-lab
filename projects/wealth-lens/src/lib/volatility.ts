/**
 * How much a single stock moves, and how its projection uses that.
 *
 * A stock is projected with its reference index's average growth: nobody
 * can predict one company's next decades, and its own past is shown apart
 * as "past, not a forecast". Its ups and downs, though, are its own: the
 * index's historical years are stretched around their mean, in log terms,
 * until they swing as much as the stock does (`scaleVolatility`). The
 * geometric mean stays the index's, so the middle outcome is the same; the
 * band around it widens, the bad outcomes get worse and a withdrawal rate
 * lasts less often.
 *
 * The stock's volatility comes from its daily closes (public/data, worked
 * out by the price job: scripts/lib/stats.mts). With fewer than
 * MIN_DATA_YEARS of closes it is not trusted: the index's volatility times
 * FALLBACK_FACTOR is used instead, and the page says so.
 */

import type { IndexId } from "./index-ids";
import { INDEXES } from "./indexes";
import type { Instrument, PricesFile } from "./market-format";

/** Years of daily closes before a stock's own volatility is used. */
export const MIN_DATA_YEARS = 3;
/**
 * A stock with too little data swings this many times as much as its index.
 * Conservative: single large stocks usually move 1.2 to 3 times as much as a
 * broad index (with 10 years of closes here: Berkshire about 1.2, Apple 1.4,
 * SAP 1.7, NVIDIA 2.4, Tesla 2.9 times their index ETF), so twice the index
 * is at the upper middle of that range.
 */
export const FALLBACK_FACTOR = 2;

const YEAR_MS = 365.25 * 24 * 60 * 60 * 1000;

/** Mean and standard deviation of log(1 + r). */
export function logStats(returns: readonly number[]): { mean: number; deviation: number } {
  const logs = returns.map((value) => Math.log1p(value));
  const mean = logs.reduce((sum, value) => sum + value, 0) / logs.length;
  const variance = logs.reduce((sum, value) => sum + (value - mean) ** 2, 0) / (logs.length - 1);
  return { mean, deviation: Math.sqrt(variance) };
}

/**
 * The same years, `factor` times as far from their mean in log terms: the
 * geometric average is unchanged, the spread is multiplied by `factor`.
 */
export function scaleVolatility(returns: readonly number[], factor: number): number[] {
  const { mean } = logStats(returns);
  return returns.map((value) => Math.expm1(mean + factor * (Math.log1p(value) - mean)));
}

/** Volatility of an index's yearly returns over the years every projection uses. */
export function indexVolatility(index: IndexId): number {
  return logStats(INDEXES[index].years.map((entry) => entry.realReturn)).deviation;
}

export interface StockVolatility {
  /** Yearly volatility used for the stock's ups and downs. */
  volatility: number;
  /** True when the data were too short and FALLBACK_FACTOR × the index's was used. */
  fallback: boolean;
  /** Years of daily closes the stock has. */
  dataYears: number;
  from: string | null;
  to: string | null;
}

export function stockVolatility(instrument: Instrument, market: PricesFile): StockVolatility {
  const stats = market.prices[instrument.id]?.stats ?? null;
  const dataYears = stats ? (Date.parse(stats.to) - Date.parse(stats.from)) / YEAR_MS : 0;
  if (stats && dataYears >= MIN_DATA_YEARS) {
    return { volatility: stats.volatility, fallback: false, dataYears, from: stats.from, to: stats.to };
  }
  return {
    volatility: indexVolatility(instrument.index) * FALLBACK_FACTOR,
    fallback: true,
    dataYears,
    from: stats?.from ?? null,
    to: stats?.to ?? null,
  };
}
