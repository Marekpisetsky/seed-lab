import { describe, expect, it } from "vitest";
import { DEFAULT_PLAN } from "./validation";
import { deleteLegacyData, hasLegacyData, readLegacyData, type LegacyStorage } from "./legacy-storage";

class MemoryStorage implements LegacyStorage {
  readonly data = new Map<string, string>();
  constructor(entries: Record<string, unknown> = {}) {
    for (const [key, value] of Object.entries(entries)) this.data.set(key, JSON.stringify(value));
  }
  get length() {
    return this.data.size;
  }
  key(index: number) {
    return [...this.data.keys()][index] ?? null;
  }
  getItem(key: string) {
    return this.data.get(key) ?? null;
  }
  removeItem(key: string) {
    this.data.delete(key);
  }
}

const holding = { id: "1", ticker: "VWCE", quantity: 10, costBasis: 1000, currency: "EUR", currentPrice: null };

describe("data saved by earlier versions", () => {
  it("is found and turned into today's plan", () => {
    const storage = new MemoryStorage({
      "wealth-lens:v1:holdings": [holding],
      "wealth-lens:v1:goal": { amount: 250_000, targetDate: null },
      "wealth-lens:v1:assumptions": { realReturn: 0.05, withdrawalRate: 0.035, monthlyContribution: 400, inflation: 0.02 },
      "wealth-lens:v1:fire": { housing: "own", homeCountry: "PE" },
      "wealth-lens:v1:uploaded-prices:XYZ": { fileName: "x.csv", points: [{ time: "2026-09-25", close: 3 }] },
      "other-app": 1,
    });
    expect(hasLegacyData(storage)).toBe(true);
    expect(readLegacyData(storage)).toEqual({
      plan: {
        ...DEFAULT_PLAN,
        // Not saved: 0, not the example numbers of a first visit.
        invested: 0,
        monthlyContribution: 400,
        goals: [{ id: "g1", kind: "amount", amount: 250_000 }],
        investment: { kind: "custom" },
        assumptions: { growth: { rate: 0.05, basis: "real" }, volatility: null, inflation: null },
        withdrawalRate: 0.035,
      },
      holdings: [{ ...holding, priceSource: "auto", priceDate: null }],
      uploadedPrices: { XYZ: { fileName: "x.csv", points: [{ time: "2026-09-25", close: 3 }] } },
    });
  });

  it("keeps the default investment when the old default growth (7 %) was used", () => {
    const storage = new MemoryStorage({
      "wealth-lens:v1:invested": 20_000,
      "wealth-lens:v1:assumptions": { realReturn: 0.07 },
    });
    expect(readLegacyData(storage)?.plan).toMatchObject({ invested: 20_000, investment: DEFAULT_PLAN.investment });
  });

  it("is nothing to load when the first questions were never answered", () => {
    const storage = new MemoryStorage({ "wealth-lens:v1:goal": { amount: 1 } });
    expect(hasLegacyData(storage)).toBe(true);
    expect(readLegacyData(storage)).toBeNull();
  });

  it("is deleted entirely, leaving other sites' data alone", () => {
    const storage = new MemoryStorage({ "wealth-lens:v1:holdings": [holding], "wealth-lens:v1:goal": {}, "other-app": 1 });
    deleteLegacyData(storage);
    expect([...storage.data.keys()]).toEqual(["other-app"]);
    expect(hasLegacyData(storage)).toBe(false);
  });

  it("copes with blocked or missing storage", () => {
    const blocked: LegacyStorage = {
      get length(): number {
        throw new DOMException("blocked", "SecurityError");
      },
      key: () => null,
      getItem: () => null,
      removeItem: () => {},
    };
    expect(hasLegacyData(blocked)).toBe(false);
    expect(hasLegacyData(null)).toBe(false);
    expect(readLegacyData(null)).toBeNull();
    expect(() => deleteLegacyData(blocked)).not.toThrow();
  });
});
