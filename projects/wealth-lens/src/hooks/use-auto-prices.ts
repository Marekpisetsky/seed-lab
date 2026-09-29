"use client";

import { useEffect } from "react";
import { latestPriceUpdate } from "@/lib/auto-price";
import type { Updater } from "@/lib/persistent-store";
import { fetchFirstAvailable } from "@/lib/price-client";
import { stooqCandidates } from "@/lib/symbols";
import type { Holding } from "@/lib/types";

/**
 * Keeps automatic prices up to date: for every holding whose price is
 * "auto", fetches its series through /api/prices and stores the latest
 * close. Manual prices are left alone, and when the source fails the price
 * simply stays as it was.
 */
export function useAutoPrices(
  holdings: readonly Holding[],
  setHoldings: (next: Updater<readonly Holding[]>) => unknown,
  symbolOverrides: Readonly<Record<string, string>>,
): void {
  const targets = holdings
    .filter((holding) => holding.priceSource === "auto")
    .map((holding) => ({
      id: holding.id,
      candidates: stooqCandidates(holding.ticker, holding.currency, symbolOverrides[holding.ticker]),
    }));
  // Refetch only when the set of automatic holdings or their symbols change,
  // not when a fetched price lands.
  const key = JSON.stringify(targets);

  useEffect(() => {
    let cancelled = false;
    for (const { id, candidates } of JSON.parse(key) as typeof targets) {
      void fetchFirstAvailable(candidates).then((result) => {
        if (cancelled || !result.ok) return;
        setHoldings((previous) => {
          let changed = false;
          const next = previous.map((holding) => {
            if (holding.id !== id) return holding;
            const patch = latestPriceUpdate(holding, result.symbol, result.data.points);
            if (!patch) return holding;
            changed = true;
            return { ...holding, ...patch };
          });
          return changed ? next : previous;
        });
      });
    }
    return () => {
      cancelled = true;
    };
  }, [key, setHoldings]);
}
