import { describe, expect, it } from "vitest";
import { createPersistentStore } from "./persistent-store";
import {
  DEFAULT_ASSUMPTIONS,
  DEFAULT_FIRE_SETTINGS,
  DEFAULT_GOAL,
  isIsoDate,
  isStorageWritable,
  parseAssumptions,
  parseFireSettings,
  parseGoal,
  parseHoldings,
  readValue,
  writeValue,
  type KeyValueStorage,
} from "./storage";

class MemoryStorage implements KeyValueStorage {
  readonly data = new Map<string, string>();
  getItem(key: string) {
    return this.data.get(key) ?? null;
  }
  setItem(key: string, value: string) {
    this.data.set(key, value);
  }
  removeItem(key: string) {
    this.data.delete(key);
  }
}

/** Behaves like localStorage with cookies/site data blocked: every call throws. */
const blockedStorage: KeyValueStorage = {
  getItem() {
    throw new DOMException("blocked", "SecurityError");
  },
  setItem() {
    throw new DOMException("blocked", "SecurityError");
  },
  removeItem() {
    throw new DOMException("blocked", "SecurityError");
  },
};

/** Readable but full: writes throw QuotaExceededError. */
class FullStorage extends MemoryStorage {
  override setItem(): void {
    throw new DOMException("full", "QuotaExceededError");
  }
}

const parseNumber = (value: unknown) => (typeof value === "number" ? value : null);

describe("readValue", () => {
  it("returns the fallback when there is no storage (server render)", () => {
    expect(readValue(null, "k", parseNumber, 7)).toBe(7);
  });

  it("returns the fallback when the key is empty", () => {
    expect(readValue(new MemoryStorage(), "k", parseNumber, 7)).toBe(7);
  });

  it("returns the fallback when storage access throws", () => {
    expect(readValue(blockedStorage, "k", parseNumber, 7)).toBe(7);
  });

  it("returns the fallback for corrupted JSON", () => {
    const storage = new MemoryStorage();
    storage.setItem("k", "{not json");
    expect(readValue(storage, "k", parseNumber, 7)).toBe(7);
  });

  it("returns the fallback when the parser rejects the value", () => {
    const storage = new MemoryStorage();
    storage.setItem("k", JSON.stringify("a string"));
    expect(readValue(storage, "k", parseNumber, 7)).toBe(7);
  });

  it("round-trips a value written with writeValue", () => {
    const storage = new MemoryStorage();
    expect(writeValue(storage, "k", 42)).toBe(true);
    expect(readValue(storage, "k", parseNumber, 7)).toBe(42);
  });
});

describe("writeValue / isStorageWritable", () => {
  it("reports failure instead of throwing when storage is blocked or full", () => {
    expect(writeValue(blockedStorage, "k", 1)).toBe(false);
    expect(writeValue(new FullStorage(), "k", 1)).toBe(false);
    expect(writeValue(null, "k", 1)).toBe(false);
  });

  it("detects whether storage accepts writes", () => {
    expect(isStorageWritable(new MemoryStorage())).toBe(true);
    expect(isStorageWritable(blockedStorage)).toBe(false);
    expect(isStorageWritable(new FullStorage())).toBe(false);
    expect(isStorageWritable(null)).toBe(false);
  });
});

describe("parseHoldings", () => {
  const valid = {
    id: "1",
    ticker: "AAPL",
    quantity: 2,
    costBasis: 300,
    currency: "USD",
    currentPrice: null,
  };

  it("accepts valid holdings", () => {
    expect(parseHoldings([valid, { ...valid, id: "2", currentPrice: 180 }])).toHaveLength(2);
  });

  it("drops invalid entries but keeps the valid ones", () => {
    const parsed = parseHoldings([
      valid,
      { ...valid, id: "bad-quantity", quantity: -1 },
      { ...valid, id: "bad-currency", currency: "euro" },
      { ...valid, id: "missing-price", currentPrice: undefined },
      "not an object",
    ]);
    expect(parsed).toEqual([valid]);
  });

  it("rejects non-arrays", () => {
    expect(parseHoldings({})).toBeNull();
  });
});

describe("parseGoal", () => {
  it("keeps a valid goal", () => {
    expect(parseGoal({ amount: 250_000, targetDate: "2040-01-31" })).toEqual({
      amount: 250_000,
      targetDate: "2040-01-31",
    });
  });

  it("falls back per field", () => {
    expect(parseGoal({ amount: "lots", targetDate: "2040-02-30" })).toEqual({
      amount: DEFAULT_GOAL.amount,
      targetDate: null,
    });
  });
});

describe("parseAssumptions", () => {
  it("fills missing or invalid fields with defaults without resetting valid ones", () => {
    expect(parseAssumptions({ realReturn: 0.05, withdrawalRate: 0, inflation: "2%" })).toEqual({
      ...DEFAULT_ASSUMPTIONS,
      realReturn: 0.05,
    });
  });

  it("rejects non-objects", () => {
    expect(parseAssumptions(null)).toBeNull();
    expect(parseAssumptions([])).toBeNull();
  });
});

describe("parseFireSettings", () => {
  it("keeps valid settings and falls back per field", () => {
    expect(parseFireSettings({ capitalOverride: 250_000, housing: "own" })).toEqual({
      capitalOverride: 250_000,
      housing: "own",
    });
    expect(parseFireSettings({ capitalOverride: -5, housing: "castle" })).toEqual(DEFAULT_FIRE_SETTINGS);
    expect(parseFireSettings("nope")).toBeNull();
  });
});

describe("isIsoDate", () => {
  it("accepts real calendar dates only", () => {
    expect(isIsoDate("2024-02-29")).toBe(true);
    expect(isIsoDate("2023-02-29")).toBe(false);
    expect(isIsoDate("2024-2-1")).toBe(false);
    expect(isIsoDate(20240201)).toBe(false);
  });
});

describe("createPersistentStore", () => {
  it("starts from stored data and persists updates", () => {
    const storage = new MemoryStorage();
    storage.setItem("n", "5");
    const store = createPersistentStore({ key: "n", parse: parseNumber, fallback: 0, storage: () => storage });

    expect(store.get()).toBe(5);
    store.set((previous) => previous + 1);
    expect(store.get()).toBe(6);
    expect(storage.getItem("n")).toBe("6");
  });

  it("keeps working in memory when storage is blocked", () => {
    const store = createPersistentStore({
      key: "n",
      parse: parseNumber,
      fallback: 0,
      storage: () => blockedStorage,
    });

    expect(store.get()).toBe(0);
    store.set(3);
    expect(store.get()).toBe(3);
  });

  it("returns a stable reference until the value changes", () => {
    const storage = new MemoryStorage();
    storage.setItem("list", "[1,2]");
    const store = createPersistentStore({
      key: "list",
      parse: (value: unknown) => (Array.isArray(value) ? (value as number[]) : null),
      fallback: [] as number[],
      storage: () => storage,
    });
    expect(store.get()).toBe(store.get());
  });

  it("notifies subscribers on every write", () => {
    const store = createPersistentStore({ key: "n", parse: parseNumber, fallback: 0, storage: () => null });
    let calls = 0;
    const unsubscribe = store.subscribe(() => calls++);
    store.set(1);
    store.set(2);
    unsubscribe();
    store.set(3);
    expect(calls).toBe(2);
  });

  it("renders the fallback on the server", () => {
    const storage = new MemoryStorage();
    storage.setItem("n", "9");
    const store = createPersistentStore({ key: "n", parse: parseNumber, fallback: 0, storage: () => storage });
    expect(store.getServerSnapshot()).toBe(0);
  });
});
