/**
 * Figures about how each instrument moves, worked out from its stored daily
 * closes and written into public/data/prices.json with the prices, so the
 * app never has to download the histories to use them. Nothing here does
 * I/O.
 *
 * - Volatility: the standard deviation of daily log returns, times the
 *   square root of the returns observed per year.
 * - Calendar years: the price change over each full year the history
 *   covers (last close of the year against the last of the year before).
 * - Correlations: between weekly log returns (the last close on or before
 *   each Friday). Weekly, not daily, because the listings close at
 *   different hours (Frankfurt, Amsterdam, New York): a daily comparison
 *   would pair Monday in Europe with the US's Friday. A pair is only
 *   correlated over the weeks both series cover, and only when those are
 *   at least MIN_SHARED_WEEKS; otherwise it is `null` and the app falls
 *   back to the indexes.
 */

import type { Correlations, InstrumentStats } from "../../src/lib/market-format.ts";
import type { PricePoint } from "./series.mts";

/** Three years of shared weeks before two series are correlated. */
export const MIN_SHARED_WEEKS = 156;
/** Closes needed before a volatility is worked out (about three months). */
export const MIN_CLOSES = 60;

const DAY_MS = 24 * 60 * 60 * 1000;
const dayNumber = (isoDay: string) => Date.parse(`${isoDay}T00:00:00Z`) / DAY_MS;
const round4 = (value: number) => Number(value.toFixed(4));

function standardDeviation(values: readonly number[]): number {
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const variance = values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / (values.length - 1);
  return Math.sqrt(variance);
}

/** Yearly volatility from daily closes; `null` with fewer than MIN_CLOSES. */
export function volatility(points: readonly PricePoint[]): number | null {
  if (points.length < MIN_CLOSES) return null;
  const returns = points.slice(1).map((point, index) => Math.log(point.close / points[index].close));
  const years = (dayNumber(points[points.length - 1].time) - dayNumber(points[0].time)) / 365.25;
  return round4(standardDeviation(returns) * Math.sqrt(returns.length / years));
}

/**
 * Price change of every full calendar year: a year counts when the series
 * has a close in its last ten days and in the last ten days of the year
 * before.
 */
export function calendarYearReturns(points: readonly PricePoint[]): Record<string, number> {
  const lastOfYear = new Map<number, PricePoint>();
  for (const point of points) lastOfYear.set(Number(point.time.slice(0, 4)), point);
  const endsYear = (point: PricePoint | undefined, year: number) => point !== undefined && point.time >= `${year}-12-22`;
  const result: Record<string, number> = {};
  for (const [year, last] of lastOfYear) {
    const before = lastOfYear.get(year - 1);
    if (endsYear(last, year) && endsYear(before, year - 1) && before) result[String(year)] = round4(last.close / before.close - 1);
  }
  return result;
}

export function instrumentStats(points: readonly PricePoint[]): InstrumentStats | null {
  const perYear = volatility(points);
  if (perYear === null) return null;
  return { from: points[0].time, to: points[points.length - 1].time, volatility: perYear, years: calendarYearReturns(points) };
}

/** Fridays from the first to the last day, as `YYYY-MM-DD`. */
function fridays(from: string, to: string): string[] {
  const days: string[] = [];
  const day = new Date(`${from}T00:00:00Z`);
  day.setUTCDate(day.getUTCDate() + ((5 - day.getUTCDay() + 7) % 7));
  for (; day.toISOString().slice(0, 10) <= to; day.setUTCDate(day.getUTCDate() + 7)) days.push(day.toISOString().slice(0, 10));
  return days;
}

/** The last close on or before each day of `calendar`; `null` before the series starts or after it ends. */
export function closesOn(points: readonly PricePoint[], calendar: readonly string[]): (number | null)[] {
  const last = points[points.length - 1]?.time ?? "";
  let position = -1;
  return calendar.map((day) => {
    while (position + 1 < points.length && points[position + 1].time <= day) position += 1;
    // A week past the series' end has no close of its own.
    if (position < 0 || (day > last && dayNumber(day) - dayNumber(last) > 6)) return null;
    return points[position].close;
  });
}

/** Pearson correlation of two equally long lists. */
function correlation(a: readonly number[], b: readonly number[]): number {
  const n = a.length;
  const meanA = a.reduce((sum, value) => sum + value, 0) / n;
  const meanB = b.reduce((sum, value) => sum + value, 0) / n;
  let cov = 0;
  let varA = 0;
  let varB = 0;
  for (let i = 0; i < n; i++) {
    cov += (a[i] - meanA) * (b[i] - meanB);
    varA += (a[i] - meanA) ** 2;
    varB += (b[i] - meanB) ** 2;
  }
  return cov / Math.sqrt(varA * varB);
}

/** Weekly correlations between every pair of series, in the order given. */
export function weeklyCorrelations(series: Readonly<Record<string, readonly PricePoint[]>>): Correlations {
  const ids = Object.keys(series).filter((id) => series[id].length > 1);
  const from = ids.map((id) => series[id][0].time).sort()[0] ?? "";
  const to = ids.map((id) => series[id][series[id].length - 1].time).sort().at(-1) ?? "";
  const calendar = fridays(from, to);
  const weekly = ids.map((id) => {
    const closes = closesOn(series[id], calendar);
    return closes.slice(1).map((close, index) => {
      const previous = closes[index];
      return close !== null && previous !== null ? Math.log(close / previous) : null;
    });
  });
  const matrix: (number | null)[][] = ids.map(() => ids.map(() => null));
  const weeks: number[][] = ids.map(() => ids.map(() => 0));
  for (let i = 0; i < ids.length; i++) {
    for (let j = i; j < ids.length; j++) {
      const a: number[] = [];
      const b: number[] = [];
      weekly[i].forEach((value, week) => {
        const other = weekly[j][week];
        if (value !== null && other !== null) {
          a.push(value);
          b.push(other);
        }
      });
      weeks[i][j] = weeks[j][i] = a.length;
      const value = i === j ? 1 : a.length >= MIN_SHARED_WEEKS ? round4(correlation(a, b)) : null;
      matrix[i][j] = matrix[j][i] = value;
    }
  }
  return { ids, matrix, weeks };
}
