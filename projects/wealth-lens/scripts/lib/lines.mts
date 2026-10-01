/**
 * The lines My stocks draws, worked out from the daily closes the job
 * downloads (public/data/lines/<id>.json, format in src/lib/market-format.ts).
 * Only a derived figure is published, never a price: one point a week (the
 * last close on or before each Friday, plus the latest close), each as a
 * share of the period's first point, times 100 and rounded to a tenth. Each
 * period (1, 3 and 5 years, and all the history the job keeps) starts again
 * at 100, and a stock's index fund is worked out over the very same weeks,
 * from 100 too, so the two lines can be compared. Nothing here does I/O.
 */

import type { Instrument, LinePeriod, LinePeriodId, LinesFile } from "../../src/lib/market-format.ts";
import type { PricePoint } from "./series.mts";
import { closesOn } from "./stats.mts";

const DAY_MS = 24 * 60 * 60 * 1000;
const addDays = (isoDay: string, days: number) => new Date(Date.parse(`${isoDay}T00:00:00Z`) + days * DAY_MS).toISOString().slice(0, 10);

/** Years back each period starts, counted from the latest close; `null`: all the history there is. */
export const PERIOD_YEARS: Readonly<Record<LinePeriodId, number | null>> = { "1y": 1, "3y": 3, "5y": 5, max: null };

/**
 * One close a week: the last close on or before each Friday from the first
 * Friday of the series, then the latest close when it came after the last
 * Friday (the week so far).
 */
export function weeklyPoints(points: readonly PricePoint[]): PricePoint[] {
  const first = points[0];
  const last = points.at(-1);
  if (!first || !last) return [];
  const start = new Date(`${first.time}T00:00:00Z`);
  start.setUTCDate(start.getUTCDate() + ((5 - start.getUTCDay() + 7) % 7));
  const fridays: string[] = [];
  for (let day = start.toISOString().slice(0, 10); day <= last.time; day = addDays(day, 7)) fridays.push(day);
  const closes = closesOn(points, fridays);
  const weekly = fridays.map((time, index) => ({ time, close: closes[index] as number }));
  if (fridays.at(-1) !== last.time) weekly.push({ time: last.time, close: last.close });
  return weekly;
}

/** A value relative to the first, times 100, to a tenth: 135.2 means up 35.2 %. */
const relative = (close: number, base: number) => Math.round((close / base) * 1000) / 10;

/** Where a period starts: the last weekly point on or before that many years back; `null` when the history is shorter. */
export function periodStart(weekly: readonly PricePoint[], years: number | null): number | null {
  if (weekly.length < 2) return null;
  if (years === null) return 0;
  const target = new Date(`${weekly[weekly.length - 1].time}T00:00:00Z`);
  target.setUTCFullYear(target.getUTCFullYear() - years);
  const day = target.toISOString().slice(0, 10);
  if (weekly[0].time > day) return null;
  return weekly.findLastIndex((point) => point.time <= day);
}

/**
 * The periods an instrument's weekly points cover, each from 100, with its
 * index fund's line over the same weeks when the fund has prices from the
 * period's first week on.
 */
export function linePeriods(points: readonly PricePoint[], benchmark: readonly PricePoint[] | null = null): LinesFile["periods"] {
  const weekly = weeklyPoints(points);
  const periods: LinesFile["periods"] = {};
  for (const [id, years] of Object.entries(PERIOD_YEARS) as [LinePeriodId, number | null][]) {
    const start = periodStart(weekly, years);
    if (start === null || weekly.length - start < 2) continue;
    const span = weekly.slice(start);
    const period: LinePeriod = {
      from: span[0].time,
      to: span[span.length - 1].time,
      line: span.map((point) => relative(point.close, span[0].close)),
    };
    const fund = benchmark ? closesOn(benchmark, span.map((point) => point.time)) : null;
    if (fund && fund.every((close) => close !== null)) period.index = fund.map((close) => relative(close as number, fund[0] as number));
    periods[id] = period;
  }
  return periods;
}

/** The fund on the list a stock is compared with: the first ETF of its index. Funds are not compared with anything. */
export function benchmarkFor(instrument: Instrument, instruments: readonly Instrument[]): Instrument | null {
  if (instrument.kind !== "stock") return null;
  return instruments.find((other) => other.kind === "etf" && other.index === instrument.index) ?? null;
}

export function linesFile(instrument: Instrument, points: readonly PricePoint[], benchmark: { id: string; points: readonly PricePoint[] } | null): LinesFile {
  return {
    version: 1,
    id: instrument.id,
    ...(benchmark ? { benchmark: benchmark.id } : {}),
    periods: linePeriods(points, benchmark?.points ?? null),
  };
}

/** The last year's line alone, for the small picture beside the name; `null` under a year of history. */
export function recentLine(points: readonly PricePoint[]): number[] | null {
  return linePeriods(points)["1y"]?.line ?? null;
}

/** One period per line, keys in a fixed order, so a day's diff shows what moved. */
export function formatLinesFile(file: LinesFile): string {
  const periods = (Object.keys(PERIOD_YEARS) as LinePeriodId[])
    .filter((id) => file.periods[id])
    .map((id) => {
      const { from, to, line, index } = file.periods[id] as LinePeriod;
      return `${JSON.stringify(id)}: ${JSON.stringify({ from, to, line, ...(index ? { index } : {}) })}`;
    });
  const head = [`"version": 1`, `"id": ${JSON.stringify(file.id)}`, ...(file.benchmark ? [`"benchmark": ${JSON.stringify(file.benchmark)}`] : [])];
  return `{\n${head.join(",\n")},\n"periods": {${periods.length ? `\n${periods.join(",\n")}\n` : ""}}\n}\n`;
}
