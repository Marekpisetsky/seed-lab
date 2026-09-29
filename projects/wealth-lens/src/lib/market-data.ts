/**
 * Market data the app ships with. Nothing is fetched from a price source
 * while the app runs: a daily job (scripts/update-prices.mts, run by a
 * GitHub Action) downloads closes for a curated list of instruments
 * (src/data/instruments.json) and commits two kinds of static files:
 *
 * - public/data/prices.json: the latest close, a small 12-month line and the
 *   past growth of every instrument. Imported at build time, so it is part of
 *   the page itself.
 * - public/data/history/<ID>.json: the full daily series of one instrument,
 *   loaded from the app's own static files only when its chart is opened.
 *
 * Both are validated when read (lib/market-format.ts): a broken or partial
 * file leaves instruments without prices instead of crashing the page.
 */

import catalogue from "@/data/instruments.json";
import rawPrices from "../../public/data/prices.json";
import type { IndexId } from "./index-ids";
import { parseCatalogue, parsePricesFile, type Instrument, type PricesFile } from "./market-format";

export type { HistoryFile, Instrument, InstrumentPrices, PricesFile } from "./market-format";
export { decodeHistory } from "./market-format";

const parsedCatalogue = parseCatalogue(catalogue);

export const INSTRUMENTS: readonly Instrument[] = parsedCatalogue.instruments;
export const INDEX_TRACKERS: Readonly<Record<IndexId, readonly string[]>> = parsedCatalogue.trackers;
export const MARKET: PricesFile = parsePricesFile(rawPrices);

export function instrumentById(id: string): Instrument | undefined {
  return INSTRUMENTS.find((instrument) => instrument.id === id);
}

/**
 * The curated instrument a holding is: same ticker (or Yahoo symbol, with or
 * without the exchange suffix) and same currency, since the app never
 * converts currencies. `undefined` for anything else.
 */
export function instrumentForHolding(
  ticker: string,
  currency: string,
  instruments: readonly Instrument[] = INSTRUMENTS,
): Instrument | undefined {
  const clean = ticker.trim().toUpperCase();
  return instruments.find(
    (instrument) =>
      instrument.currency === currency &&
      (instrument.id === clean || instrument.symbol === clean || instrument.symbol.split(".")[0] === clean),
  );
}

/** Latest trading day across all instruments (`YYYY-MM-DD`), or `null` with no prices. */
export function latestPriceDate(file: PricesFile = MARKET): string | null {
  let latest: string | null = null;
  for (const { date } of Object.values(file.prices)) if (latest === null || date > latest) latest = date;
  return latest;
}

/** Where an instrument's full daily series is served from (the app's own static files). */
export function historyUrl(id: string): string {
  return `/data/history/${encodeURIComponent(id)}.json`;
}
