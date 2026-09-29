/**
 * Server side of GET /api/prices?symbol=aapl.us: a proxy for Stooq's daily
 * CSV download (https://stooq.com/q/d/l/?s=SYMBOL&i=d).
 *
 * Why a proxy: Stooq sends no CORS headers, so the browser cannot call it
 * directly. The server fetches the CSV, classifies the answer (data, "No
 * data", rate limit, verification page, unexpected format) and returns JSON.
 *
 * Stooq is an unofficial, free third-party source with no API key and no
 * guarantees. That is acceptable for a personal tool, not for a product that
 * is sold, and the UI always offers uploading a CSV as a fallback.
 *
 * Caching: successful series are kept in memory for 6 hours and sent with
 * Cache-Control headers so browsers and a CDN can reuse them. The upstream
 * fetch itself is `no-store` because Stooq answers errors such as "No data"
 * with HTTP 200, and those must never be cached. Errors are sent `no-store`.
 */

import {
  interpretStooqResponse,
  isValidStooqSymbol,
  stooqUrl,
  type PriceError,
  type PriceErrorCode,
  type PriceErrorResponse,
  type PriceSeriesResponse,
} from "./prices";
import { createTtlCache, type TtlCache } from "./ttl-cache";

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

export function createPriceProxy({
  fetchImpl = fetch,
  cache = createTtlCache<PriceSeriesResponse>({ ttlMs: CACHE_TTL_SECONDS * 1000, maxEntries: 200 }),
  now = () => new Date(),
  timeoutMs = UPSTREAM_TIMEOUT_MS,
}: PriceProxyDependencies = {}) {
  return async function handlePriceRequest(request: Request): Promise<Response> {
    const symbol = (new URL(request.url).searchParams.get("symbol") ?? "").trim().toLowerCase();
    if (!isValidStooqSymbol(symbol)) {
      return errorResponse({
        code: "INVALID_SYMBOL",
        message: "Use a Stooq symbol such as aapl.us or vwce.de (letters, digits, dots and dashes).",
      });
    }

    const cached = cache.get(symbol);
    if (cached) return successResponse(cached, "HIT");

    let status: number;
    let text: string;
    try {
      const upstream = await fetchImpl(stooqUrl(symbol), {
        cache: "no-store",
        signal: AbortSignal.timeout(timeoutMs),
        headers: { Accept: "text/csv, text/plain", "User-Agent": "wealth-lens (personal finance tool)" },
      });
      status = upstream.status;
      text = await upstream.text();
    } catch (error) {
      const timedOut = error instanceof DOMException && error.name === "TimeoutError";
      return errorResponse(
        timedOut
          ? { code: "TIMEOUT", message: "Stooq did not answer in time. Try again later or upload a CSV." }
          : { code: "UPSTREAM_ERROR", message: "Could not reach Stooq. Try again later or upload a CSV." },
      );
    }

    const result = interpretStooqResponse(status, text);
    if (!result.ok) return errorResponse(result.error);

    const body: PriceSeriesResponse = {
      symbol,
      source: "stooq",
      fetchedAt: now().toISOString(),
      points: result.points,
    };
    cache.set(symbol, body);
    return successResponse(body, "MISS");
  };
}
