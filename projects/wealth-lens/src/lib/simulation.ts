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
 * first order (12 × monthly × (1 + r/2)). Each simulated balance is linear
 * in the starting amount and the monthly amount (start × growth + monthly
 * × added), so the random paths are drawn once per history and reused
 * while the amounts are typed.
 */

import { mulberry32, successRates } from "./monte-carlo";
import { PRECOMPUTED_SUCCESS } from "./success-table";

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
  /** Identifies `returns` (ResolvedInvestment.key); with it the random paths are cached. */
  key?: string;
}

/** Per year and simulation: what €1 at the start and €1 a month have become. */
interface Paths {
  growth: Float64Array[];
  added: Float64Array[];
}

const pathCache = new Map<string, Paths>();
/** Up to ~0.8 MB each (50 years × 1,000 simulations × 2 arrays). */
const MAX_PATHS = 8;

function drawPaths(returns: readonly number[], years: number, simulations: number, seed: number): Paths {
  const random = mulberry32(seed);
  const growth = Array.from({ length: years + 1 }, () => new Float64Array(simulations));
  const added = Array.from({ length: years + 1 }, () => new Float64Array(simulations));
  growth[0].fill(1);
  for (let s = 0; s < simulations; s++) {
    let g = 1;
    let a = 0;
    for (let y = 1; y <= years; y++) {
      const factor = 1 + returns[Math.floor(random() * returns.length)];
      g *= factor;
      a = (a + 6) * factor + 6;
      growth[y][s] = g;
      added[y][s] = a;
    }
  }
  return { growth, added };
}

function paths(returns: readonly number[], years: number, simulations: number, seed: number, key?: string): Paths {
  if (key === undefined) return drawPaths(returns, years, simulations, seed);
  const id = `${key}|${years}|${simulations}|${seed}`;
  let cached = pathCache.get(id);
  if (!cached) {
    if (pathCache.size >= MAX_PATHS) pathCache.delete(pathCache.keys().next().value as string);
    cached = drawPaths(returns, years, simulations, seed);
    pathCache.set(id, cached);
  }
  return cached;
}

/** Percentile of a sorted array, linear between neighbours. */
export function percentile(sorted: ArrayLike<number>, p: number): number {
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
  key,
}: WealthOptions): WealthPercentiles {
  if (returns.length === 0) throw new RangeError("returns must not be empty");
  const { growth, added } = paths(returns, years, simulations, seed, key);
  const result: WealthPercentiles = { p10: [], p50: [], p90: [] };
  const balances = new Float64Array(simulations);
  for (let y = 0; y <= years; y++) {
    for (let s = 0; s < simulations; s++) balances[s] = start * growth[y][s] + monthly * added[y][s];
    // A typed array sorts numerically, natively: much faster than a comparator.
    balances.sort();
    result.p10.push(percentile(balances, 0.1));
    result.p50.push(percentile(balances, 0.5));
    result.p90.push(percentile(balances, 0.9));
  }
  return result;
}

/**
 * A few of the very paths the percentiles come from, whole, for the view
 * of the possible futures: `count` of them, evenly spread over the
 * simulations (which are in random order), each year 0 to `years`.
 */
export function wealthSamples({ start, monthly, returns, years, simulations = 1000, seed = 20260929, key, count }: WealthOptions & { count: number }): number[][] {
  if (returns.length === 0) throw new RangeError("returns must not be empty");
  const { growth, added } = paths(returns, years, simulations, seed, key);
  const step = simulations / count;
  return Array.from({ length: count }, (_, index) => {
    const s = Math.floor(index * step);
    return Array.from({ length: years + 1 }, (_, y) => start * growth[y][s] + monthly * added[y][s]);
  });
}

const successCache = new Map<string, number>();
const MAX_CACHED = 64;
const cacheId = (key: string, rate: number) => `${key}|${rate.toFixed(4)}`;

/**
 * How often each withdrawal rate lasted 30 years with this history, cached
 * by the history's key (see ResolvedInvestment.key) and the rate. The
 * slider's eleven rates (2 % to 7 %) for each index and the starting plan
 * come from lib/success-table.ts; missing rates are simulated together,
 * over the same sequences.
 */
export function cachedSuccessRates(key: string, returns: readonly number[], rates: readonly number[]): number[] {
  const known = (rate: number) => PRECOMPUTED_SUCCESS[key]?.[rate.toFixed(4)];
  const missing = rates.filter((rate) => known(rate) === undefined && !successCache.has(cacheId(key, rate)));
  if (missing.length > 0) {
    const computed = successRates({ withdrawalRates: missing, returns });
    missing.forEach((rate, index) => {
      if (successCache.size >= MAX_CACHED) successCache.delete(successCache.keys().next().value as string);
      successCache.set(cacheId(key, rate), computed[index]);
    });
  }
  return rates.map((rate) => known(rate) ?? successCache.get(cacheId(key, rate)) ?? NaN);
}

export function cachedSuccessRate(key: string, returns: readonly number[], withdrawalRate: number): number {
  return cachedSuccessRates(key, returns, [withdrawalRate])[0];
}
