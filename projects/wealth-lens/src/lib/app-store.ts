/**
 * The app's state: one plan shared by every screen, the holdings and any
 * price files the user uploaded. It lives in this module's memory only:
 * nothing is written to localStorage, cookies or a server, so reloading the
 * page starts over from the first questions. "Download my data" and "Load
 * my data" (lib/data-file.ts) are the only way to keep it.
 *
 * Shaped for React's `useSyncExternalStore`: `get` returns the same object
 * until something changes, and every change notifies all screens at once.
 */

import type { Holding, Plan } from "./types";
import { DEFAULT_PLAN, type UploadedPrices } from "./validation";

export interface AppState {
  plan: Plan;
  holdings: readonly Holding[];
  /** Price files uploaded for tickers without downloaded prices, keyed by ticker. */
  uploadedPrices: Readonly<Record<string, UploadedPrices>>;
}

export const INITIAL_STATE: AppState = { plan: DEFAULT_PLAN, holdings: [], uploadedPrices: {} };

export type Updater<T> = T | ((previous: T) => T);

export interface Store<T> {
  get(): T;
  /** What the static HTML is rendered with: the initial state. */
  getServerSnapshot(): T;
  set(next: Updater<T>): void;
  subscribe(listener: () => void): () => void;
}

export function createStore<T>(initial: T): Store<T> {
  let value = initial;
  const listeners = new Set<() => void>();
  return {
    get: () => value,
    getServerSnapshot: () => initial,
    set(next) {
      const updated = typeof next === "function" ? (next as (previous: T) => T)(value) : next;
      if (Object.is(updated, value)) return;
      value = updated;
      listeners.forEach((listener) => listener());
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

export const appStore = createStore<AppState>(INITIAL_STATE);

/** True once the first questions were answered, holdings added or a file loaded. */
export function hasStarted({ plan, holdings }: AppState): boolean {
  return plan.invested !== null || holdings.length > 0;
}

export function updatePlan(patch: Partial<Plan> | ((plan: Plan) => Partial<Plan>)): void {
  appStore.set((state) => ({
    ...state,
    plan: { ...state.plan, ...(typeof patch === "function" ? patch(state.plan) : patch) },
  }));
}

export function setHoldings(next: Updater<readonly Holding[]>): void {
  appStore.set((state) => ({
    ...state,
    holdings: typeof next === "function" ? next(state.holdings) : next,
  }));
}

export function setUploadedPrices(ticker: string, prices: UploadedPrices | null): void {
  appStore.set((state) => {
    const uploadedPrices = { ...state.uploadedPrices };
    if (prices) uploadedPrices[ticker] = prices;
    else delete uploadedPrices[ticker];
    return { ...state, uploadedPrices };
  });
}

/** Replaces everything, e.g. with a loaded data file. */
export function replaceState(state: AppState): void {
  appStore.set(state);
}
