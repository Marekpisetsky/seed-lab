import { describe, expect, it } from "vitest";
import type { CountryCost } from "./cost-of-living";
import { summarizeByCurrency } from "./finance";
import { featuredCountries, goalProgress, hasStarted, headlineGain, startingCapital } from "./plan";
import type { Holding } from "./types";

const holding = (overrides: Partial<Holding>): Holding => ({
  id: "h",
  ticker: "T",
  quantity: 10,
  costBasis: 1000,
  currency: "EUR",
  currentPrice: 120,
  priceSource: "auto",
  priceDate: null,
  ...overrides,
});

describe("startingCapital / hasStarted", () => {
  it("uses the EUR holdings once there are holdings", () => {
    const holdings = [holding({}), holding({ id: "u", currency: "USD", currentPrice: 500 })];
    expect(startingCapital(holdings, 50_000)).toEqual({ amount: 1200, source: "holdings" });
    expect(hasStarted(holdings, null)).toBe(true);
  });

  it("uses the first-use answer while there are no holdings", () => {
    expect(startingCapital([], 50_000)).toEqual({ amount: 50_000, source: "answer" });
    expect(hasStarted([], 0)).toBe(true);
  });

  it("starts from nothing before any answer", () => {
    expect(startingCapital([], null)).toEqual({ amount: 0, source: "none" });
    expect(hasStarted([], null)).toBe(false);
  });
});

describe("goalProgress", () => {
  it("is the share of the goal reached, capped to 0-1", () => {
    expect(goalProgress(25_000, 100_000)).toBe(0.25);
    expect(goalProgress(150_000, 100_000)).toBe(1);
    expect(goalProgress(-5, 100)).toBe(0);
    expect(goalProgress(10, 0)).toBe(1);
  });
});

describe("headlineGain", () => {
  it("puts EUR first and lists other priced currencies", () => {
    const summaries = summarizeByCurrency([
      holding({ id: "a", currency: "USD", currentPrice: 150 }),
      holding({ id: "b" }),
      holding({ id: "c", currency: "GBP", currentPrice: null }),
    ]);
    const { main, others } = headlineGain(summaries);
    expect(main?.currency).toBe("EUR");
    expect(others.map((summary) => summary.currency)).toEqual(["USD"]);
  });

  it("falls back to another currency or nothing", () => {
    expect(headlineGain(summarizeByCurrency([holding({ currency: "USD" })])).main?.currency).toBe("USD");
    expect(headlineGain(summarizeByCurrency([holding({ currentPrice: null })])).main).toBeNull();
  });
});

describe("featuredCountries", () => {
  const rows = ["IN", "EG", "ID", "KE", "PH", "MA", "NL"].map((code) => ({ country: { code } as CountryCost }));

  it("shows the 5 cheapest plus the home country", () => {
    expect(featuredCountries(rows, "NL").map((row) => row.country.code)).toEqual(["IN", "EG", "ID", "KE", "PH", "NL"]);
  });

  it("does not repeat a home country that is already among the cheapest", () => {
    expect(featuredCountries(rows, "EG").map((row) => row.country.code)).toEqual(["IN", "EG", "ID", "KE", "PH"]);
  });

  it("ignores an unknown home country", () => {
    expect(featuredCountries(rows, "ZZ")).toHaveLength(5);
  });
});
