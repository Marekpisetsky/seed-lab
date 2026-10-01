/**
 * Format of the market data files written by the daily price job
 * (scripts/update-prices.mts) and read by the app (lib/market-data.ts), with
 * the functions that validate them. Kept free of runtime imports other than
 * `./index-ids.ts`, so the job, which runs in plain Node, uses the very same
 * validation as the app.
 */

import { isIndexId, SERIES_IDS, type IndexId, type SeriesId } from "./index-ids.ts";

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
  /** Price growth per year over the stored history (not a forecast); `null` under a year. */
  growth: { from: string; perYear: number } | null;
  /** Worst fall from a previous peak over the stored history (0.57 = −57 %); absent in older files. */
  drawdown?: { from: string; max: number } | null;
  /** How it moves, from the stored daily closes (scripts/lib/stats.mts); absent in older files. */
  stats?: InstrumentStats | null;
  /** The last year's weekly line, 100 at its start (never a price), for the small picture in a list row; absent in older files. */
  line1y?: number[] | null;
}

export interface InstrumentStats {
  /** First and last daily close the figures come from. */
  from: string;
  to: string;
  /** Yearly volatility: standard deviation of daily log returns × √(returns a year). */
  volatility: number;
  /** Price change of each full calendar year covered, by year ("2022": −0.51). */
  years: Record<string, number>;
}

/** Correlations of weekly log returns between the instruments (scripts/lib/stats.mts). */
export interface Correlations {
  ids: string[];
  /** Symmetric, 1 on the diagonal; `null` where two series share under three years of weeks. */
  matrix: (number | null)[][];
  /** Weeks each pair shares, same layout. */
  weeks: number[][];
}

/** The periods a line chart can show, shortest first. */
export const LINE_PERIODS = ["1y", "3y", "5y", "max"] as const;
export type LinePeriodId = (typeof LINE_PERIODS)[number];

/**
 * One period of an instrument's line (public/data/lines/<id>.json): the
 * close of each week (on or before its Friday) as a share of the first
 * one, times 100, to a tenth: 100 at the start, 135.2 when it is up 35.2 %.
 * Never a price. Points are a week apart from `from`; the last one is the
 * latest close, `to`, which can come less than a week after the one before.
 */
export interface LinePeriod {
  from: string;
  to: string;
  line: number[];
  /** Its index fund's line over the very same weeks, 100 at the same start; absent when the fund's prices start later. */
  index?: number[];
}

/** The lines of one instrument, written by the price job and read when its row is opened. */
export interface LinesFile {
  version: 1;
  id: string;
  /** The index fund a stock is compared with (its index's ETF on the list); absent for a fund. */
  benchmark?: string;
  /** Only the periods its history covers. */
  periods: Partial<Record<LinePeriodId, LinePeriod>>;
}

