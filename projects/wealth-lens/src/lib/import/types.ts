import type { Problem } from "../problems";
import type { HoldingInput } from "../types";

/** A position read from a file, before it gets an id. */
export type ImportedPosition = HoldingInput;

/** A row the importer could not use, and why. */
export interface ImportIssue {
  /** 1-based line number in the file. */
  line: number;
  problem: Problem;
}

/** Rows skipped on purpose because they are not trades (deposits, dividends...). */
export interface IgnoredRows {
  /** The file's own word for them ("Deposit"); `null` for rows with no action. */
  label: string | null;
  count: number;
}

export type ImportFormat = "trading212" | "holdings";

export type ImportOutcome =
  | {
      ok: true;
      format: ImportFormat;
      positions: ImportedPosition[];
      issues: ImportIssue[];
      ignored: IgnoredRows[];
      /** Data rows in the file (header excluded). */
      rowCount: number;
    }
  | { ok: false; error: Problem };
