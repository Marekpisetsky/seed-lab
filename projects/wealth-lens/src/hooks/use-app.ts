"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { appStore, type AppState } from "@/lib/app-store";
import { priceHoldings } from "@/lib/auto-price";
import { startOfUtcDay } from "@/lib/dates";
import { derivePlan, type PlanView } from "@/lib/plan-view";
import type { Holding } from "@/lib/types";

/** The shared in-memory state; every screen re-renders when it changes. */
export function useAppState(): AppState {
  return useSyncExternalStore(appStore.subscribe, appStore.get, appStore.getServerSnapshot);
}

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

/** Everything derived from the one plan: capital, growth, active goal, projection, income. */
export function usePlanView(): PlanView {
  const { plan } = useAppState();
  const holdings = usePricedHoldings();
  const today = useToday();
  return useMemo(() => derivePlan(plan, holdings, today), [plan, holdings, today]);
}
