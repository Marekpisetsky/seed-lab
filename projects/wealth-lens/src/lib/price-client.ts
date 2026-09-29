/**
 * Browser side of /api/prices. Requests are shared per symbol for the whole
 * session, so several charts of the same ticker trigger a single request;
 * failed requests are forgotten so that "Retry" really retries.
 */

import type { PriceError, PriceErrorResponse, PriceSeriesResponse } from "./prices";

export type PriceFetchResult = { ok: true; data: PriceSeriesResponse } | { ok: false; error: PriceError };

const requests = new Map<string, Promise<PriceFetchResult>>();

async function request(symbol: string): Promise<PriceFetchResult> {
  let response: Response;
  try {
    response = await fetch(`/api/prices?symbol=${encodeURIComponent(symbol)}`);
  } catch {
    return {
      ok: false,
      error: { code: "UPSTREAM_ERROR", message: "Could not reach the price service. Check your connection." },
    };
  }
  try {
    const body = (await response.json()) as PriceSeriesResponse | PriceErrorResponse;
    return "error" in body ? { ok: false, error: body.error } : { ok: true, data: body };
  } catch {
    return {
      ok: false,
      error: { code: "UNEXPECTED_FORMAT", message: `The price service answered with HTTP ${response.status}.` },
    };
  }
}

export function fetchPriceSeries(symbol: string): Promise<PriceFetchResult> {
  let pending = requests.get(symbol);
  if (!pending) {
    pending = request(symbol).then((result) => {
      if (!result.ok) requests.delete(symbol);
      return result;
    });
    requests.set(symbol, pending);
  }
  return pending;
}

/** Drops a cached result so the next fetch goes to the server again. */
export function forgetPriceSeries(symbol: string): void {
  requests.delete(symbol);
}
