import { afterEach, describe, expect, it, vi } from "vitest";
import {
  addGoal,
  appStore,
  createStore,
  INITIAL_STATE,
  removeGoal,
  replaceState,
  resetAssumptions,
  setAssumptions,
  setInvestment,
  setPricesOf,
  updatePlan,
} from "./app-store";
afterEach(() => replaceState(INITIAL_STATE));

describe("createStore", () => {
  it("returns the same object until something changes, and notifies every subscriber", () => {
    const store = createStore({ count: 0 });
    const first = store.get();
    const a = vi.fn();
    const b = vi.fn();
    store.subscribe(a);
    const unsubscribe = store.subscribe(b);
    expect(store.get()).toBe(first);
    store.set((previous) => ({ count: previous.count + 1 }));
    expect(store.get()).toEqual({ count: 1 });
    expect(a).toHaveBeenCalledTimes(1);
    expect(b).toHaveBeenCalledTimes(1);
    unsubscribe();
    store.set({ count: 2 });
    expect(b).toHaveBeenCalledTimes(1);
  });

  it("does not notify when an update returns the same value", () => {
    const store = createStore({ count: 0 });
    const listener = vi.fn();
    store.subscribe(listener);
    store.set((previous) => previous);
    expect(listener).not.toHaveBeenCalled();
  });

  it("renders the initial value on the server, whatever happens in memory", () => {
    const store = createStore(1);
    store.set(2);
    expect(store.getServerSnapshot()).toBe(1);
  });
});

describe("the shared app state", () => {
  it("starts with the amounts empty, to be typed, 20 years and no goals", () => {
    expect(appStore.get()).toBe(INITIAL_STATE);
    expect(INITIAL_STATE.plan).toMatchObject({ invested: null, monthlyContribution: null, years: 20, investment: { kind: "custom" }, pricesOf: "NL", goals: [] });
    // Step 3 starts at Custom growth of 5 %; nothing in More options is changed.
    expect(INITIAL_STATE.plan.assumptions).toEqual({ growth: 0.05, volatility: null, inflation: null });
  });

  it("updates one plan field and keeps the others", () => {
    updatePlan({ invested: 20_000, monthlyContribution: 500 });
    updatePlan((plan) => ({ monthlyContribution: (plan.monthlyContribution ?? 0) + 100 }));
    const { plan } = appStore.get();
    expect(plan).toEqual({ ...INITIAL_STATE.plan, invested: 20_000, monthlyContribution: 600 });
  });

  it("adds goals at the end and removes one without reordering the rest", () => {
    addGoal({ kind: "amount", amount: 100_000 }, "a");
    addGoal({ kind: "live", country: "PE" }, "b");
    addGoal({ kind: "monthly", amount: 1500, label: null }, "c");
    expect(appStore.get().plan.goals.map((goal) => goal.id)).toEqual(["a", "b", "c"]);
    removeGoal("b");
    expect(appStore.get().plan.goals).toEqual([
      { id: "a", kind: "amount", amount: 100_000 },
      { id: "c", kind: "monthly", amount: 1500, label: null },
    ]);
    addGoal({ kind: "buy-own", name: "A car", amount: 20_000 }, "d");
    expect(appStore.get().plan.goals.map((goal) => goal.id)).toEqual(["a", "c", "d"]);
  });

  it("fills in the standard figures of a new choice, keeping a typed inflation", () => {
    setAssumptions({ growth: 0.05, volatility: 0.1, inflation: 0.03 });
    setInvestment({ kind: "asset", asset: "gold" });
    expect(appStore.get().plan).toMatchObject({
      investment: { kind: "asset", asset: "gold" },
      assumptions: { growth: null, volatility: null, inflation: 0.03 },
    });
  });

  it("resets every changed assumption to the standard one", () => {
    setInvestment({ kind: "asset", asset: "sp500" });
    setAssumptions({ growth: 0.05 });
    setAssumptions({ volatility: 0.2 });
    expect(appStore.get().plan.assumptions).toEqual({ growth: 0.05, volatility: 0.2, inflation: null });
    resetAssumptions();
    expect(appStore.get().plan.assumptions).toEqual({ growth: null, volatility: null, inflation: null });
  });

  it("keeps step 3's number when Custom growth is reset: only More options goes back", () => {
    setAssumptions({ volatility: 0.2, inflation: 0.03 });
    resetAssumptions();
    expect(appStore.get().plan.assumptions).toEqual(INITIAL_STATE.plan.assumptions);
  });

  it("takes the country's inflation again when Rising prices in changes", () => {
    setAssumptions({ inflation: 0.05 });
    setPricesOf("BR");
    expect(appStore.get().plan).toMatchObject({ pricesOf: "BR", assumptions: { inflation: null } });
  });

  it("tells every screen about a change", () => {
    const listener = vi.fn();
    const unsubscribe = appStore.subscribe(listener);
    updatePlan({ withdrawalRate: 0.035 });
    expect(listener).toHaveBeenCalledTimes(1);
    unsubscribe();
  });
});
