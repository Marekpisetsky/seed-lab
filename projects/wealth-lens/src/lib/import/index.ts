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
 * list, but a current price the user already typed is kept for the same
 * ticker and currency when the file does not provide one.
 */
export function mergeImportedHoldings(
  existing: readonly Holding[],
  positions: readonly ImportedPosition[],
  makeId: () => string,
): Holding[] {
  const knownPrices = new Map(
    existing
      .filter((holding) => holding.currentPrice !== null)
      .map((holding) => [`${holding.ticker}|${holding.currency}`, holding.currentPrice]),
  );
  return positions.map((position) => ({
    ...position,
    id: makeId(),
    currentPrice: position.currentPrice ?? knownPrices.get(`${position.ticker}|${position.currency}`) ?? null,
  }));
}
