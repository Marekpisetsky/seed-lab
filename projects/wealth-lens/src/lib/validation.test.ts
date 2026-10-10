import { describe, expect, it } from "vitest";
import {
  DEFAULT_GOAL,
  DEFAULT_PLAN,
  isIsoDate,
  GROWTH_LIMITS,
  parseAssumptions,
  parseGoal,
  parseInvestment,
  parsePlan,
  type Notices,
} from "./validation";

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
    expect(parseInvestment({ kind: "custom" })).toEqual({ kind: "custom" });
    // Versions 1 to 5 named an index this way.
    expect(parseInvestment({ kind: "index", index: "sp500" })).toEqual({ kind: "asset", asset: "sp500" });
  });

  it("reads what the app no longer offers as US stocks, with a notice", () => {
    const said = (value: unknown) => {
      const notices: Parameters<typeof parseInvestment>[1] = [];
      return { investment: parseInvestment(value, notices), codes: notices.map((notice) => notice.code) };
    };
    // World stocks and the Nasdaq-100: no open data.
    expect(said({ kind: "index", index: "world" })).toEqual({ investment: { kind: "asset", asset: "sp500" }, codes: ["series-retired"] });
    expect(said({ kind: "asset", asset: "nasdaq100" })).toEqual({ investment: { kind: "asset", asset: "sp500" }, codes: ["series-retired"] });
    // A single stock (version 5) and My portfolio (versions 6 to 10).
    expect(said({ kind: "stock", id: "NVDA" })).toEqual({ investment: { kind: "asset", asset: "sp500" }, codes: ["stocks-now-us"] });
    expect(said({ kind: "portfolio", extra: 1 })).toEqual({ investment: { kind: "asset", asset: "sp500" }, codes: ["portfolio-retired"] });
  });

  it("rejects unknown assets and kinds, and silver or any other commodity", () => {
    expect(parseInvestment({ kind: "index", index: "dax" })).toBeNull();
    expect(parseInvestment({ kind: "asset", asset: "silver" })).toBeNull();
    expect(parseInvestment({ kind: "crypto" })).toBeNull();
    expect(parseInvestment("index")).toBeNull();
  });
});

describe("parseAssumptions", () => {
  it("keeps what the user changed and the standard for the rest", () => {
    expect(parseAssumptions({ growth: 0.06, volatility: 0.12, inflation: 0.03 })).toEqual({ growth: 0.06, volatility: 0.12, inflation: 0.03 });
    expect(parseAssumptions({ growth: -0.01 })).toEqual({ growth: -0.01, volatility: null, inflation: null });
  });

  it("reads earlier versions' growth as growth after rising prices", () => {
    // Version 6, after rising prices: as it is.
    expect(parseAssumptions({ growth: { rate: -0.01, basis: "real" } }, "NL", 6).growth).toBe(-0.01);
    // Version 6 before rising prices, and version 7's one number (as banks quote it): after them, with the file's own inflation…
    expect(parseAssumptions({ growth: { rate: 0.06, basis: "nominal" }, volatility: 0.12, inflation: 0.03 }, "NL", 6)).toEqual({ growth: 1.06 / 1.03 - 1, volatility: 0.12, inflation: 0.03 });
    expect(parseAssumptions({ growth: 0.06, inflation: 0.03 }, "NL", 7).growth).toBeCloseTo(1.06 / 1.03 - 1, 12);
    // …or its country's (the Netherlands' 2% by default, Brazil's 3%).
    expect(parseAssumptions({ growth: 0.05 }, "NL", 7).growth).toBeCloseTo(1.05 / 1.02 - 1, 12);
    expect(parseAssumptions({ growth: 0.05 }, "BR", 7).growth).toBeCloseTo(1.05 / 1.03 - 1, 12);
    // Version 8: the number is already after rising prices.
    expect(parseAssumptions({ growth: 0.05 }, "BR", 8).growth).toBe(0.05);
  });

  it("keeps a growth from −50% to 500% a year, the field's range, and nothing past it", () => {
    for (const growth of [-0.5, 0, 0.7, 5]) expect(parseAssumptions({ growth }).growth).toBe(growth);
    for (const growth of [-0.51, 5.01, Infinity]) expect(parseAssumptions({ growth }).growth).toBeNull();
    expect(GROWTH_LIMITS).toEqual({ min: -0.5, max: 5 });
  });

  it("drops a bad field on its own", () => {
    expect(parseAssumptions({ growth: { rate: 0.06, basis: "gross" }, volatility: -0.1, inflation: 2 })).toEqual({ growth: null, volatility: null, inflation: null });
    expect(parseAssumptions({ growth: { rate: 5.5, basis: "real" }, volatility: 1.5 })).toEqual({ growth: null, volatility: null, inflation: null });
    expect(parseAssumptions({ growth: 5.5 })).toEqual({ growth: null, volatility: null, inflation: null });
    // Growth before rising prices that would be over 500% after them (500% with prices falling 9%: 559%): none.
    expect(parseAssumptions({ growth: 5, inflation: -0.09 }, "NL", 7)).toEqual({ growth: null, volatility: null, inflation: -0.09 });
    expect(parseAssumptions("custom")).toEqual({ growth: null, volatility: null, inflation: null });
  });
});

