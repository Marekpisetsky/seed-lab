/**
 * The assets a plan can be projected with that have a long history, each
 * backed by a static dataset of annual real (after inflation) returns in
 * src/data/:
 *
 * - US stocks: the S&P Composite, total return, 1928 onwards (Robert
 *   Shiller, Yale).
 * - German government bonds: a 10-year Bund, total return in euros after
 *   German inflation, 1988 onwards (OECD / Bundesbank yields, Destatis).
 * - Gold: in USD after US inflation, 1988 onwards (World Bank Pink Sheet,
 *   December averages).
 *
 * All five are compared over the same years: the longest period every
 * dataset covers (COMMON_PERIOD). Those years feed the expected return
 * (their average), the Monte Carlo simulation, the mixes and every lever,
 * so an asset never looks better just because its data starts in a better
 * decade. The whole datasets stay available as `dataset`.
 *
 * Datasets are validated when the module loads, so a bad edit fails loudly
 * instead of rendering NaN.
 */

import euroBonds from "@/data/euro-bonds-real-returns.json";
import gold from "@/data/gold-real-returns.json";
import sp500 from "@/data/sp500-real-returns.json";
import { INDEX_IDS, SERIES_IDS, type IndexId, type SeriesId } from "./index-ids";

export { INDEX_IDS, isIndexId, isSeriesId, SERIES_IDS, type IndexId, type SeriesId } from "./index-ids";

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
  id: SeriesId;
  /** Short name for the UI: "S&P 500". */
  name: string;
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
  [{ id: "sp500", name: "US stocks", returnType: "S&P Composite, dividends reinvested", priceOnly: false, sourceName: "Robert Shiller, Yale" }, sp500],
  [
    {
      id: "bonds",
      name: "German government bonds",
      returnType: "10-year German Bund, interest reinvested",
      priceOnly: false,
      sourceName: "OECD, Bundesbank and Destatis",
    },
    euroBonds,
  ],
  [{ id: "gold", name: "Gold", returnType: "price in US dollars", priceOnly: false, sourceName: "World Bank" }, gold],
];

/** The longest run of years every dataset covers. */
export function commonPeriod(all: readonly (readonly AnnualReturn[])[]): [number, number] {
  const first = Math.max(...all.map((years) => years[0].year));
  const last = Math.min(...all.map((years) => years[years.length - 1].year));
  if (last - first + 1 < 20) throw new Error(`The datasets share only ${first}–${last}: fewer than 20 years`);
  return [first, last];
}

const parsed = DATASETS.map(([info, data]) => [info, parseReturns(info.name, data)] as const);

/** The years every asset is compared over, e.g. [1988, 2022]. */
export const COMMON_PERIOD: readonly [number, number] = commonPeriod(parsed.map(([, years]) => years));

/** Every asset with a history: US stocks, German government bonds and gold. */
export const SERIES = Object.fromEntries(
  parsed.map(([info, years]) => [
    info.id,
    {
      ...info,
      ...series(years.filter(({ year }) => year >= COMMON_PERIOD[0] && year <= COMMON_PERIOD[1])),
      dataset: series(years),
    },
  ]),
) as Readonly<Record<SeriesId, IndexInfo>>;

if (SERIES_IDS.some((id) => !SERIES[id])) throw new Error("A series has no dataset");

/** The stock index. */
export const INDEXES = Object.fromEntries(INDEX_IDS.map((id) => [id, SERIES[id]])) as Readonly<Record<IndexId, IndexInfo>>;
