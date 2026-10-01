import { describe, expect, it } from "vitest";
import {
  DEFAULT_GOAL,
  DEFAULT_PLAN,
  isIsoDate,
  parseAssumptions,
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

  it("keeps what a holding grows like when it is an asset on the list", () => {
    expect(parseHoldings([{ ...valid, reference: "gold" }])?.[0].reference).toBe("gold");
    expect(parseHoldings([{ ...valid, reference: "silver" }])?.[0]).not.toHaveProperty("reference");
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
  it("accepts the kinds of investment", () => {
    expect(parseInvestment({ kind: "asset", asset: "bonds" })).toEqual({ kind: "asset", asset: "bonds" });
    expect(parseInvestment({ kind: "asset", asset: "savings" })).toEqual({ kind: "asset", asset: "savings" });
    expect(parseInvestment({ kind: "portfolio", extra: 1 })).toEqual({ kind: "portfolio" });
    expect(parseInvestment({ kind: "custom" })).toEqual({ kind: "custom" });
    // Versions 1 to 5 named an index this way.
    expect(parseInvestment({ kind: "index", index: "world" })).toEqual({ kind: "asset", asset: "world" });
  });

  it("rejects unknown assets and kinds, and silver or any other commodity", () => {
    expect(parseInvestment({ kind: "index", index: "dax" })).toBeNull();
    expect(parseInvestment({ kind: "asset", asset: "silver" })).toBeNull();
    expect(parseInvestment({ kind: "stock", id: "" })).toBeNull();
    expect(parseInvestment({ kind: "crypto" })).toBeNull();
    expect(parseInvestment("index")).toBeNull();
  });
});

describe("parseAssumptions", () => {
  it("keeps what the user changed and the standard for the rest", () => {
    expect(parseAssumptions({ growth: 0.06, volatility: 0.12, inflation: 0.03 })).toEqual({ growth: 0.06, volatility: 0.12, inflation: 0.03 });
    expect(parseAssumptions({ growth: -0.01 })).toEqual({ growth: -0.01, volatility: null, inflation: null });
  });

  it("reads version 6's growth, typed before or after rising prices, as the growth banks quote", () => {
    // Before rising prices: already the quoted growth.
    expect(parseAssumptions({ growth: { rate: 0.06, basis: "nominal" }, volatility: 0.12, inflation: 0.03 })).toEqual({ growth: 0.06, volatility: 0.12, inflation: 0.03 });
    // After rising prices: the quoted growth that gives it, with the file's own inflation…
    expect(parseAssumptions({ growth: { rate: 0.05, basis: "real" }, inflation: 0.03 }).growth).toBeCloseTo(1.05 * 1.03 - 1, 12);
    // …or its country's (the Netherlands' 2% by default, Brazil's 3%).
    expect(parseAssumptions({ growth: { rate: -0.01, basis: "real" } }).growth).toBeCloseTo(0.99 * 1.02 - 1, 12);
    expect(parseAssumptions({ growth: { rate: 0.05, basis: "real" } }, "BR").growth).toBeCloseTo(1.05 * 1.03 - 1, 12);
  });

  it("drops a bad field on its own", () => {
    expect(parseAssumptions({ growth: { rate: 0.06, basis: "gross" }, volatility: -0.1, inflation: 2 })).toEqual({ growth: null, volatility: null, inflation: null });
    expect(parseAssumptions({ growth: { rate: 5, basis: "real" }, volatility: 1.5 })).toEqual({ growth: null, volatility: null, inflation: null });
    expect(parseAssumptions({ growth: 5 })).toEqual({ growth: null, volatility: null, inflation: null });
    // Growth after rising prices that no quoted growth under 100% could give.
    expect(parseAssumptions({ growth: { rate: 0.95, basis: "real" }, inflation: 0.5 })).toEqual({ growth: null, volatility: null, inflation: 0.5 });
    expect(parseAssumptions("custom")).toEqual({ growth: null, volatility: null, inflation: null });
  });
});

describe("parsePlan", () => {
  const full = {
    invested: 20_000,
    monthlyContribution: 500,
    investment: { kind: "asset", asset: "nasdaq100" },
    years: 25,
    withdrawalRate: 0.035,
    pricesOf: "DE",
    assumptions: { growth: null, volatility: 0.2, inflation: 0.025 },
    goals: [
      { id: "a", kind: "live", country: "PE", housing: false },
      { id: "b", kind: "buy", item: "used-car" },
      { id: "c", kind: "buy-own", name: "Boat", amount: 15_000 },
      { id: "d", kind: "amount", amount: 100_000 },
      { id: "e", kind: "monthly", amount: 1500, label: null },
    ],
  };

  it("keeps a valid plan as it is", () => {
    expect(parsePlan(full)).toEqual(full);
  });

  it("falls back field by field without resetting the valid ones", () => {
    expect(
      parsePlan({
        ...full,
        invested: -5,
        withdrawalRate: 0,
        investment: { kind: "?" },
        pricesOf: "Atlantis",
        years: 2.5,
        goals: [...full.goals, { id: "x", kind: "amount", amount: 0 }],
      }),
    ).toEqual({
      ...full,
      // A bad amount in a file is 0, never a first visit's example value.
      invested: 0,
      withdrawalRate: DEFAULT_PLAN.withdrawalRate,
      investment: DEFAULT_PLAN.investment,
      pricesOf: "NL",
      years: DEFAULT_PLAN.years,
    });
  });

  it("reads years between 1 and 60 only", () => {
    expect(parsePlan({ ...full, years: 1 })?.years).toBe(1);
    expect(parsePlan({ ...full, years: 60 })?.years).toBe(60);
    expect(parsePlan({ ...full, years: 61 })?.years).toBe(20);
    expect(parsePlan({ ...full, years: 0 })?.years).toBe(20);
  });

  it("keeps the goals in their order, and drops broken and repeated ones", () => {
    const goals = (value: unknown[]) => parsePlan({ ...full, goals: value })?.goals;
    expect(goals([...full.goals].reverse())?.map((goal) => goal.id)).toEqual(["e", "d", "c", "b", "a"]);
    expect(goals([{ id: "a", kind: "buy-own", name: " A boat ", amount: 15_000 }])).toEqual([
      { id: "a", kind: "buy-own", name: "A boat", amount: 15_000 },
    ]);
    expect(goals([{ id: "a", kind: "monthly", amount: 900, label: " my mortgage " }])).toEqual([{ id: "a", kind: "monthly", amount: 900, label: "my mortgage" }]);
    // Earlier monthly kinds, "income" (version 4) and "spending", are the same goal.
    expect(goals([{ id: "a", kind: "income", amount: 900, name: "Rent" }])).toEqual([{ id: "a", kind: "monthly", amount: 900, label: "Rent" }]);
    expect(goals([{ id: "a", kind: "spending", amount: 700, label: "Food" }])).toEqual([{ id: "a", kind: "monthly", amount: 700, label: "Food" }]);
    expect(goals([{ id: "a", kind: "income", amount: 700, name: "" }])).toEqual([{ id: "a", kind: "monthly", amount: 700, label: null }]);
    expect(
      goals([
        { id: "a", kind: "amount", amount: 2e9 },
        { id: "b", kind: "live", country: "Portugal", housing: true },
        { id: "c", kind: "live", country: "PT" },
        { id: "d", kind: "buy", item: "../x" },
        { id: "e", kind: "buy-own", name: "", amount: 10 },
        { id: "f", kind: "monthly", amount: -1, label: null },
        { id: "", kind: "amount", amount: 10 },
        { id: "g", kind: "mission", amount: 10 },
        "boat",
      ]),
    ).toEqual([]);
    expect(goals([full.goals[3], { ...full.goals[4], id: "d" }])).toEqual([full.goals[3]]);
    expect(goals(Array.from({ length: 80 }, (_, index) => ({ id: `g${index}`, kind: "amount", amount: 1000 + index })))).toHaveLength(50);
  });

  it("turns a version 1 goal into a goal: the goal country, or else the euro goal", () => {
    const v1 = { invested: 20_000, monthlyContribution: 500, goal: { amount: 250_000, targetDate: null }, goalCountry: null };
    expect(parsePlan(v1)?.goals).toEqual([{ id: "g1", kind: "amount", amount: 250_000 }]);
    expect(parsePlan({ ...v1, goalCountry: "PT" })?.goals).toEqual([{ id: "g1", kind: "live", country: "PT", housing: true }]);
    expect(parsePlan({ invested: 1 })?.goals).toEqual([]);
  });

  it("turns a version 2 pinned connection into the first goal, and own items into the next ones", () => {
    const v2 = (pinned: string | null, customConnections: unknown[] = [], extra: Record<string, unknown> = {}) =>
      parsePlan({ invested: 1, pinned, customConnections, ...extra })?.goals;
    expect(v2("life:stop-working", [], { homeCountry: "ES", housing: "own" })).toEqual([{ id: "g1", kind: "live", country: "ES", housing: false }]);
    expect(v2("country:PT")).toEqual([{ id: "g1", kind: "live", country: "PT", housing: true }]);
    expect(v2("buy:used-car")).toEqual([{ id: "g1", kind: "buy", item: "used-car" }]);
    const boat = { id: "b1", name: "Boat", kind: "buy", amount: 15_000 };
    const rent = { id: "k1", name: "Rent", kind: "live", amount: 900 };
    expect(v2("custom:b1", [rent, boat])).toEqual([
      { id: "g1", kind: "buy-own", name: "Boat", amount: 15_000 },
      { id: "g2", kind: "monthly", amount: 900, label: "Rent" },
    ]);
    const goal = { id: "goal", name: "My goal", kind: "buy", amount: 250_000 };
    expect(v2("custom:goal", [goal])).toEqual([{ id: "g1", kind: "amount", amount: 250_000 }]);
    // Working 4 days, half-time, "the app chose": nothing a goal can say without assuming a home.
    expect(v2("life:four-days")).toEqual([]);
    expect(v2(null)).toEqual([]);
  });

  it("reads the years of versions 2 and 3, called horizonYears", () => {
    expect(parsePlan({ invested: 1, horizonYears: 35 })?.years).toBe(35);
    expect(parsePlan({ invested: 1, horizonYears: null })?.years).toBe(20);
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
