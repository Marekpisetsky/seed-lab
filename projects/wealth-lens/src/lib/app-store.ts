/**
 * The app's state: one plan shared by every screen. It lives in this
 * module's memory only:
 * nothing is written to localStorage, cookies or a server, so reloading the
 * page starts over from the example numbers. "Download my data" and "Load
 * my data" (lib/data-file.ts) are the only way to keep it.
 *
 * Shaped for React's `useSyncExternalStore`: `get` returns the same object
 * until something changes, and every change notifies all screens at once.
 */

import { regionOf } from "@seed-kit/detect.ts";
import { isPriceCountry } from "@seed-kit/inflation-rates.ts";
import { createId } from "./id";
import { resolveInvestment } from "./investment";
import { planCurrencyOf } from "./money";
import { STANDARD_ASSUMPTIONS, type AssumptionOverrides, type Investment, type NewGoal, type Plan } from "./types";
import { DEFAULT_PLAN } from "./validation";
import { whatIfAvailable, type WhatIfId } from "./what-if";

export interface AppState {
  plan: Plan;
  /** The "What if…?" applied to the whole screen, if any: a look, not part of the plan, never saved. */
  whatIf: WhatIfId | null;
}

export const INITIAL_STATE: AppState = { plan: DEFAULT_PLAN, whatIf: null };

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
  const investment = resolveInvestment(state.plan.investment, state.plan);
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

/**
 * "Reset to standard": the investment's own figures and the country's
 * inflation again. Custom growth keeps its number: it is step 3's, not an
 * option.
 */
export function resetAssumptions(): void {
  updatePlan((plan) => ({ assumptions: { ...STANDARD_ASSUMPTIONS, growth: plan.investment.kind === "custom" ? plan.assumptions.growth : null } }));
}

/**
 * "Rising prices in" (More options): the country's reference inflation
 * replaces any typed one. The currency follows it when it was the
 * previous country's own.
 */
export function setPricesOf(pricesOf: string): void {
  updatePlan((plan) => ({
    pricesOf,
    currency: plan.currency === planCurrencyOf(plan.pricesOf) ? (planCurrencyOf(pricesOf) ?? plan.currency) : plan.currency,
    assumptions: { ...plan.assumptions, inflation: null },
  }));
}

/** "Your amounts are in" (More options): the amounts stay as typed; only their currency changes. */
export function setCurrency(currency: string): void {
  updatePlan({ currency });
}

/**
 * A first visit starts in the country the browser's language names
 * ("es-MX": Mexico's prices, its way of writing numbers and its pesos),
 * when the app has its figures. Worked out on the device, never stored
 * or sent; nothing changes once the plan has been touched.
 */
export function startFromLanguage(language: string | undefined): void {
  const region = language ? regionOf(language) : null;
  if (region === null || appStore.get() !== INITIAL_STATE) return;
  const currency = planCurrencyOf(region);
  if (!isPriceCountry(region) && currency === null) return;
  appStore.set((state) => ({
    ...state,
    plan: { ...state.plan, ...(isPriceCountry(region) ? { pricesOf: region } : {}), ...(currency ? { currency } : {}) },
  }));
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

/** Optional goal edits, including a priority flag; money stays in the shared plan. */
export function updateGoal(id: string, change: (goal: Plan["goals"][number]) => Plan["goals"][number]): void {
  updatePlan((plan) => ({ goals: plan.goals.map((goal) => goal.id === id ? change(goal) : goal) }));
}

/** Replaces everything, e.g. with a loaded data file. */
export function replaceState(state: AppState): void {
  appStore.set(state);
}
