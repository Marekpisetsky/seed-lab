/**
 * Format of the market data files written by the daily price job
 * (scripts/update-prices.mts) and read by the app (lib/market-data.ts), with
 * the functions that validate them. Kept free of runtime imports other than
 * `./index-ids.ts`, so the job, which runs in plain Node, uses the very same
 * validation as the app.
 */

import { isIndexId, type IndexId } from "./index-ids.ts";
import type { PricePoint } from "./prices";

export interface Instrument {
  /** Ticker as users know it ("VUAA", "NVDA"); also the key in the data files. */
  id: string;
  name: string;
  kind: "etf" | "stock";
  /** ETF: the index it tracks. Stock: the closest index, used for projections. */
  index: IndexId;
  /** Yahoo Finance symbol ("VUAA.DE", "NVDA"). */
  symbol: string;
  /** Stooq symbol, the fallback source; `null` when Stooq has none. */
  stooq: string | null;
  /** Currency the listing trades in. */
  currency: string;
}

export interface InstrumentPrices {
  symbol: string;
  currency: string;
  source: "yahoo" | "stooq";
  /** Trading day of the latest close, `YYYY-MM-DD`. */
  date: string;
  close: number;
  /** Change over the last 12 months as a fraction; `null` with less history. */
  change1y: number | null;
  /** About one close a week over the last 12 months, oldest first (for the small line). */
  spark: number[];
  /** Price growth per year over the stored history (not a forecast); `null` under a year. */
  growth: { from: string; perYear: number } | null;
}

export interface PricesFile {
  version: 1;
  /** When the job last changed the prices (ISO timestamp); `null` before its first run. */
  updatedAt: string | null;
  prices: Record<string, InstrumentPrices>;
}

/** Compact daily series: day offsets between consecutive closes, from `start`. */
export interface HistoryFile {
  id: string;
  symbol: string;
  currency: string;
  start: string;
  /** Days since the previous point; the first entry is 0 (the `start` day). */
  days: number[];
  closes: number[];
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

type Json = Record<string, unknown>;
const isRecord = (value: unknown): value is Json => typeof value === "object" && value !== null && !Array.isArray(value);
const isPositive = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value) && value > 0;
const isFraction = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value) && value > -1;
const isDay = (value: unknown): value is string => typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);

function parseInstrument(value: unknown): Instrument | null {
  if (!isRecord(value)) return null;
  const { id, name, kind, index, symbol, stooq, currency } = value;
  if (typeof id !== "string" || !/^[A-Z0-9.-]{1,12}$/.test(id)) return null;
  if (typeof name !== "string" || name === "") return null;
  if (kind !== "etf" && kind !== "stock") return null;
  if (!isIndexId(index)) return null;
  if (typeof symbol !== "string" || symbol === "") return null;
  if (stooq !== null && typeof stooq !== "string") return null;
  if (typeof currency !== "string" || !/^[A-Z]{3}$/.test(currency)) return null;
  return { id, name, kind, index, symbol, stooq, currency };
}

/** The curated list; a bad entry fails loudly, since it is edited by hand. */
export function parseCatalogue(value: unknown): { instruments: Instrument[]; trackers: Record<IndexId, string[]> } {
  if (!isRecord(value) || !Array.isArray(value.instruments) || !isRecord(value.trackers)) {
    throw new Error("Invalid instruments.json: expected instruments and trackers");
  }
  const instruments = value.instruments.map((entry, index) => {
    const instrument = parseInstrument(entry);
    if (!instrument) throw new Error(`Invalid instruments.json: entry ${index} (${JSON.stringify(entry)})`);
    return instrument;
  });
  if (new Set(instruments.map((instrument) => instrument.id)).size !== instruments.length) {
    throw new Error("Invalid instruments.json: duplicate ids");
  }
  const trackers = value.trackers;
  const list = (id: IndexId) => (Array.isArray(trackers[id]) ? trackers[id].filter((t): t is string => typeof t === "string") : []);
  return { instruments, trackers: { sp500: list("sp500"), world: list("world"), nasdaq100: list("nasdaq100") } };
}

function parseInstrumentPrices(value: unknown): InstrumentPrices | null {
  if (!isRecord(value)) return null;
  const { symbol, currency, source, date, close, change1y, spark, growth } = value;
  if (typeof symbol !== "string" || typeof currency !== "string") return null;
  if (source !== "yahoo" && source !== "stooq") return null;
  if (!isDay(date) || !isPositive(close)) return null;
  const growthOk =
    isRecord(growth) && isDay(growth.from) && isFraction(growth.perYear)
      ? { from: growth.from, perYear: growth.perYear }
      : null;
  return {
    symbol,
    currency,
    source,
    date,
    close,
    change1y: isFraction(change1y) ? change1y : null,
    spark: Array.isArray(spark) ? spark.filter(isPositive) : [],
    growth: growthOk,
  };
}

/** Keeps every valid entry; anything unreadable is dropped. */
export function parsePricesFile(value: unknown): PricesFile {
  const prices: Record<string, InstrumentPrices> = {};
  if (isRecord(value) && isRecord(value.prices)) {
    for (const [id, entry] of Object.entries(value.prices)) {
      const parsed = parseInstrumentPrices(entry);
      if (parsed) prices[id] = parsed;
    }
  }
  const updatedAt = isRecord(value) && typeof value.updatedAt === "string" ? value.updatedAt : null;
  return { version: 1, updatedAt, prices };
}

/** Daily points from a history file; `null` if it is not one. */
export function decodeHistory(value: unknown): PricePoint[] | null {
  if (!isRecord(value) || !isDay(value.start) || !Array.isArray(value.days) || !Array.isArray(value.closes)) return null;
  const { days, closes } = value;
  if (days.length !== closes.length || days.length === 0) return null;
  const date = new Date(`${value.start}T00:00:00Z`);
  const points: PricePoint[] = [];
  for (let index = 0; index < days.length; index++) {
    const step = days[index];
    const close = closes[index];
    if (typeof step !== "number" || !Number.isInteger(step) || step < 0 || !isPositive(close)) return null;
    date.setUTCDate(date.getUTCDate() + step);
    points.push({ time: date.toISOString().slice(0, 10), close });
  }
  return points;
}
