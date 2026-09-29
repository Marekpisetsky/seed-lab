/** Types shared by the price sources of the daily job. */

export interface PricePoint {
  /** Trading day, `YYYY-MM-DD`. */
  time: string;
  /** Closing price in the listing's currency. */
  close: number;
}

export type SourceErrorCode =
  | "NOT_FOUND"
  | "RATE_LIMITED"
  | "VERIFICATION_REQUIRED"
  | "UNEXPECTED_FORMAT"
  | "UPSTREAM_ERROR"
  | "TIMEOUT";

export interface SourceError {
  code: SourceErrorCode;
  message: string;
}

/** A source's answer, classified: the series and its currency, or why there is none. */
export type SeriesResult =
  | { ok: true; points: PricePoint[]; currency: string | null }
  | { ok: false; error: SourceError };

/** Sorts by day and keeps one point per day (the last one seen). */
export function sortedByDay(byDay: Map<string, number>): PricePoint[] {
  return [...byDay]
    .map(([time, close]) => ({ time, close }))
    .sort((a, b) => (a.time < b.time ? -1 : a.time > b.time ? 1 : 0));
}
