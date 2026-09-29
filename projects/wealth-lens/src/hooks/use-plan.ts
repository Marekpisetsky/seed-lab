"use client";

import { useMemo, useState } from "react";
import { priceHoldings } from "@/lib/auto-price";
import { startOfUtcDay } from "@/lib/dates";
import type { Holding } from "@/lib/types";
import { useAppState } from "./use-app";

/** Holdings with automatic prices filled from the downloaded data or the user's price files. */
export function usePricedHoldings(): readonly Holding[] {
  const { holdings, uploadedPrices } = useAppState();
  return useMemo(() => priceHoldings(holdings, uploadedPrices), [holdings, uploadedPrices]);
}

/** Today at 00:00 UTC, fixed for the life of the component. */
export function useToday(): Date {
  const [today] = useState(() => startOfUtcDay(new Date()));
  return today;
}
