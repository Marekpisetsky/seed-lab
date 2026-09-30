/**
 * The app's state: one plan shared by every screen, the holdings and any
 * price files the user uploaded. It lives in this module's memory only:
 * nothing is written to localStorage, cookies or a server, so reloading the
 * page starts over from the example numbers. "Download my data" and "Load
 * my data" (lib/data-file.ts) are the only way to keep it.
 *
 * Shaped for React's `useSyncExternalStore`: `get` returns the same object
 * until something changes, and every change notifies all screens at once.
 */

import { createId } from "./id";
import type { Holding, NewGoal, Plan } from "./types";
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

export function updatePlan(patch: Partial<Plan> | ((plan: Plan) => Partial<Plan>)): void {
  appStore.set((state) => ({
    ...state,
    plan: { ...state.plan, ...(typeof patch === "function" ? patch(state.plan) : patch) },
  }));
}

/** Adds a goal at the end of "My goals": goals keep the order they were added in. */
export function addGoal(goal: NewGoal, id: string = createId()): void {
  updatePlan((plan) => ({ goals: [...plan.goals, { ...goal, id } as Plan["goals"][number]] }));
}

export function removeGoal(id: string): void {
  updatePlan((plan) => ({ goals: plan.goals.filter((goal) => goal.id !== id) }));
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
