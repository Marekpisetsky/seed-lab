/**
 * Yahoo Finance's public chart endpoint, the job's main source:
 * https://query1.finance.yahoo.com/v8/finance/chart/{SYMBOL}?range=10y&interval=1d
 *
 * Unofficial and undocumented: no API key and no contract, the format can
 * change and requests can be refused at any time. That is acceptable for a
 * job that runs once a day and keeps the previous data when it fails, and it
 * is never called by the app itself. Every answer is classified, not trusted.
 */

import { sortedByDay, type SeriesResult } from "./series.mts";

export const YAHOO_HOSTS = ["query1.finance.yahoo.com", "query2.finance.yahoo.com"] as const;

export function yahooChartUrl(symbol: string, host: string = YAHOO_HOSTS[0]): string {
  const params = new URLSearchParams({ range: "10y", interval: "1d" });
  return `https://${host}/v8/finance/chart/${encodeURIComponent(symbol)}?${params}`;
}

/** Yahoo reports London prices in pence as "GBp"; elsewhere codes are ISO 4217. */
export function normalizeYahooCurrency(currency: unknown): string | null {
  if (typeof currency !== "string" || currency === "") return null;
  return currency === "GBp" ? "GBX" : currency.toUpperCase();
}

type Json = Record<string, unknown>;
const isObject = (value: unknown): value is Json => typeof value === "object" && value !== null;

const unexpected = (detail: string): SeriesResult => ({
  ok: false,
  error: { code: "UNEXPECTED_FORMAT", message: `Yahoo's answer was not in the expected format (${detail}).` },
});

/** Turns Yahoo's raw answer (HTTP status + body text) into a series or a specific error. */
export function interpretYahooResponse(status: number, body: string): SeriesResult {
  if (status === 429) {
    return { ok: false, error: { code: "RATE_LIMITED", message: "Yahoo is limiting requests." } };
  }
  const text = body.trim();
  if (text.startsWith("<")) {
    return {
      ok: false,
      error: { code: "VERIFICATION_REQUIRED", message: "Yahoo sent a web page (consent or check) instead of data." },
    };
  }

  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    if (status < 200 || status >= 300) {
      return { ok: false, error: { code: "UPSTREAM_ERROR", message: `Yahoo answered with HTTP ${status}.` } };
    }
    return unexpected("not JSON");
  }

  const chart = isObject(json) && isObject(json.chart) ? json.chart : null;
  if (!chart) return unexpected("no chart");

  if (isObject(chart.error)) {
    const code = String(chart.error.code ?? "");
    if (/not found/i.test(code) || status === 404) {
      return { ok: false, error: { code: "NOT_FOUND", message: "Yahoo has no data for this symbol." } };
    }
    return {
      ok: false,
      error: { code: "UPSTREAM_ERROR", message: `Yahoo error: ${String(chart.error.description ?? code)}` },
    };
  }
  if (status < 200 || status >= 300) {
    return { ok: false, error: { code: "UPSTREAM_ERROR", message: `Yahoo answered with HTTP ${status}.` } };
  }

  const result = Array.isArray(chart.result) ? chart.result[0] : null;
  if (!isObject(result) || !isObject(result.meta)) return unexpected("no result");
  const timestamps = result.timestamp;
  const quote = isObject(result.indicators) && Array.isArray(result.indicators.quote) ? result.indicators.quote[0] : null;
  const closes = isObject(quote) ? quote.close : null;
  if (!Array.isArray(timestamps) || !Array.isArray(closes)) {
    // A valid symbol with no trading history comes back without these arrays.
    return { ok: false, error: { code: "NOT_FOUND", message: "Yahoo has no price history for this symbol." } };
  }

  // Bars are stamped at the session open; shift by the exchange's UTC offset
  // so each close lands on its local trading day.
  const offsetSeconds = typeof result.meta.gmtoffset === "number" ? result.meta.gmtoffset : 0;
  const byDay = new Map<string, number>();
  timestamps.forEach((timestamp, index) => {
    const close = closes[index];
    if (typeof timestamp !== "number" || typeof close !== "number" || !Number.isFinite(close) || close <= 0) return;
    const day = new Date((timestamp + offsetSeconds) * 1000).toISOString().slice(0, 10);
    byDay.set(day, close);
  });
  if (byDay.size === 0) {
    return { ok: false, error: { code: "NOT_FOUND", message: "Yahoo has no price history for this symbol." } };
  }
  return { ok: true, points: sortedByDay(byDay), currency: normalizeYahooCurrency(result.meta.currency) };
}
