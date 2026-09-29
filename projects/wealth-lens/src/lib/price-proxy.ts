/**
 * Server side of GET /api/prices?symbol=VWCE.DE: daily closes for a symbol
 * in Yahoo Finance notation.
 *
 * Sources, in order:
 * 1. Yahoo Finance's public chart endpoint (lib/yahoo.ts), no API key.
 * 2. Stooq's daily CSV (https://stooq.com/q/d/l/?s=SYMBOL&i=d) as a
 *    fallback when Yahoo fails and Stooq lists the same security.
 * Both are unofficial third-party sources with no contract: fine for a
 * personal tool, not for a product that is sold. Stooq rejects requests from
 * Vercel's servers, which is why Yahoo comes first. The UI always offers
 * uploading a CSV when both fail.
 *
 * Why a proxy: neither source sends CORS headers, so the browser cannot call
 * them directly. The server fetches, classifies the answer and returns JSON
 * with the points and the quote currency.
 *
 * Caching: successful series are kept in memory for 6 hours and sent with
 * Cache-Control headers so browsers and a CDN can reuse them. Upstream
 * fetches are `no-store` because both sources can answer errors with HTTP
 * 200, and those must never be cached. Errors are sent `no-store`.
 */

import {
  interpretStooqResponse,
  stooqQuoteCurrency,
  stooqUrl,
  type PriceError,
  type PriceErrorCode,
  type PriceErrorResponse,
  type PriceSeriesResponse,
} from "./prices";
import { yahooToStooq } from "./symbols";
import { createTtlCache, type TtlCache } from "./ttl-cache";
import { interpretYahooResponse, normalizeYahooSymbol, yahooChartUrl } from "./yahoo";

const CACHE_TTL_SECONDS = 6 * 60 * 60;
const UPSTREAM_TIMEOUT_MS = 10_000;

const SUCCESS_CACHE_CONTROL = `public, max-age=3600, s-maxage=${CACHE_TTL_SECONDS}, stale-while-revalidate=86400`;

const STATUS_BY_CODE: Record<PriceErrorCode, number> = {
  INVALID_SYMBOL: 400,
  NOT_FOUND: 404,
  RATE_LIMITED: 429,
  VERIFICATION_REQUIRED: 502,
  UNEXPECTED_FORMAT: 502,
  UPSTREAM_ERROR: 502,
  TIMEOUT: 504,
};

interface PriceProxyDependencies {
  fetchImpl?: typeof fetch;
  cache?: TtlCache<PriceSeriesResponse>;
  now?: () => Date;
  timeoutMs?: number;
}

function errorResponse(error: PriceError): Response {
  const body: PriceErrorResponse = { error };
  return Response.json(body, { status: STATUS_BY_CODE[error.code], headers: { "Cache-Control": "no-store" } });
}

function successResponse(body: PriceSeriesResponse, cacheStatus: "HIT" | "MISS"): Response {
  return Response.json(body, {
    headers: { "Cache-Control": SUCCESS_CACHE_CONTROL, "X-Price-Cache": cacheStatus },
  });
}

type Upstream = { ok: true; status: number; text: string } | { ok: false; error: PriceError };

export function createPriceProxy({
  fetchImpl = fetch,
  cache = createTtlCache<PriceSeriesResponse>({ ttlMs: CACHE_TTL_SECONDS * 1000, maxEntries: 200 }),
  now = () => new Date(),
  timeoutMs = UPSTREAM_TIMEOUT_MS,
}: PriceProxyDependencies = {}) {
  const download = async (url: string, source: string, accept: string): Promise<Upstream> => {
    try {
      const upstream = await fetchImpl(url, {
        cache: "no-store",
        signal: AbortSignal.timeout(timeoutMs),
        headers: { Accept: accept, "User-Agent": "Mozilla/5.0 (compatible; wealth-lens personal finance tool)" },
      });
      return { ok: true, status: upstream.status, text: await upstream.text() };
    } catch (error) {
      const timedOut = error instanceof DOMException && error.name === "TimeoutError";
      return {
        ok: false,
        error: timedOut
          ? { code: "TIMEOUT", message: `${source} did not answer in time. Try again later or upload a CSV.` }
          : { code: "UPSTREAM_ERROR", message: `Could not reach ${source}. Try again later or upload a CSV.` },
      };
    }
  };

  const fromYahoo = async (symbol: string) => {
    const answer = await download(yahooChartUrl(symbol), "Yahoo", "application/json");
    return answer.ok ? interpretYahooResponse(answer.status, answer.text) : answer;
  };

  const fromStooq = async (stooqSymbol: string) => {
    const answer = await download(stooqUrl(stooqSymbol), "Stooq", "text/csv, text/plain");
    if (!answer.ok) return answer;
    const result = interpretStooqResponse(answer.status, answer.text);
    return result.ok ? { ...result, currency: stooqQuoteCurrency(stooqSymbol) } : result;
  };

  return async function handlePriceRequest(request: Request): Promise<Response> {
    const symbol = normalizeYahooSymbol(new URL(request.url).searchParams.get("symbol") ?? "");
    if (symbol === null) {
      return errorResponse({
        code: "INVALID_SYMBOL",
        message: "Use a symbol such as AAPL, VWCE.DE or ASML.AS (letters, digits, dots and dashes).",
      });
    }

    const cached = cache.get(symbol);
    if (cached) return successResponse(cached, "HIT");

    const respond = (source: PriceSeriesResponse["source"], points: PriceSeriesResponse["points"], currency: string | null) => {
      const body: PriceSeriesResponse = { symbol, source, currency, fetchedAt: now().toISOString(), points };
      cache.set(symbol, body);
      return successResponse(body, "MISS");
    };

    const yahoo = await fromYahoo(symbol);
    if (yahoo.ok) return respond("yahoo", yahoo.points, yahoo.currency);

    const stooqSymbol = yahooToStooq(symbol);
    if (stooqSymbol) {
      const stooq = await fromStooq(stooqSymbol);
      if (stooq.ok) return respond("stooq", stooq.points, stooq.currency);
    }
    return errorResponse(yahoo.error);
  };
}
