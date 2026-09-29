/**
 * Downloads one instrument's daily closes: Yahoo first (two hosts), then
 * Stooq as a fallback. Returns the first series that comes back, or every
 * reason it could not be fetched, so the job can log them and keep the
 * previous data.
 */

import type { Instrument } from "../../src/lib/market-format.ts";
import type { PricePoint, SeriesResult } from "./series.mts";
import { interpretStooqResponse, stooqUrl } from "./stooq.mts";
import { interpretYahooResponse, YAHOO_HOSTS, yahooChartUrl } from "./yahoo.mts";

export type DownloadResult =
  | { ok: true; source: "yahoo" | "stooq"; points: PricePoint[]; currency: string | null }
  | { ok: false; errors: string[] };

interface Options {
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
}

const HEADERS = { "User-Agent": "Mozilla/5.0 (compatible; wealth-lens daily price job)" };

/** One request, classified by `interpret`; network failures become UPSTREAM_ERROR or TIMEOUT. */
async function fetchSeries(
  url: string,
  accept: string,
  interpret: (status: number, body: string) => SeriesResult,
  { fetchImpl = fetch, timeoutMs = 20_000 }: Options,
): Promise<SeriesResult> {
  try {
    const response = await fetchImpl(url, {
      headers: { ...HEADERS, Accept: accept },
      signal: AbortSignal.timeout(timeoutMs),
    });
    return interpret(response.status, await response.text());
  } catch (error) {
    const timedOut = error instanceof DOMException && error.name === "TimeoutError";
    return {
      ok: false,
      error: timedOut
        ? { code: "TIMEOUT", message: "no answer in time" }
        : { code: "UPSTREAM_ERROR", message: `request failed (${String(error)})` },
    };
  }
}

export async function downloadInstrument(instrument: Instrument, options: Options = {}): Promise<DownloadResult> {
  const errors: string[] = [];

  for (const host of YAHOO_HOSTS) {
    const result = await fetchSeries(yahooChartUrl(instrument.symbol, host), "application/json", interpretYahooResponse, options);
    if (result.ok) return { ok: true, source: "yahoo", points: result.points, currency: result.currency };
    errors.push(`Yahoo (${host}): ${result.error.code}, ${result.error.message}`);
    // A symbol Yahoo does not know is unknown on both hosts.
    if (result.error.code === "NOT_FOUND") break;
  }

  const stooq = instrument.stooq;
  if (stooq) {
    const interpret = (status: number, body: string) => interpretStooqResponse(status, body, stooq);
    const result = await fetchSeries(stooqUrl(stooq), "text/csv, text/plain", interpret, options);
    if (result.ok) return { ok: true, source: "stooq", points: result.points, currency: result.currency };
    errors.push(`Stooq (${stooq}): ${result.error.code}, ${result.error.message}`);
  }
  return { ok: false, errors };
}
