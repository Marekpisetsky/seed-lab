"use client";

import { useEffect, useState } from "react";
import { fetchPriceSeries, forgetPriceSeries, type PriceFetchResult } from "@/lib/price-client";

export type PriceSeriesState = { status: "idle" } | { status: "loading" } | ({ status: "done" } & PriceFetchResult);

/**
 * Loads the daily series of a Stooq symbol; pass `null` to skip loading
 * (e.g. when the user uploaded their own prices). "Loading" is derived from
 * whether the stored result belongs to the current request, so state is only
 * set from the async callback.
 */
export function usePriceSeries(symbol: string | null): { state: PriceSeriesState; retry: () => void } {
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<{ key: string; value: PriceFetchResult } | null>(null);
  const key = `${symbol}#${attempt}`;

  useEffect(() => {
    if (symbol === null) return;
    let cancelled = false;
    void fetchPriceSeries(symbol).then((value) => {
      if (!cancelled) setResult({ key, value });
    });
    return () => {
      cancelled = true;
    };
  }, [symbol, key]);

  const retry = () => {
    if (symbol === null) return;
    forgetPriceSeries(symbol);
    setAttempt((previous) => previous + 1);
  };

  if (symbol === null) return { state: { status: "idle" }, retry };
  if (result?.key !== key) return { state: { status: "loading" }, retry };
  return { state: { status: "done", ...result.value }, retry };
}
