import { afterEach, describe, expect, it, vi } from "vitest";
import { appStore, INITIAL_STATE, replaceState, toggleWhatIf, updatePlan } from "./app-store";
import { keepInTab, restoreFromTab, TAB_KEY } from "./tab-memory";

class TabStorage {
  items = new Map<string, string>();
  getItem(key: string) {
    return this.items.get(key) ?? null;
  }
  setItem(key: string, value: string) {
    this.items.set(key, value);
  }
}

afterEach(() => {
  replaceState(INITIAL_STATE);
  vi.unstubAllGlobals();
});

describe("what you type, kept in this tab", () => {
  it("comes back when the page loads afresh, without the “What if…?”", () => {
    const tab = new TabStorage();
    vi.stubGlobal("window", { sessionStorage: tab });
    const stop = keepInTab();
    updatePlan({ invested: 20_000, monthlyContribution: 400, currency: "PEN" });
    toggleWhatIf("grow-more");
    stop();
    expect(JSON.parse(tab.getItem(TAB_KEY) ?? "{}").plan).toMatchObject({ invested: 20_000, monthlyContribution: 400, currency: "PEN" });
    // A fresh page: the store starts over.
    replaceState(INITIAL_STATE);
    expect(restoreFromTab()).toBe(true);
    expect(appStore.get().plan).toMatchObject({ invested: 20_000, monthlyContribution: 400, currency: "PEN" });
    expect(appStore.get().whatIf).toBeNull();
  });

  it("never replaces a plan already there, and does nothing without a tab memory or with a broken one", () => {
    const tab = new TabStorage();
    vi.stubGlobal("window", { sessionStorage: tab });
    tab.setItem(TAB_KEY, "not json");
    expect(restoreFromTab()).toBe(false);
    updatePlan({ invested: 5 });
    tab.setItem(TAB_KEY, JSON.stringify({ kind: "wealth-lens-data", version: 13, plan: { invested: 9 } }));
    expect(restoreFromTab()).toBe(false);
    expect(appStore.get().plan.invested).toBe(5);
    vi.stubGlobal("window", {
      get sessionStorage(): Storage {
        throw new Error("blocked");
      },
    });
    replaceState(INITIAL_STATE);
    expect(restoreFromTab()).toBe(false);
    expect(() => keepInTab()()).not.toThrow();
  });
});
