import { describe, expect, it } from "vitest";
import { summarizeByCurrency } from "./finance";
import { headlineGain, planReady, startingCapital } from "./plan";
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

describe("startingCapital", () => {
  it("uses the EUR holdings once there are holdings", () => {
    const holdings = [holding({}), holding({ id: "u", currency: "USD", currentPrice: 500 })];
    expect(startingCapital(holdings, 50_000)).toEqual({ amount: 1200, source: "holdings" });
  });

  it("uses the first-use answer while there are no holdings", () => {
    expect(startingCapital([], 50_000)).toEqual({ amount: 50_000, source: "answer" });
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

describe("planReady", () => {
  it("waits for both amounts: 0 is an answer, an empty field is not", () => {
    expect(planReady({ invested: null, monthlyContribution: null }, [])).toBe(false);
    expect(planReady({ invested: 1000, monthlyContribution: null }, [])).toBe(false);
    expect(planReady({ invested: null, monthlyContribution: 200 }, [])).toBe(false);
    expect(planReady({ invested: 0, monthlyContribution: 0 }, [])).toBe(true);
  });

  it("takes holdings on My stocks as what the user has", () => {
    expect(planReady({ invested: null, monthlyContribution: 50 }, [holding({})])).toBe(true);
    expect(planReady({ invested: null, monthlyContribution: null }, [holding({})])).toBe(false);
  });

  it("counts an empty amount as 0 for the starting money", () => {
    expect(startingCapital([], null)).toEqual({ amount: 0, source: "answer" });
  });
});
