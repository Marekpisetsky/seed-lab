/**
 * The three indexes a plan can grow with, each backed by a static dataset of
 * historical annual real (after inflation) returns in src/data/:
 *
 * - S&P 500: total return, 1928 onwards (Robert Shiller, Yale).
 * - MSCI World: net total return in USD, 1988 onwards (MSCI factsheets).
 * - Nasdaq-100: price return in USD, 1986 onwards (Nasdaq year-end closes).
 *
 * The same numbers feed the expected return (their long-run average) and the
 * Monte Carlo simulation of the chosen index. Datasets are validated when the
 * module loads, so a bad edit fails loudly instead of rendering NaN.
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

export interface IndexInfo {
  id: IndexId;
  /** Short name for the UI: "S&P 500". */
  name: string;
  /** The well-known European ETF that tracks it, as shown in the UI. */
  etf: string;
  /** What the returns include, in plain words. */
  returnType: string;
  /** Who publishes the underlying figures. */
  sourceName: string;
  years: readonly AnnualReturn[];
  firstYear: number;
  lastYear: number;
  /** Geometric average real return per year over the whole dataset. */
  averageReturn: number;
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

function buildIndex(
  info: Omit<IndexInfo, "years" | "firstYear" | "lastYear" | "averageReturn">,
  data: Dataset,
): IndexInfo {
  const years = parseReturns(info.name, data);
  return {
    ...info,
    years,
    firstYear: years[0].year,
    lastYear: years[years.length - 1].year,
    averageReturn: annualizedReturn(years.map((entry) => entry.realReturn)),
  };
}

export const INDEXES: Readonly<Record<IndexId, IndexInfo>> = {
  sp500: buildIndex(
    { id: "sp500", name: "S&P 500", etf: "VUAA", returnType: "dividends reinvested", sourceName: "Robert Shiller, Yale" },
    sp500,
  ),
  world: buildIndex(
    { id: "world", name: "World", etf: "VWCE", returnType: "MSCI World, dividends reinvested", sourceName: "MSCI" },
    msciWorld,
  ),
  nasdaq100: buildIndex(
    { id: "nasdaq100", name: "Nasdaq-100", etf: "EQQQ", returnType: "price only, without dividends", sourceName: "Nasdaq" },
    nasdaq100,
  ),
};