describe("parsePlan", () => {
  const full = {
    invested: 20_000,
    monthlyContribution: 500,
    investment: { kind: "asset", asset: "gold" },
    years: 25,
    withdrawalRate: 0.035,
    pricesOf: "DE",
    currency: "PEN",
    assumptions: { growth: null, volatility: 0.2, inflation: 0.025 },
    goals: [
      { id: "a", kind: "live", country: "PE" },
      { id: "c", kind: "buy-own", name: "Boat", amount: 15_000 },
      { id: "d", kind: "amount", amount: 100_000 },
      { id: "e", kind: "monthly", amount: 1500, label: null },
    ],
  };

  it("keeps a valid plan as it is", () => {
    expect(parsePlan(full)).toEqual(full);
  });

  it("keeps a withdrawal rate the user chose, and turns the old 4 % default into the data's rate", () => {
    expect(DEFAULT_PLAN.withdrawalRate).toBeNull();
    expect(parsePlan({ ...full, withdrawalRate: 0.035 }, [], 13)?.withdrawalRate).toBe(0.035);
    expect(parsePlan({ ...full, withdrawalRate: 0.04 }, [], 13)?.withdrawalRate).toBe(0.04);
    // Before version 13 every plan started at 4 %: nobody could tell it from a choice.
    expect(parsePlan({ ...full, withdrawalRate: 0.04 }, [], 12)?.withdrawalRate).toBeNull();
    expect(parsePlan({ ...full, withdrawalRate: 0.045 }, [], 12)?.withdrawalRate).toBe(0.045);
    expect(parsePlan({ ...full, withdrawalRate: null }, [], 13)?.withdrawalRate).toBeNull();
    expect(parsePlan({ ...full, withdrawalRate: -1 }, [], 13)?.withdrawalRate).toBeNull();
  });

  it("keeps the plan's currency, or takes euros: files before version 12, and a currency without official rates", () => {
    expect(parsePlan({ ...full, currency: "JPY" })?.currency).toBe("JPY");
    expect(parsePlan({ ...full, currency: undefined })?.currency).toBe("EUR");
    const notices: Notices = [];
    expect(parsePlan({ ...full, currency: "XXX" }, notices)?.currency).toBe("EUR");
    expect(notices).toContainEqual({ code: "currency-unknown" });
    // A currency with a rate in some year, though not the prices' year (the yearly update can do that), stays.
    expect(parsePlan({ ...full, currency: "MMK" })?.currency).toBe("MMK");
    expect(parsePlan({ ...full, currency: 42 })?.currency).toBe("EUR");
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
    expect(goals([...full.goals].reverse())?.map((goal) => goal.id)).toEqual(["e", "d", "c", "a"]);
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
        { id: "a", kind: "amount", amount: 2e15 },
        { id: "b", kind: "live", country: "Portugal", housing: true },
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
    expect(parsePlan({ ...v1, goalCountry: "PT" })?.goals).toEqual([{ id: "g1", kind: "live", country: "PT" }]);
    expect(parsePlan({ invested: 1 })?.goals).toEqual([]);
  });

  it("turns a version 2 pinned connection into the first goal, and own items into the next ones", () => {
    const v2 = (pinned: string | null, customConnections: unknown[] = [], extra: Record<string, unknown> = {}) =>
      parsePlan({ invested: 1, pinned, customConnections, ...extra })?.goals;
    expect(v2("life:stop-working", [], { homeCountry: "ES", housing: "own" })).toEqual([{ id: "g1", kind: "live", country: "ES" }]);
    expect(v2("country:PT")).toEqual([{ id: "g1", kind: "live", country: "PT" }]);
    // A thing of the old price list: the user gives their own price now.
    expect(v2("buy:used-car")).toEqual([]);
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

describe("isIsoDate", () => {
  it("accepts real calendar dates only", () => {
    expect(isIsoDate("2024-02-29")).toBe(true);
    expect(isIsoDate("2023-02-29")).toBe(false);
    expect(isIsoDate("2024-2-1")).toBe(false);
    expect(isIsoDate(20240201)).toBe(false);
  });
});