export interface PricesFile {
  version: 1;
  /** When the job last changed the prices (ISO timestamp); `null` before its first run. */
  updatedAt: string | null;
  prices: Record<string, InstrumentPrices>;
  /** Absent in older files. */
  correlations?: Correlations | null;
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

/**
 * The curated list, and the tickers of well-known funds that hold each asset
 * with a history (index ETFs, bond ETFs, gold ETCs). A bad entry fails
 * loudly, since it is edited by hand.
 */
export function parseCatalogue(value: unknown): { instruments: Instrument[]; trackers: Record<SeriesId, string[]> } {
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
  const list = (id: SeriesId) => (Array.isArray(trackers[id]) ? trackers[id].filter((t): t is string => typeof t === "string") : []);
  return { instruments, trackers: Object.fromEntries(SERIES_IDS.map((id) => [id, list(id)])) as Record<SeriesId, string[]> };
}

function parseStats(value: unknown): InstrumentStats | null {
  if (!isRecord(value) || !isDay(value.from) || !isDay(value.to) || !isPositive(value.volatility) || !isRecord(value.years)) return null;
  const years: Record<string, number> = {};
  for (const [year, change] of Object.entries(value.years)) {
    if (/^\d{4}$/.test(year) && isFraction(change)) years[year] = change;
  }
  return { from: value.from, to: value.to, volatility: value.volatility, years };
}

function parseCorrelations(value: unknown): Correlations | null {
  if (!isRecord(value) || !Array.isArray(value.ids) || !Array.isArray(value.matrix) || !Array.isArray(value.weeks)) return null;
  const ids = value.ids.filter((id): id is string => typeof id === "string");
  const n = ids.length;
  if (n !== value.ids.length || value.matrix.length !== n || value.weeks.length !== n) return null;
  const square = (rows: unknown[], ok: (cell: unknown) => boolean) =>
    rows.every((row) => Array.isArray(row) && row.length === n && row.every(ok));
  const isCorrelation = (cell: unknown) => cell === null || (typeof cell === "number" && cell >= -1 && cell <= 1);
  const isCount = (cell: unknown) => Number.isInteger(cell) && (cell as number) >= 0;
  if (!square(value.matrix, isCorrelation) || !square(value.weeks, isCount)) return null;
  return { ids, matrix: value.matrix as (number | null)[][], weeks: value.weeks as number[][] };
}

function parseInstrumentPrices(value: unknown): InstrumentPrices | null {
  if (!isRecord(value)) return null;
  // Older files also carry a 12-month line of closes ("spark"): no longer published or read.
  const { symbol, currency, source, date, close, change1y, growth, drawdown, stats, line1y } = value;
  if (typeof symbol !== "string" || typeof currency !== "string") return null;
  if (source !== "yahoo" && source !== "stooq") return null;
  if (!isDay(date) || !isPositive(close)) return null;
  const growthOk =
    isRecord(growth) && isDay(growth.from) && isFraction(growth.perYear)
      ? { from: growth.from, perYear: growth.perYear }
      : null;
  const drawdownOk =
    isRecord(drawdown) && isDay(drawdown.from) && typeof drawdown.max === "number" && drawdown.max >= 0 && drawdown.max < 1
      ? { from: drawdown.from, max: drawdown.max }
      : null;
  return {
    symbol,
    currency,
    source,
    date,
    close,
    change1y: isFraction(change1y) ? change1y : null,
    growth: growthOk,
    drawdown: drawdownOk,
    ...(stats !== undefined ? { stats: parseStats(stats) } : {}),
    ...(line1y !== undefined ? { line1y: isLine(line1y) ? line1y : null } : {}),
  };
}

/** Values of a line: at least two, every one above 0 (100 is the start). */
function isLine(value: unknown): value is number[] {
  return Array.isArray(value) && value.length >= 2 && value.every(isPositive);
}

const DAY_MS = 24 * 60 * 60 * 1000;

function parseLinePeriod(value: unknown): LinePeriod | null {
  if (!isRecord(value) || !isDay(value.from) || !isDay(value.to) || !isLine(value.line)) return null;
  const { from, to, line, index } = value;
  // A week apart from `from`, the last point up to a week after the one before it.
  const lastWeek = Date.parse(from) + (line.length - 2) * 7 * DAY_MS;
  const gap = (Date.parse(to) - lastWeek) / DAY_MS;
  if (!(gap > 0 && gap <= 7)) return null;
  const indexOk = isLine(index) && index.length === line.length;
  return { from, to, line, ...(indexOk ? { index } : {}) };
}

/** A lines file, or `null` when it is not one; a bad period is dropped on its own. */
export function parseLinesFile(value: unknown): LinesFile | null {
  if (!isRecord(value) || value.version !== 1 || typeof value.id !== "string" || !isRecord(value.periods)) return null;
  const periods: LinesFile["periods"] = {};
  for (const id of LINE_PERIODS) {
    const period = parseLinePeriod(value.periods[id]);
    if (period) periods[id] = period;
  }
  const benchmark = typeof value.benchmark === "string" ? value.benchmark : undefined;
  return { version: 1, id: value.id, ...(benchmark ? { benchmark } : {}), periods };
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
  const correlations = isRecord(value) ? parseCorrelations(value.correlations) : null;
  return { version: 1, updatedAt, prices, ...(correlations ? { correlations } : {}) };
}
