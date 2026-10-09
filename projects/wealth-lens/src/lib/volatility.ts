/**
 * How much an asset moves in a year: the spread of its yearly returns, in
 * log terms (the standard deviation of log(1 + r)).
 */

import type { SeriesId } from "./index-ids";
import { SERIES } from "./indexes";

/** Mean and standard deviation of log(1 + r). */
export function logStats(returns: readonly number[]): { mean: number; deviation: number } {
  const logs = returns.map((value) => Math.log1p(value));
  const mean = logs.reduce((sum, value) => sum + value, 0) / logs.length;
  const variance = logs.length > 1 ? logs.reduce((sum, value) => sum + (value - mean) ** 2, 0) / (logs.length - 1) : 0;
  return { mean, deviation: Math.sqrt(variance) };
}

/** Volatility of an asset's yearly returns over the years every projection uses. */
export function indexVolatility(index: SeriesId): number {
  return logStats(SERIES[index].years.map((entry) => entry.realReturn)).deviation;
}
