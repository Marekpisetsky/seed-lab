/**
 * The three indexes a plan can grow with, each backed by a static dataset of
 * historical annual real (after inflation) returns in src/data/:
 *
 * - S&P 500: total return, 1928 onwards (Robert Shiller, Yale).
 * - MSCI World: net total return in USD, 1988 onwards (MSCI factsheets).
 * - Nasdaq-100: price return in USD, 1986 onwards (Nasdaq year-end closes).
 *
 * The three are compared over the same years: the longest period every
 * dataset covers (COMMON_PERIOD). Those years feed the expected return
 * (their average), the Monte Carlo simulation, the portfolio mix and every
 * lever, so an index never looks better just because its data starts in a
 * better decade. The whole datasets stay available as `dataset`.
 *
 * Datasets are validated when the module loads, so a bad edit fails loudly
 * instead of rendering NaN.
 */

import msciWorld from "@/data/msci-world-real-returns.json";
import nasdaq100 from "@/data/nasdaq100-real-returns.json";
import sp500 from "@/data/sp500-real-returns.json";
import type { IndexId } from "./index-ids";

export { INDEX_IDS, isIndexId, type IndexId } from "./index-ids";

export interface AnnualReturn {
  year: number;
  /** Decimal fraction after inflation: 0.07 = 7 %. */
  realReturn: number;
}

export interface ReturnSeries {
  years: readonly AnnualReturn[];
  firstYear: number;
  lastYear: number;
  /** Geometric average real return per year. */
  averageReturn: number;
}

export interface IndexInfo extends ReturnSeries {
  id: IndexId;
  /** Short name for the UI: "S&P 500". */
  name: string;
  /** The well-known European ETF that tracks it, as shown in the UI. */
  etf: string;
  /** What the returns include, in plain words. */
  returnType: string;
  /** True when dividends are not in the figures (they understate the index). */
  priceOnly: boolean;
  /** Who publishes the underlying figures. */
  sourceName: string;
  /** The whole dataset; `years`, `firstYear`, `lastYear` and `averageReturn` are the common period's. */
  dataset: ReturnSeries;
}

interface Dataset {
  source: string;
  years: { year: number; realReturn: number }[];
}

function fail(name: string, message: string): never {
  throw new Error(`Invalid ${name} returns dataset: ${message}`);
}

/** One entry per consecutive year, every return a finite number above −100 %. */
export function parseReturns(name: string, data: Dataset): AnnualReturn[] {
  if (typeof data.source !== "string" || data.source === "") fail(name, "missing source");
  if (!Array.isArray(data.years) || data.years.length < 20) fail(name, "fewer than 20 years");
  return data.years.map(({ year, realReturn }, index) => {
    if (!Number.isInteger(year)) fail(name, `entry ${index} has no year`);
    if (index > 0 && year !== data.years[index - 1].year + 1) fail(name, `${year} does not follow the previous year`);
    if (typeof realReturn !== "number" || !Number.isFinite(realReturn) || realReturn <= -1) {
      fail(name, `${year}: invalid return`);
    }
    return { year, realReturn };
  });
}

/** Geometric average: the constant yearly return that compounds to the same result. */
export function annualizedReturn(returns: readonly number[]): number {
  if (returns.length === 0) throw new RangeError("returns must not be empty");
  const logSum = returns.reduce((sum, value) => sum + Math.log1p(value), 0);
  return Math.expm1(logSum / returns.length);
}

function series(years: readonly AnnualReturn[]): ReturnSeries {
  return {
    years,
    firstYear: years[0].year,
    lastYear: years[years.length - 1].year,
    averageReturn: annualizedReturn(years.map((entry) => entry.realReturn)),
  };
}

type IndexDescription = Omit<IndexInfo, keyof ReturnSeries | "dataset">;

const DATASETS: readonly [IndexDescription, Dataset][] = [
  [
    { id: "sp500", name: "S&P 500", etf: "VUAA", returnType: "dividends reinvested", priceOnly: false, sourceName: "Robert Shiller, Yale" },
    sp500,
  ],
  [
    { id: "world", name: "World", etf: "VWCE", returnType: "MSCI World, dividends reinvested", priceOnly: false, sourceName: "MSCI" },
    msciWorld,
  ],
  [
    { id: "nasdaq100", name: "Nasdaq-100", etf: "EQQQ", returnType: "price only, without dividends", priceOnly: true, sourceName: "Nasdaq" },
    nasdaq100,
  ],
];

/** The longest run of years every dataset covers. */
export function commonPeriod(all: readonly (readonly AnnualReturn[])[]): [number, number] {
  const first = Math.max(...all.map((years) => years[0].year));
  const last = Math.min(...all.map((years) => years[years.length - 1].year));
  if (last - first + 1 < 20) throw new Error(`The datasets share only ${first}–${last}: fewer than 20 years`);
  return [first, last];
}

const parsed = DATASETS.map(([info, data]) => [info, parseReturns(info.name, data)] as const);

/** The years every index is compared over, e.g. [1988, 2022]. */
export const COMMON_PERIOD: readonly [number, number] = commonPeriod(parsed.map(([, years]) => years));

export const INDEXES = Object.fromEntries(
  parsed.map(([info, years]) => [
    info.id,
    {
      ...info,
      ...series(years.filter(({ year }) => year >= COMMON_PERIOD[0] && year <= COMMON_PERIOD[1])),
      dataset: series(years),
    },
  ]),
) as Readonly<Record<IndexId, IndexInfo>>;

/**
 * US consumer prices, December to December, by year (from the Nasdaq-100
 * dataset, which records the inflation it deflates by): used to put a
 * stock's calendar-year price changes in the same after-inflation terms.
 */
export const US_INFLATION: ReadonlyMap<number, number> = new Map(
  (nasdaq100.years as { year: number; inflation?: number }[])
    .filter((entry): entry is { year: number; inflation: number } => typeof entry.inflation === "number")
    .map((entry) => [entry.year, entry.inflation]),
);
