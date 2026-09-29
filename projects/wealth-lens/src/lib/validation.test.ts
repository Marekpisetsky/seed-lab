import { describe, expect, it } from "vitest";
import {
  DEFAULT_GOAL,
  DEFAULT_PLAN,
  isIsoDate,
  parseGoal,
  parseHoldings,
  parseInvestment,
  parsePlan,
  parseUploadedPrices,
} from "./validation";

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
    expect(parsed).toEqual([{ ...valid, priceSource: "auto", priceDate: null }]);
  });

  it("reads holdings saved before automatic prices existed", () => {
    // A typed price stays manual; a missing one is filled automatically.
    expect(parseHoldings([{ ...valid, currentPrice: 180 }])?.[0]).toMatchObject({ priceSource: "manual", priceDate: null });
    expect(parseHoldings([valid])?.[0]).toMatchObject({ priceSource: "auto", priceDate: null });
  });

  it("keeps the date of an automatic price only", () => {
    const auto = { ...valid, currentPrice: 180, priceSource: "auto", priceDate: "2026-09-25" };
    expect(parseHoldings([auto])?.[0].priceDate).toBe("2026-09-25");
    expect(parseHoldings([{ ...auto, priceSource: "manual" }])?.[0].priceDate).toBeNull();
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

describe("parseInvestment", () => {
  it("accepts the four kinds of investment", () => {
    expect(parseInvestment({ kind: "index", index: "world" })).toEqual({ kind: "index", index: "world" });
    expect(parseInvestment({ kind: "stock", id: "NVDA" })).toEqual({ kind: "stock", id: "NVDA" });
    expect(parseInvestment({ kind: "portfolio", extra: 1 })).toEqual({ kind: "portfolio" });
    expect(parseInvestment({ kind: "custom", realReturn: 0.05 })).toEqual({ kind: "custom", realReturn: 0.05 });
  });

  it("rejects unknown indexes, kinds and rates", () => {
    expect(parseInvestment({ kind: "index", index: "dax" })).toBeNull();
    expect(parseInvestment({ kind: "stock", id: "" })).toBeNull();
    expect(parseInvestment({ kind: "custom", realReturn: 3 })).toBeNull();
    expect(parseInvestment({ kind: "crypto" })).toBeNull();
    expect(parseInvestment("index")).toBeNull();
  });
});

describe("parsePlan", () => {
  const full = {
    invested: 20_000,
    monthlyContribution: 500,
    goal: { amount: 250_000, targetDate: null },
    goalCountry: "PT",
    investment: { kind: "index", index: "nasdaq100" },
    withdrawalRate: 0.035,
    inflation: 0.025,
    housing: "own",
    homeCountry: "PE",
  };

  it("keeps a valid plan as it is", () => {
    expect(parsePlan(full)).toEqual(full);
  });

  it("falls back field by field without resetting the valid ones", () => {
    expect(
      parsePlan({ ...full, invested: -5, withdrawalRate: 0, investment: { kind: "?" }, goalCountry: "Portugal", housing: "castle" }),
    ).toEqual({
      ...full,
      invested: null,
      withdrawalRate: DEFAULT_PLAN.withdrawalRate,
      investment: DEFAULT_PLAN.investment,
      goalCountry: null,
      housing: "rent",
    });
  });

  it("rejects non-objects", () => {
    expect(parsePlan(null)).toBeNull();
    expect(parsePlan([])).toBeNull();
  });
});

describe("parseUploadedPrices", () => {
  it("keeps valid points and rejects empty series", () => {
    expect(
      parseUploadedPrices({
        fileName: "vwce.csv",
        points: [{ time: "2026-09-25", close: 131.5 }, { time: "bad", close: 1 }, { time: "2026-09-26", close: -1 }],
      }),
    ).toEqual({ fileName: "vwce.csv", points: [{ time: "2026-09-25", close: 131.5 }] });
    expect(parseUploadedPrices({ fileName: "x.csv", points: [] })).toBeNull();
    expect(parseUploadedPrices(null)).toBeNull();
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
