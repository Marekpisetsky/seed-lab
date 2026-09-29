"use client";

import { useEffect, useState } from "react";
import { fetchFirstAvailable, forgetPriceSeries, type ResolvedPriceResult } from "@/lib/price-client";

export type PriceSeriesState = { status: "idle" } | { status: "loading" } | ({ status: "done" } & ResolvedPriceResult);

/**
 * Loads the daily series of a holding, trying its candidate Stooq symbols in
 * order; pass `null` to skip loading (e.g. when the user uploaded prices).
 * "Loading" is derived from whether the stored result belongs to the current
 * request, so state is only set from the async callback.
 */
export function usePriceSeries(candidates: readonly string[] | null): { state: PriceSeriesState; retry: () => void } {
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<{ key: string; value: ResolvedPriceResult } | null>(null);
  // A string is stable across renders, unlike a freshly built array.
  const joined = candidates === null ? null : candidates.join(",");
  const key = `${joined}#${attempt}`;

  useEffect(() => {
    if (joined === null) return;
    let cancelled = false;
    void fetchFirstAvailable(joined.split(",")).then((value) => {
      if (!cancelled) setResult({ key, value });
    });
    return () => {
      cancelled = true;
    };
  }, [joined, key]);

  const retry = () => {
    joined?.split(",").forEach(forgetPriceSeries);
    setAttempt((previous) => previous + 1);
  };

  if (joined === null) return { state: { status: "idle" }, retry };
  if (result?.key !== key) return { state: { status: "loading" }, retry };
  return { state: { status: "done", ...result.value }, retry };
}
