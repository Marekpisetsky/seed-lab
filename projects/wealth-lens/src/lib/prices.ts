/**
 * Daily price series: reading a price CSV the user uploads for a ticker that
 * has no downloaded prices, and small helpers for the price chart.
 */

import { findColumn, parseCsv, parseLooseNumber } from "./csv";

export interface PricePoint {
  /** Trading day, `YYYY-MM-DD`. */
  time: string;
  /** Closing price in the instrument's trading currency. */
  close: number;
}

export type PriceParseResult =
  | { ok: true; points: PricePoint[]; skippedRows: number }
  | { ok: false; error: string };

/** Accepts 2024-01-31, 2024/01/31 and 20240131, optionally followed by a time. */
function normalizeDate(raw: string): string | null {
  const match = /^(\d{4})[-/]?(\d{2})[-/]?(\d{2})(?:$|[ T])/.exec(raw.trim());
  if (!match) return null;
  const [, year, month, day] = match;
  const iso = `${year}-${month}-${day}`;
  const date = new Date(`${iso}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(iso) ? iso : null;
}

/**
 * Reads a daily price CSV with a date column and a close column, e.g. a
 * broker's or Stooq's `Date,Open,High,Low,Close,Volume` or a spreadsheet
 * export with `Date,Close`.
 * Rows that cannot be read are skipped and counted; the result is sorted by
 * date with one point per day.
 */
export function parsePriceCsv(text: string): PriceParseResult {
  const table = parseCsv(text);
  const dateColumn = findColumn(table.header, "date", "time", "datetime", "day");
  const closeColumn = findColumn(table.header, "close", "adjclose", "closeprice", "price", "last");
  if (dateColumn === -1 || closeColumn === -1) {
    return { ok: false, error: "Expected a header with a date column and a close (or price) column." };
  }

  const byDate = new Map<string, number>();
  let skippedRows = 0;
  for (const { fields } of table.records) {
    const time = normalizeDate(fields[dateColumn] ?? "");
    const close = parseLooseNumber(fields[closeColumn]);
    if (time === null || close === null || close <= 0) {
      skippedRows += 1;
      continue;
    }
    byDate.set(time, close);
  }

  if (byDate.size === 0) return { ok: false, error: "No rows with a valid date and a positive close price." };
  const points = [...byDate]
    .map(([time, close]) => ({ time, close }))
    .sort((a, b) => (a.time < b.time ? -1 : a.time > b.time ? 1 : 0));
  return { ok: true, points, skippedRows };
}

// ---------------------------------------------------------------------------
// Helpers for the chart
// ---------------------------------------------------------------------------

export interface SeriesSummary {
  last: PricePoint;
  /** (last close − average cost) ÷ average cost; `null` without a cost. */
  vsAverageCost: number | null;
}

/** Latest close and how it compares with the user's average cost. */
export function summarizeSeries(points: readonly PricePoint[], averageCost: number | null): SeriesSummary | null {
  const last = points.at(-1);
  if (!last) return null;
  const vsAverageCost = averageCost !== null && averageCost > 0 ? (last.close - averageCost) / averageCost : null;
  return { last, vsAverageCost };
}

/**
 * First day of the default visible window: `years` before the last point,
 * or the first point when the series is shorter. The chart can still be
 * panned and zoomed to the full history.
 */
export function visibleRangeStart(points: readonly PricePoint[], years: number): string | null {
  const first = points[0];
  const last = points.at(-1);
  if (!first || !last) return null;
  const date = new Date(`${last.time}T00:00:00Z`);
  date.setUTCFullYear(date.getUTCFullYear() - years);
  const start = date.toISOString().slice(0, 10);
  return start > first.time ? start : first.time;
}

/**
 * Widens a chart's automatic price range so a reference price (the average
 * cost line) is always inside it, however far the market has moved.
 */
export function includePriceInRange(
  range: { minValue: number; maxValue: number } | null,
  price: number | null,
): { minValue: number; maxValue: number } | null {
  if (range === null || price === null || !Number.isFinite(price)) return range;
  return { minValue: Math.min(range.minValue, price), maxValue: Math.max(range.maxValue, price) };
}
