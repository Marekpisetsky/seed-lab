/**
 * Daily price series: parsing CSV files (from Stooq or uploaded by the user)
 * and interpreting what Stooq sends back.
 *
 * Stooq (https://stooq.com) is an unofficial, free third-party source with no
 * API key and no guarantees: fine for a personal tool, not for a product that
 * is sold. It can rate-limit, ask for verification, return "No data" or change
 * format at any time, so every answer is classified instead of trusted.
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
 * Reads a daily price CSV with a date column and a close column, e.g. Stooq's
 * `Date,Open,High,Low,Close,Volume` or a spreadsheet export with `Date,Close`.
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
// Stooq
// ---------------------------------------------------------------------------

export type PriceErrorCode =
  | "INVALID_SYMBOL"
  | "NOT_FOUND"
  | "RATE_LIMITED"
  | "VERIFICATION_REQUIRED"
  | "UNEXPECTED_FORMAT"
  | "UPSTREAM_ERROR"
  | "TIMEOUT";

export interface PriceError {
  code: PriceErrorCode;
  message: string;
}

export type StooqResult = { ok: true; points: PricePoint[] } | { ok: false; error: PriceError };

const SYMBOL_PATTERN = /^[a-z0-9^][a-z0-9.^_-]{0,19}$/;

export function isValidStooqSymbol(symbol: string): boolean {
  return SYMBOL_PATTERN.test(symbol);
}

const SUFFIX_CURRENCIES: Record<string, string> = {
  us: "USD",
  de: "EUR",
  f: "EUR",
  uk: "GBX", // London prices are quoted in pence
  jp: "JPY",
  hk: "HKD",
  pl: "PLN",
  hu: "HUF",
};

/** Currency Stooq quotes a symbol in, when the market suffix tells us; else `null`. */
export function stooqQuoteCurrency(symbol: string): string | null {
  const suffix = /\.([a-z]+)$/.exec(symbol)?.[1];
  return suffix ? (SUFFIX_CURRENCIES[suffix] ?? null) : null;
}

export function stooqUrl(symbol: string): string {
  const params = new URLSearchParams({ s: symbol, i: "d" });
  return `https://stooq.com/q/d/l/?${params}`;
}

/** Turns Stooq's raw answer into a price series or a specific, explainable error. */
export function interpretStooqResponse(status: number, body: string): StooqResult {
  const text = body.trim();
  if (status < 200 || status >= 300) {
    return { ok: false, error: { code: "UPSTREAM_ERROR", message: `Stooq answered with HTTP ${status}.` } };
  }
  if (text === "" || /^no data/i.test(text)) {
    return {
      ok: false,
      error: { code: "NOT_FOUND", message: "Stooq has no data for this symbol. Check the symbol or upload a CSV." },
    };
  }
  if (/exceeded the daily hits limit/i.test(text)) {
    return {
      ok: false,
      error: { code: "RATE_LIMITED", message: "Stooq's daily request limit was reached. Try again tomorrow or upload a CSV." },
    };
  }
  if (text.startsWith("<") || /captcha|api ?key|verif/i.test(text.slice(0, 500))) {
    return {
      ok: false,
      error: {
        code: "VERIFICATION_REQUIRED",
        message: "Stooq asked for a verification step instead of sending data. Upload a CSV instead.",
      },
    };
  }
  const parsed = parsePriceCsv(text);
  if (!parsed.ok) {
    return {
      ok: false,
      error: { code: "UNEXPECTED_FORMAT", message: `Stooq's answer was not in the expected format. ${parsed.error}` },
    };
  }
  return { ok: true, points: parsed.points };
}

// ---------------------------------------------------------------------------
// Shape of /api/prices responses, shared by the route handler and the client
// ---------------------------------------------------------------------------

export interface PriceSeriesResponse {
  symbol: string;
  source: "stooq";
  /** When the server fetched the data from Stooq (ISO timestamp). */
  fetchedAt: string;
  points: PricePoint[];
}

export interface PriceErrorResponse {
  error: PriceError;
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
