import type { Holding } from "../types";

/** A position read from a file, before it gets an id. */
export type ImportedPosition = Omit<Holding, "id">;

/** A row the importer could not use, with the reason in plain words. */
export interface ImportIssue {
  /** 1-based line number in the file. */
  line: number;
  message: string;
}

/** Rows skipped on purpose because they are not trades (deposits, dividends...). */
export interface IgnoredRows {
  label: string;
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
  | { ok: false; error: string };
