"use client";

import { useSyncExternalStore } from "react";
import { appStore, type AppState } from "@/lib/app-store";

/**
 * The shared in-memory state; every screen re-renders when it changes.
 * Kept light on purpose: the first screen uses it, while everything derived
 * from the plan (datasets, projections) lives in use-plan.ts.
 */
export function useAppState(): AppState {
  return useSyncExternalStore(appStore.subscribe, appStore.get, appStore.getServerSnapshot);
}
