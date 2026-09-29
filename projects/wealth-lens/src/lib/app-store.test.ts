import { afterEach, describe, expect, it, vi } from "vitest";
import {
  appStore,
  createStore,
  hasStarted,
  INITIAL_STATE,
  replaceState,
  setHoldings,
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
  it("starts empty, with nothing answered", () => {
    expect(appStore.get()).toBe(INITIAL_STATE);
    expect(hasStarted(appStore.get())).toBe(false);
  });

  it("updates one plan field and keeps the others", () => {
    updatePlan({ invested: 20_000, monthlyContribution: 500 });
    updatePlan((plan) => ({ monthlyContribution: plan.monthlyContribution + 100 }));
    const { plan } = appStore.get();
    expect(plan).toEqual({ ...INITIAL_STATE.plan, invested: 20_000, monthlyContribution: 600 });
    // Numbers alone are not a start: the mission is.
    expect(hasStarted(appStore.get())).toBe(false);
    updatePlan({ mission: { kind: "stop-working" } });
    expect(hasStarted(appStore.get())).toBe(true);
  });

  it("starts with real example numbers and no mission", () => {
    expect(INITIAL_STATE.plan).toMatchObject({ invested: 1000, monthlyContribution: 200, mission: null });
  });

  it("counts as started once there are holdings", () => {
    setHoldings([holding]);
    expect(hasStarted(appStore.get())).toBe(true);
    setHoldings((previous) => previous.filter((item) => item.id !== "1"));
    expect(hasStarted(appStore.get())).toBe(false);
  });

  it("adds and removes uploaded prices per ticker", () => {
    const prices = { fileName: "x.csv", points: [{ time: "2026-09-25", close: 10 }] };
    setUploadedPrices("XYZ", prices);
    setUploadedPrices("ABC", prices);
    setUploadedPrices("XYZ", null);
    expect(appStore.get().uploadedPrices).toEqual({ ABC: prices });
  });

  it("tells every screen about a change", () => {
    const listener = vi.fn();
    const unsubscribe = appStore.subscribe(listener);
    updatePlan({ withdrawalRate: 0.035 });
    expect(listener).toHaveBeenCalledTimes(1);
    unsubscribe();
  });
});
