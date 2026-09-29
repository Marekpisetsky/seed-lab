import { parseCsv } from "../csv";
import type { Holding } from "../types";
import { isSimpleHoldingsHeader, parseSimpleHoldings, SIMPLE_HOLDINGS_COLUMNS } from "./simple-holdings";
import { isTrading212Header, parseTrading212 } from "./trading212";
import type { ImportedPosition, ImportOutcome } from "./types";

export type { IgnoredRows, ImportedPosition, ImportFormat, ImportIssue, ImportOutcome } from "./types";

export const IMPORT_FORMAT_LABELS = {
  trading212: "Trading 212 export",
  holdings: "Holdings CSV",
} as const;

/** Detects the file format from its header and reads the positions in it. */
export function importHoldingsCsv(text: string): ImportOutcome {
  const table = parseCsv(text);
  if (table.header.length === 0) {
    return { ok: false, error: "The file is empty." };
  }
  if (table.records.length === 0) {
    return { ok: false, error: "The file has a header but no data rows." };
  }
  if (isTrading212Header(table.header)) return parseTrading212(table);
  if (isSimpleHoldingsHeader(table.header)) return parseSimpleHoldings(table);
  return {
    ok: false,
    error:
      "Unrecognized CSV. Expected a Trading 212 history export (History → Export) " +
      `or a holdings CSV with columns: ${SIMPLE_HOLDINGS_COLUMNS}.`,
  };
}

/**
 * Builds the new holdings list from imported positions. Imports replace the
 * list. A price in the file counts as typed by the user (manual); otherwise
 * the price already known for the same ticker and currency is kept, and if
 * there is none the price is left to be filled automatically.
 */
export function mergeImportedHoldings(
  existing: readonly Holding[],
  positions: readonly ImportedPosition[],
  makeId: () => string,
): Holding[] {
  const known = new Map(existing.map((holding) => [`${holding.ticker}|${holding.currency}`, holding]));
  return positions.map((position): Holding => {
    const id = makeId();
    if (position.currentPrice !== null) {
      return { ...position, id, priceSource: "manual", priceDate: null };
    }
    const previous = known.get(`${position.ticker}|${position.currency}`);
    if (!previous) return { ...position, id, priceSource: "auto", priceDate: null };
    const { currentPrice, priceSource, priceDate } = previous;
    return { ...position, id, currentPrice, priceSource, priceDate };
  });
}
