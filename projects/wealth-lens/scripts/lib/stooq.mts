/**
 * Stooq's daily CSV, the job's fallback source when Yahoo fails:
 * https://stooq.com/q/d/l/?s=vuaa.de&i=d
 *
 * Also unofficial, with no key and no guarantees. It can rate-limit, ask for
 * a verification step or an API key, or answer "No data", so every answer is
 * classified. The currency comes from the market suffix of the symbol.
 */

import { sortedByDay, type SeriesResult } from "./series.mts";

export function stooqUrl(symbol: string): string {
  const params = new URLSearchParams({ s: symbol, i: "d" });
  return `https://stooq.com/q/d/l/?${params}`;
}

const SUFFIX_CURRENCIES: Readonly<Record<string, string>> = {
  us: "USD",
  de: "EUR",
  f: "EUR",
  uk: "GBX", // London prices are quoted in pence
  jp: "JPY",
  hk: "HKD",
  pl: "PLN",
};

/** Currency Stooq quotes a symbol in, when the market suffix tells; else `null`. */
export function stooqQuoteCurrency(symbol: string): string | null {
  const suffix = /\.([a-z]+)$/.exec(symbol)?.[1];
  return suffix ? (SUFFIX_CURRENCIES[suffix] ?? null) : null;
}

/** Reads `Date,Open,High,Low,Close,Volume`; rows without a valid date and positive close are skipped. */
function parseStooqCsv(text: string): Map<string, number> | null {
  const [header, ...rows] = text.split(/\r?\n/);
  const columns = header.split(",").map((name) => name.trim().toLowerCase());
  const dateColumn = columns.indexOf("date");
  const closeColumn = columns.indexOf("close");
  if (dateColumn === -1 || closeColumn === -1) return null;
  const byDay = new Map<string, number>();
  for (const row of rows) {
    const fields = row.split(",");
    const day = fields[dateColumn]?.trim() ?? "";
    const close = Number(fields[closeColumn]);
    if (/^\d{4}-\d{2}-\d{2}$/.test(day) && Number.isFinite(close) && close > 0) byDay.set(day, close);
  }
  return byDay;
}

/** Turns Stooq's raw answer into a series or a specific, explainable error. */
export function interpretStooqResponse(status: number, body: string, symbol: string): SeriesResult {
  const text = body.trim();
  if (status < 200 || status >= 300) {
    return { ok: false, error: { code: "UPSTREAM_ERROR", message: `Stooq answered with HTTP ${status}.` } };
  }
  if (text === "" || /^no data/i.test(text)) {
    return { ok: false, error: { code: "NOT_FOUND", message: "Stooq has no data for this symbol." } };
  }
  if (/exceeded the daily hits limit/i.test(text)) {
    return { ok: false, error: { code: "RATE_LIMITED", message: "Stooq's daily request limit was reached." } };
  }
  if (text.startsWith("<") || /captcha|api ?key|verif/i.test(text.slice(0, 500))) {
    return {
      ok: false,
      error: { code: "VERIFICATION_REQUIRED", message: "Stooq asked for a verification step or an API key." },
    };
  }
  const byDay = parseStooqCsv(text);
  if (!byDay || byDay.size === 0) {
    return { ok: false, error: { code: "UNEXPECTED_FORMAT", message: "Stooq's answer was not a daily price CSV." } };
  }
  return { ok: true, points: sortedByDay(byDay), currency: stooqQuoteCurrency(symbol) };
}
