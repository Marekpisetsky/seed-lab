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

import type { AssetId } from "./assets";
import { priceHoldings } from "./auto-price";
import { createId } from "./id";
import { resolveInvestment } from "./investment";
import { STANDARD_ASSUMPTIONS, type AssumptionOverrides, type Holding, type Investment, type NewGoal, type Plan } from "./types";
import { DEFAULT_PLAN, type UploadedPrices } from "./validation";
import { whatIfAvailable, type WhatIfId } from "./what-if";

export interface AppState {
  plan: Plan;
  holdings: readonly Holding[];
  /** Price files uploaded for tickers without downloaded prices, keyed by ticker. */
  uploadedPrices: Readonly<Record<string, UploadedPrices>>;
  /** The "What if…?" applied to the whole screen, if any: a look, not part of the plan, never saved. */
  whatIf: WhatIfId | null;
}

export const INITIAL_STATE: AppState = { plan: DEFAULT_PLAN, holdings: [], uploadedPrices: {}, whatIf: null };

export type Updater<T> = T | ((previous: T) => T);

export interface Store<T> {
  get(): T;
  /** What the static HTML is rendered with: the initial state. */
  getServerSnapshot(): T;
  set(next: Updater<T>): void;
  subscribe(listener: () => void): () => void;
}

/** `settle` fixes up every new value before it is kept (the app's: a "What if…?" that no longer applies goes). */
export function createStore<T>(initial: T, settle: (value: T) => T = (value) => value): Store<T> {
  let value = initial;
  const listeners = new Set<() => void>();
  return {
    get: () => value,
    getServerSnapshot: () => initial,
    set(next) {
      const updated = settle(typeof next === "function" ? (next as (previous: T) => T)(value) : next);
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

/**
 * A "What if…?" the plan can no longer take (five more years past 60, a bad
 * decade once the money has no ups and downs) is taken away, not kept
 * waiting: going back to 50 years must not bring it back on its own.
 */
function withWhatIfThatApplies(state: AppState): AppState {
  if (state.whatIf === null) return state;
  const holdings = priceHoldings(state.holdings, state.uploadedPrices);
  const investment = resolveInvestment(state.plan.investment, holdings, state.plan);
  return whatIfAvailable(state.whatIf, state.plan.years, investment) ? state : { ...state, whatIf: null };
}

export const appStore = createStore<AppState>(INITIAL_STATE, withWhatIfThatApplies);

export function updatePlan(patch: Partial<Plan> | ((plan: Plan) => Partial<Plan>)): void {
  appStore.set((state) => ({
    ...state,
    plan: { ...state.plan, ...(typeof patch === "function" ? patch(state.plan) : patch) },
  }));
}

/**
 * Chooses what the plan invests in. Its standard growth and swings come
 * with it: growth or swings the user typed for the previous choice are
 * dropped (their own inflation is kept: it is about prices, not the choice).
 */
export function setInvestment(investment: Investment): void {
  updatePlan((plan) => ({ investment, assumptions: { ...plan.assumptions, growth: null, volatility: null } }));
}

/** Changes some of the assumptions; the rest keep their value. */
export function setAssumptions(patch: Partial<AssumptionOverrides>): void {
  updatePlan((plan) => ({ assumptions: { ...plan.assumptions, ...patch } }));
}

/** "Reset to standard": the investment's own figures and the country's inflation again. */
export function resetAssumptions(): void {
  updatePlan({ assumptions: STANDARD_ASSUMPTIONS });
}

/** "Prices of": the country's reference inflation replaces any typed one. */
export function setPricesOf(pricesOf: string): void {
  updatePlan((plan) => ({ pricesOf, assumptions: { ...plan.assumptions, inflation: null } }));
}

/** What a holding grows like in My portfolio; `null` goes back to what its ticker says. */
export function setHoldingReference(id: string, reference: AssetId | null): void {
  setHoldings((holdings) =>
    holdings.map((holding) => {
      if (holding.id !== id) return holding;
      const next = { ...holding };
      if (reference) next.reference = reference;
      else delete next.reference;
      return next;
    }),
  );
}

/** One "What if…?" at a time: tapping another switches to it, tapping the one applied takes it away. */
export function toggleWhatIf(id: WhatIfId): void {
  appStore.set((state) => ({ ...state, whatIf: state.whatIf === id ? null : id }));
}

export function clearWhatIf(): void {
  appStore.set((state) => (state.whatIf === null ? state : { ...state, whatIf: null }));
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
