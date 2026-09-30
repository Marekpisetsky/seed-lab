/**
 * Yearly returns for assumptions the user typed (lib/investment.ts): with
 * no history behind them, each year's growth is drawn from a normal
 * distribution in log terms,
 *
 *   log(1 + r) ~ Normal(log(1 + g), σ²),
 *
 * where g is the growth a year and σ the swings. The typical year (the
 * median) grows exactly g, and two years in three fall within ±σ of it in
 * log terms; a year can never lose more than everything.
 *
 * The simulations draw with replacement from a pool, as they do from a
 * history (lib/simulation.ts), so the pool is the distribution itself:
 * POOL_SIZE evenly spaced quantiles of it. That is as good as drawing from
 * the normal directly (the pool reaches ±3.5σ) and needs no other code.
 */

/** Quantiles in the pool: from the 0.025 % to the 99.975 % one. */
export const POOL_SIZE = 2000;

/**
 * The inverse of the standard normal distribution (Acklam's rational
 * approximation, relative error under 1.2e-9).
 */
export function inverseNormal(p: number): number {
  if (!(p > 0 && p < 1)) throw new RangeError(`p must be between 0 and 1, got ${p}`);
  const a = [-39.69683028665376, 220.9460984245205, -275.9285104469687, 138.357751867269, -30.66479806614716, 2.506628277459239];
  const b = [-54.47609879822406, 161.5858368580409, -155.6989798598866, 66.80131188771972, -13.28068155288572];
  const c = [-0.007784894002430293, -0.3223964580411365, -2.400758277161838, -2.549732539343734, 4.374664141464968, 2.938163982698783];
  const d = [0.007784695709041462, 0.3224671290700398, 2.445134137142996, 3.754408661907416];
  const low = 0.02425;
  if (p < low) {
    const q = Math.sqrt(-2 * Math.log(p));
    return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  }
  if (p > 1 - low) return -inverseNormal(1 - p);
  const q = p - 0.5;
  const r = q * q;
  return ((((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q) / (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
}

let standard: Float64Array | null = null;

/** The pool's quantiles of the standard normal, worked out once. */
function standardPool(): Float64Array {
  if (!standard) {
    standard = new Float64Array(POOL_SIZE);
    for (let i = 0; i < POOL_SIZE; i++) standard[i] = inverseNormal((i + 0.5) / POOL_SIZE);
  }
  return standard;
}

/** Yearly returns to draw from for growth `growth` a year and swings `volatility` (σ of log returns). */
export function normalReturns(growth: number, volatility: number): number[] {
  if (!(growth > -1)) throw new RangeError(`growth must be above -100%, got ${growth}`);
  if (!(volatility >= 0)) throw new RangeError(`volatility must be 0 or more, got ${volatility}`);
  const center = Math.log1p(growth);
  return Array.from(standardPool(), (z) => Math.expm1(center + volatility * z));
}
