/**
 * Monte Carlo helpers for the report, over the same historical yearly real
 * returns as the rest of the app (lib/investment.ts):
 *
 * - wealth percentiles while saving: the uncertainty band of the growth
 *   curve and the "bad first decade" finding;
 * - a cache of withdrawal success rates, which depend only on the history
 *   and the rate, so changing the monthly amount never re-runs them.
 *
 * Yearly steps keep it fast: half of the year's contributions are added at
 * the start and half at the end, which matches monthly contributions to
 * first order (12 × monthly × (1 + r/2)).
 */

import { mulberry32, successRates } from "./monte-carlo";

export interface WealthPercentiles {
  /** Year 0 (today) to `years`. */
  p10: number[];
  p50: number[];
  p90: number[];
}

export interface WealthOptions {
  start: number;
  monthly: number;
  returns: readonly number[];
  years: number;
  simulations?: number;
  seed?: number;
}

/** Percentile of a sorted array, linear between neighbours. */
export function percentile(sorted: readonly number[], p: number): number {
  if (sorted.length === 0) return NaN;
  const position = (sorted.length - 1) * p;
  const low = Math.floor(position);
  const high = Math.ceil(position);
  return sorted[low] + (sorted[high] - sorted[low]) * (position - low);
}

/** 10th, 50th and 90th percentile of the balance at each year, drawing each year's return from history. */
export function wealthPercentiles({
  start,
  monthly,
  returns,
  years,
  simulations = 1000,
  seed = 20260929,
}: WealthOptions): WealthPercentiles {
  if (returns.length === 0) throw new RangeError("returns must not be empty");
  const random = mulberry32(seed);
  const half = 6 * monthly;
  // byYear[y][s]: balance of simulation s after y years.
  const byYear = Array.from({ length: years + 1 }, () => new Float64Array(simulations));
  byYear[0].fill(start);
  for (let s = 0; s < simulations; s++) {
    let balance = start;
    for (let y = 1; y <= years; y++) {
      const r = returns[Math.floor(random() * returns.length)];
      balance = (balance + half) * (1 + r) + half;
      byYear[y][s] = balance;
    }
  }
  const result: WealthPercentiles = { p10: [], p50: [], p90: [] };
  for (const values of byYear) {
    const sorted = Array.from(values).sort((a, b) => a - b);
    result.p10.push(percentile(sorted, 0.1));
    result.p50.push(percentile(sorted, 0.5));
    result.p90.push(percentile(sorted, 0.9));
  }
  return result;
}

const successCache = new Map<string, number>();
const MAX_CACHED = 64;
const cacheId = (key: string, rate: number) => `${key}|${rate.toFixed(4)}`;

/**
 * How often each withdrawal rate lasted 30 years with this history, cached
 * by the history's key (see ResolvedInvestment.key) and the rate. Missing
 * rates are simulated together, over the same sequences.
 */
export function cachedSuccessRates(key: string, returns: readonly number[], rates: readonly number[]): number[] {
  const missing = rates.filter((rate) => !successCache.has(cacheId(key, rate)));
  if (missing.length > 0) {
    const computed = successRates({ withdrawalRates: missing, returns });
    missing.forEach((rate, index) => {
      if (successCache.size >= MAX_CACHED) successCache.delete(successCache.keys().next().value as string);
      successCache.set(cacheId(key, rate), computed[index]);
    });
  }
  return rates.map((rate) => successCache.get(cacheId(key, rate)) ?? NaN);
}

export function cachedSuccessRate(key: string, returns: readonly number[], withdrawalRate: number): number {
  return cachedSuccessRates(key, returns, [withdrawalRate])[0];
}
