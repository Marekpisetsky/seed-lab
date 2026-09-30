/**
 * Pure functions that turn downloaded series into the static files the app
 * reads (see src/lib/market-format.ts for the format), and decide whether a
 * download can replace what is already committed. Nothing here does I/O.
 */

import type { Correlations, Instrument, InstrumentPrices, PricesFile } from "../../src/lib/market-format.ts";
import type { PricePoint } from "./series.mts";

/** Years of daily closes the figures are worked out from. Only the figures are published, never the closes. */
export const HISTORY_YEARS = 10;
/** A download whose latest close is older than this is treated as stale. */
export const MAX_AGE_DAYS = 30;

const DAY_MS = 24 * 60 * 60 * 1000;
const dayNumber = (isoDay: string) => Date.parse(`${isoDay}T00:00:00Z`) / DAY_MS;
const round4 = (value: number) => Number(value.toFixed(4));

/** Yahoo sends floats such as 112.33999633789062; four decimals are plenty. */
export function roundClose(close: number): number {
  return round4(close);
}

/** The last `years` years of a series, counted back from its last point. */
export function lastYears(points: readonly PricePoint[], years: number): PricePoint[] {
  const last = points.at(-1);
  if (!last) return [];
  const from = new Date(`${last.time}T00:00:00Z`);
  from.setUTCFullYear(from.getUTCFullYear() - years);
  const start = from.toISOString().slice(0, 10);
  return points.filter((point) => point.time >= start);
}

/** Change from the last close at least a year before the latest one; `null` with less history. */
export function changeOverYear(points: readonly PricePoint[]): number | null {
  const last = points.at(-1);
  if (!last) return null;
  const yearAgo = dayNumber(last.time) - 365;
  const base = points.findLast((point) => dayNumber(point.time) <= yearAgo);
  return base ? round4(last.close / base.close - 1) : null;
}

/** Price growth per year from the first to the last point; `null` under a year of history. */
export function growthPerYear(points: readonly PricePoint[]): InstrumentPrices["growth"] {
  const first = points[0];
  const last = points.at(-1);
  if (!first || !last) return null;
  const years = (dayNumber(last.time) - dayNumber(first.time)) / 365.25;
  if (years < 1) return null;
  return { from: first.time, perYear: round4(Math.pow(last.close / first.close, 1 / years) - 1) };
}

/** Worst fall from a previous peak, as a fraction (0.57 = −57 %); `null` without data. */
export function maxDrawdown(points: readonly PricePoint[]): InstrumentPrices["drawdown"] {
  const first = points[0];
  if (!first) return null;
  let peak = first.close;
  let worst = 0;
  for (const { close } of points) {
    if (close > peak) peak = close;
    worst = Math.max(worst, 1 - close / peak);
  }
  return { from: first.time, max: round4(worst) };
}

export function summarize(
  instrument: Instrument,
  points: readonly PricePoint[],
  source: InstrumentPrices["source"],
): InstrumentPrices {
  const last = points.at(-1);
  if (!last) throw new RangeError("cannot summarize an empty series");
  return {
    symbol: instrument.symbol,
    currency: instrument.currency,
    source,
    date: last.time,
    close: roundClose(last.close),
    change1y: changeOverYear(points),
    growth: growthPerYear(points),
    drawdown: maxDrawdown(points),
  };
}

export type SeriesCheck = { ok: true } | { ok: false; reason: string };

/**
 * Whether a downloaded series may replace the committed one. Anything odd
 * keeps the previous data: too few points, another currency, a latest close
 * that is stale or older than what we have, or an implausible jump.
 */
export function checkSeries(
  instrument: Instrument,
  points: readonly PricePoint[],
  currency: string | null,
  previous: InstrumentPrices | undefined,
  today: Date,
): SeriesCheck {
  const last = points.at(-1);
  if (!last || points.length < 20) return { ok: false, reason: `only ${points.length} prices` };
  if (currency !== instrument.currency) {
    return { ok: false, reason: `quoted in ${currency ?? "an unknown currency"}, expected ${instrument.currency}` };
  }
  const ageDays = Math.floor(today.getTime() / DAY_MS) - dayNumber(last.time);
  if (ageDays > MAX_AGE_DAYS) return { ok: false, reason: `latest close is from ${last.time}` };
  if (previous) {
    if (last.time < previous.date) return { ok: false, reason: `latest close ${last.time} is older than ${previous.date}` };
    const ratio = last.close / previous.close;
    if (ratio < 0.2 || ratio > 5) {
      return { ok: false, reason: `latest close jumps from ${previous.close} to ${roundClose(last.close)}` };
    }
  }
  return { ok: true };
}

/**
 * The same value with every object's keys in alphabetical order. An entry
 * read back from yesterday's file and one just built from a download then
 * write the very same text, so the file only changes when a number does.
 */
export function canonical<T>(value: T): T {
  if (Array.isArray(value)) return value.map(canonical) as T;
  if (value === null || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.keys(value)
      .sort()
      .map((key) => [key, canonical((value as Record<string, unknown>)[key])]),
  ) as T;
}

/**
 * The next prices file: fresh entries where a download succeeded, the
 * previous entry where it failed, in catalogue order (instruments removed
 * from the catalogue are dropped), and the correlations between them.
 * `updatedAt` only moves when something changes, so an unchanged day
 * produces an identical file and no commit.
 */
export function nextPricesFile(
  instruments: readonly Instrument[],
  previous: PricesFile,
  fresh: Readonly<Record<string, InstrumentPrices>>,
  now: Date,
  correlations: Correlations | null = previous.correlations ?? null,
): { file: PricesFile; changed: boolean } {
  const prices: Record<string, InstrumentPrices> = {};
  for (const { id } of instruments) {
    const entry = fresh[id] ?? previous.prices[id];
    if (entry) prices[id] = canonical(entry);
  }
  const before = Object.fromEntries(Object.entries(previous.prices).map(([id, entry]) => [id, canonical(entry)]));
  const changed =
    JSON.stringify(prices) !== JSON.stringify(before) ||
    JSON.stringify(canonical(correlations)) !== JSON.stringify(canonical(previous.correlations ?? null));
  return {
    file: { version: 1, updatedAt: changed ? now.toISOString() : previous.updatedAt, prices, ...(correlations ? { correlations } : {}) },
    changed,
  };
}

/** One instrument per line (and one correlation row per line), so each day's git diff shows exactly what moved. */
export function formatPricesFile(file: PricesFile): string {
  const entries = Object.entries(file.prices).map(([id, entry]) => `${JSON.stringify(id)}: ${JSON.stringify(canonical(entry))}`);
  const prices = entries.length === 0 ? "{}" : `{\n${entries.join(",\n")}\n}`;
  const { correlations } = file;
  const rows = (table: readonly unknown[][]) => `[\n${table.map((row) => JSON.stringify(row)).join(",\n")}\n]`;
  const tail = correlations
    ? `,\n"correlations": {\n"ids": ${JSON.stringify(correlations.ids)},\n"matrix": ${rows(correlations.matrix)},\n"weeks": ${rows(correlations.weeks)}\n}`
    : "";
  return `{\n"version": 1,\n"updatedAt": ${JSON.stringify(file.updatedAt)},\n"prices": ${prices}${tail}\n}\n`;
}
