"use client";

import { useMemo } from "react";
import { priceHoldings } from "@/lib/auto-price";
import { holdingsStore } from "@/lib/stores";
import type { Holding } from "@/lib/types";
import { usePersistentStore } from "./use-persistent-store";

/** The holdings with automatic prices filled from the downloaded market data. */
export function usePricedHoldings(): readonly Holding[] {
  const [holdings] = usePersistentStore(holdingsStore);
  return useMemo(() => priceHoldings(holdings), [holdings]);
}
