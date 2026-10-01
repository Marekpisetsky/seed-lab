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
  setHoldingReference,
  setHoldings,
  setInvestment,
  setPricesOf,
  setUploadedPrices,
  updatePlan,
} from "./app-store";
import type { Holding } from "./types";

const holding: Holding = {
  id: "1",
  ticker: "VWCE",
  quantity: 10,
  costBasis: 1000,
  currency: "EUR",
  currentPrice: null,
  priceSource: "auto",
  priceDate: null,
};

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
    expect(INITIAL_STATE.plan).toMatchObject({ invested: null, monthlyContribution: null, years: 20, investment: { kind: "asset", asset: "sp500" }, pricesOf: "NL", goals: [] });
    expect(INITIAL_STATE.plan.assumptions).toEqual({ growth: null, volatility: null, inflation: null });
  });

  it("updates one plan field and keeps the others", () => {
    updatePlan({ invested: 20_000, monthlyContribution: 500 });
    updatePlan((plan) => ({ monthlyContribution: (plan.monthlyContribution ?? 0) + 100 }));
    const { plan } = appStore.get();
    expect(plan).toEqual({ ...INITIAL_STATE.plan, invested: 20_000, monthlyContribution: 600 });
  });

  it("adds goals at the end and removes one without reordering the rest", () => {
    addGoal({ kind: "amount", amount: 100_000 }, "a");
    addGoal({ kind: "live", country: "PE", housing: true }, "b");
    addGoal({ kind: "monthly", amount: 1500, label: null }, "c");
    expect(appStore.get().plan.goals.map((goal) => goal.id)).toEqual(["a", "b", "c"]);
    removeGoal("b");
    expect(appStore.get().plan.goals).toEqual([
      { id: "a", kind: "amount", amount: 100_000 },
      { id: "c", kind: "monthly", amount: 1500, label: null },
    ]);
    addGoal({ kind: "buy", item: "used-car" }, "d");
    expect(appStore.get().plan.goals.map((goal) => goal.id)).toEqual(["a", "c", "d"]);
  });

  it("keeps holdings apart from the plan", () => {
    setHoldings([holding]);
    expect(appStore.get().holdings).toEqual([holding]);
    setHoldings((previous) => previous.filter((item) => item.id !== "1"));
    expect(appStore.get().holdings).toEqual([]);
    expect(appStore.get().plan).toBe(INITIAL_STATE.plan);
  });

  it("adds and removes uploaded prices per ticker", () => {
    const prices = { fileName: "x.csv", points: [{ time: "2026-09-25", close: 10 }] };
    setUploadedPrices("XYZ", prices);
    setUploadedPrices("ABC", prices);
    setUploadedPrices("XYZ", null);
    expect(appStore.get().uploadedPrices).toEqual({ ABC: prices });
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
    setAssumptions({ growth: 0.05 });
    setAssumptions({ volatility: 0.2 });
    expect(appStore.get().plan.assumptions).toEqual({ growth: 0.05, volatility: 0.2, inflation: null });
    resetAssumptions();
    expect(appStore.get().plan.assumptions).toEqual(INITIAL_STATE.plan.assumptions);
  });

  it("takes the country's inflation again when Prices of changes", () => {
    setAssumptions({ inflation: 0.05 });
    setPricesOf("BR");
    expect(appStore.get().plan).toMatchObject({ pricesOf: "BR", assumptions: { inflation: null } });
  });

  it("sets and clears what a holding grows like", () => {
    setHoldings([holding, { ...holding, id: "2", ticker: "XYZ" }]);
    setHoldingReference("2", "gold");
    expect(appStore.get().holdings[1].reference).toBe("gold");
    expect(appStore.get().holdings[0]).toBe(appStore.get().holdings[0]);
    setHoldingReference("2", null);
    expect("reference" in appStore.get().holdings[1]).toBe(false);
  });

  it("tells every screen about a change", () => {
    const listener = vi.fn();
    const unsubscribe = appStore.subscribe(listener);
    updatePlan({ withdrawalRate: 0.035 });
    expect(listener).toHaveBeenCalledTimes(1);
    unsubscribe();
  });
});
