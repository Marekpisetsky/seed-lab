"use client";

import { useSyncExternalStore } from "react";
import type { PersistentStore, Updater } from "@/lib/persistent-store";

/** Reads a persistent store and re-renders when it changes. */
export function usePersistentStore<T>(store: PersistentStore<T>): [T, (next: Updater<T>) => void] {
  const value = useSyncExternalStore(store.subscribe, store.get, store.getServerSnapshot);
  return [value, store.set];
}

const noopSubscribe = () => () => {};

/**
 * `false` during the server render and hydration, `true` afterwards. Lets
 * components that depend on localStorage render a placeholder first instead of
 * flashing the defaults.
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}
