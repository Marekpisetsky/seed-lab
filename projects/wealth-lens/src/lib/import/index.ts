import { parseCsv } from "../csv";
import { isSimpleHoldingsHeader, parseSimpleHoldings, SIMPLE_HOLDINGS_COLUMNS } from "./simple-holdings";
import { isTrading212Header, parseTrading212 } from "./trading212";
import { problem } from "../problems";
import type { ImportOutcome } from "./types";

export type { IgnoredRows, ImportedPosition, ImportFormat, ImportIssue, ImportOutcome } from "./types";

export { mergeImportedHoldings } from "./merge";

/** Detects the file format from its header and reads the positions in it. */
export function importHoldingsCsv(text: string): ImportOutcome {
  const table = parseCsv(text);
  if (table.header.length === 0) {
    return { ok: false, error: problem("file-empty") };
  }
  if (table.records.length === 0) {
    return { ok: false, error: problem("file-no-rows") };
  }
  if (isTrading212Header(table.header)) return parseTrading212(table);
  if (isSimpleHoldingsHeader(table.header)) return parseSimpleHoldings(table);
  return { ok: false, error: problem("file-unknown", { columns: SIMPLE_HOLDINGS_COLUMNS }) };
}
