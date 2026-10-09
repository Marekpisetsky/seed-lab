import { describe, expect, it } from "vitest";
import { EN, getI18n } from "@/i18n";
import { problemText } from "./problems";
import { INITIAL_STATE, type AppState } from "./app-store";
import { calculate } from "./calculator";
import { dataFileName, parseDataFile, serializeState } from "./data-file";
import { futureValueWithContributions } from "./finance";
import { resolveInvestment } from "./investment";
import { STANDARD_ASSUMPTIONS } from "./types";
import { FORMER_CUSTOM_VOLATILITY } from "./validation";

const state: AppState = {
  plan: {
    ...INITIAL_STATE.plan,
    invested: 20_000,
    monthlyContribution: 500,
    years: 25,
    goals: [
      { id: "a", kind: "live", country: "PT" },
      { id: "b", kind: "buy-own", name: "Boat", amount: 15_000 },
      { id: "c", kind: "monthly", amount: 1200, label: "Half-time" },
    ],
    investment: { kind: "mix", parts: [{ asset: "sp500", weight: 70 }, { asset: "gold", weight: 30 }], rebalance: true },
    withdrawalRate: 0.035,
    pricesOf: "PT",
    assumptions: { growth: null, volatility: 0.12, inflation: 0.025 },
  },
  whatIf: null,
};

describe("data file", () => {
  it("loads back exactly what was downloaded: the changed assumptions and Rising prices in included", () => {
    const text = serializeState(state, new Date("2026-09-29T10:00:00Z"));
    expect(parseDataFile(text)).toEqual({ ok: true, state, notices: [] });
    const custom = { ...state, plan: { ...state.plan, investment: { kind: "custom" as const } } };
    expect(parseDataFile(serializeState(custom, new Date()))).toEqual({ ok: true, state: custom, notices: [] });
  });

  it("says what the file is and when it was saved", () => {
    const json = JSON.parse(serializeState(state, new Date("2026-09-29T10:00:00Z")));
    expect(json).toMatchObject({ kind: "wealth-lens-data", version: 11, savedAt: "2026-09-29T10:00:00.000Z" });
    // Only the plan: nothing about stocks or prices.
    expect(Object.keys(json).sort()).toEqual(["kind", "plan", "savedAt", "version"]);
    expect(dataFileName(new Date("2026-09-29T10:00:00Z"))).toBe("horalis-growth-2026-09-29.json");
  });

  it("reads version 8 files as they were: a chip's investment as it was, Custom growth with the S&P 500's ups and downs it had", () => {
    const v8 = (plan: Record<string, unknown>) =>
      parseDataFile(JSON.stringify({ kind: "wealth-lens-data", version: 8, plan: { ...INITIAL_STATE.plan, invested: 1000, monthlyContribution: 100, ...plan }, holdings: [] }));
    const chip = v8({ investment: { kind: "asset", asset: "sp500" }, assumptions: STANDARD_ASSUMPTIONS });
    expect(chip.ok && chip.state.plan.investment).toEqual({ kind: "asset", asset: "sp500" });
    expect(chip.ok && chip.state.plan.assumptions).toEqual(STANDARD_ASSUMPTIONS);
    const mine = v8({ investment: { kind: "custom" }, assumptions: { ...STANDARD_ASSUMPTIONS, growth: 0.06 } });
    expect(mine.ok && mine.state.plan.assumptions).toEqual({ ...STANDARD_ASSUMPTIONS, growth: 0.06, volatility: FORMER_CUSTOM_VOLATILITY });
    // The same result as before: Custom growth moved like the S&P 500 then.
    expect(FORMER_CUSTOM_VOLATILITY).toBe(resolveInvestment({ kind: "asset", asset: "sp500" }).volatility);
    const typed = v8({ investment: { kind: "custom" }, assumptions: { ...STANDARD_ASSUMPTIONS, growth: 0.06, volatility: 0.1 } });
    expect(typed.ok && typed.state.plan.assumptions.volatility).toBe(0.1);
  });

  it("refuses files that are not Horalis Growth data", () => {
    expect(parseDataFile("not json")).toEqual({ ok: false, error: { code: "data-not-json" } });
    expect(parseDataFile('{"holdings": []}')).toEqual({ ok: false, error: { code: "data-not-ours" } });
    expect(parseDataFile('{"kind": "wealth-lens-data", "version": 12}')).toEqual({ ok: false, error: { code: "data-newer" } });
    expect(problemText({ code: "data-newer" }, EN.m.problems)).toBe("A newer Horalis Growth made this file.");
  });

  it("reads version 1 files: the euro goal becomes a goal 'reach an amount'", () => {
    const v1 = JSON.stringify({
      kind: "wealth-lens-data",
      version: 1,
      plan: { invested: 20_000, monthlyContribution: 500, goal: { amount: 250_000, targetDate: null }, goalCountry: null },
      holdings: [],
      uploadedPrices: {},
    });
    const result = parseDataFile(v1);
    // Saved when a first visit started on the S&P 500: it still invests in it.
    expect(result.ok && result.state.plan).toEqual({
      ...INITIAL_STATE.plan,
      investment: { kind: "asset", asset: "sp500" },
      assumptions: STANDARD_ASSUMPTIONS,
      invested: 20_000,
      monthlyContribution: 500,
      goals: [{ id: "g1", kind: "amount", amount: 250_000 }],
    });
  });

  it("reads version 2 files: the pinned connection and own items become goals, pinned first", () => {
    const v2 = JSON.stringify({
      kind: "wealth-lens-data",
      version: 2,
      plan: {
        invested: 20_000,
        monthlyContribution: 500,
        pinned: "country:PT",
        horizonYears: 30,
        housing: "own",
        customConnections: [{ id: "boat", name: "Boat", kind: "buy", amount: 15_000 }],
      },
      holdings: [],
      uploadedPrices: {},
    });
    const result = parseDataFile(v2);
    expect(result.ok && result.state.plan.years).toBe(30);
    expect(result.ok && result.state.plan.goals).toEqual([
      { id: "g1", kind: "live", country: "PT" },
      { id: "g2", kind: "buy-own", name: "Boat", amount: 15_000 },
    ]);
  });

  it("reads version 3 files: the saved mission becomes the first goal of My goals", () => {
    const v3 = (mission: unknown, extra: Record<string, unknown> = {}) =>
      parseDataFile(
        JSON.stringify({
          kind: "wealth-lens-data",
          version: 3,
          plan: { invested: 5000, monthlyContribution: 300, mission, horizonYears: null, customConnections: [], ...extra },
          holdings: [],
          uploadedPrices: {},
        }),
      );
    const goals = (result: ReturnType<typeof parseDataFile>) => (result.ok ? result.state.plan.goals : null);
    // Stopping work was about the home country the old version asked for; renting there meant with housing.
    expect(goals(v3({ kind: "stop-working" }, { homeCountry: "PE", housing: "rent" }))).toEqual([{ id: "g1", kind: "live", country: "PE" }]);
    expect(goals(v3({ kind: "live-abroad", country: "MX" }, { housing: "own" }))).toEqual([{ id: "g1", kind: "live", country: "MX" }]);
    // A thing of the old price list: dropped, with a notice; the user gives their own price now.
    const listed = v3({ kind: "buy", item: "used-car" });
    expect(goals(listed)).toEqual([]);
    expect(listed.ok && listed.notices).toEqual([{ code: "goal-items-retired", count: 1 }]);
    expect(goals(v3({ kind: "buy-own", name: "Piano", amount: 9000 }))).toEqual([
      { id: "g1", kind: "buy-own", name: "Piano", amount: 9000 },
    ]);
    expect(goals(v3({ kind: "amount", amount: 100_000 }))).toEqual([{ id: "g1", kind: "amount", amount: 100_000 }]);
    // No mission chosen yet: no goals, and the calculator still works.
    expect(goals(v3(null))).toEqual([]);
    expect(goals(v3({ kind: "amount", amount: -5 }))).toEqual([]);
  });

  it("reads version 4 files: income goals become monthly amounts, their name the label", () => {
    const v4 = JSON.stringify({
      kind: "wealth-lens-data",
      version: 4,
      plan: {
        invested: 1000,
        monthlyContribution: 200,
        years: 20,
        goals: [
          { id: "a", kind: "income", amount: 1500, name: "My spending" },
          { id: "b", kind: "income", amount: 900, name: null },
          { id: "c", kind: "amount", amount: 50_000 },
        ],
      },
      holdings: [],
      uploadedPrices: {},
    });
    const result = parseDataFile(v4);
    expect(result.ok && result.state.plan.goals).toEqual([
      { id: "a", kind: "monthly", amount: 1500, label: "My spending" },
      { id: "b", kind: "monthly", amount: 900, label: null },
      { id: "c", kind: "amount", amount: 50_000 },
    ]);
  });

  it("keeps the valid parts of a damaged file, and says once that holdings are no longer kept", () => {
    const damaged = JSON.stringify({
      kind: "wealth-lens-data",
      version: 1,
      plan: { invested: "lots", monthlyContribution: 300 },
      holdings: [{ id: "1", ticker: "VWCE", quantity: 10, costBasis: 1000, currency: "EUR", currentPrice: null }],
      uploadedPrices: { XYZ: { fileName: "x.csv", points: [] } },
    });
    const result = parseDataFile(damaged);
    // What the file lacks is 0, not the example numbers of a first visit.
    expect(result.ok && result.state.plan).toEqual({ ...INITIAL_STATE.plan, investment: { kind: "asset", asset: "sp500" }, assumptions: STANDARD_ASSUMPTIONS, invested: 0, monthlyContribution: 300 });
    expect(result.ok && result.notices).toEqual([{ code: "portfolio-retired" }]);
    expect(result.ok && Object.keys(result.state).sort()).toEqual(["plan", "whatIf"]);
  });

  describe("earlier versions' growth, typed before or after rising prices", () => {
    const file = (version: number, plan: Record<string, unknown>) =>
      parseDataFile(
        JSON.stringify({
          kind: "wealth-lens-data",
          version,
          plan: { invested: 10_000, monthlyContribution: 300, years: 25, withdrawalRate: 0.04, pricesOf: "NL", goals: [], investment: { kind: "asset", asset: "bonds" }, ...plan },
          holdings: [],
          uploadedPrices: {},
        }),
      );
    const today = new Date("2026-09-30T00:00:00Z");
    /** What the plan gives, the growth after rising prices and the ups and downs it is worked out with. */
    const outcome = (result: ReturnType<typeof parseDataFile>) => {
      if (!result.ok) throw new Error("not loaded");
      const { investment, result: total } = calculate(result.state.plan, today);
      return { realReturn: investment.realReturn, volatility: investment.volatility, total: total.total };
    };
    const bondsUps = resolveInvestment({ kind: "asset", asset: "bonds" }).volatility;

    it("keep a growth typed after rising prices (version 6), and so the very same result, as My %", () => {
      for (const [pricesOf, inflation] of [
        ["NL", null],
        ["BR", null],
        ["NL", 0.035],
      ] as const) {
        const result = file(6, { pricesOf, assumptions: { growth: { rate: 0.05, basis: "real" }, volatility: null, inflation } });
        expect(result.ok && result.state.plan.investment).toEqual({ kind: "custom" });
        expect(result.ok && result.state.plan.assumptions.growth).toBe(0.05);
        const { realReturn, volatility, total } = outcome(result);
        expect(realReturn).toBe(0.05);
        // The asset's ups and downs, kept as typed: the simulations do not change either.
        expect(volatility).toBeCloseTo(bondsUps, 12);
        expect(total).toBeCloseTo(futureValueWithContributions(10_000, 300, 0.05, 25), 6);
      }
    });

    it("turn a growth before rising prices (version 6, and every version 7 growth) into the same growth after them", () => {
      const six = file(6, { assumptions: { growth: { rate: 0.07, basis: "nominal" }, volatility: 0.1, inflation: null } });
      expect(six.ok && six.state.plan.assumptions).toEqual({ growth: 1.07 / 1.02 - 1, volatility: 0.1, inflation: null });
      const seven = file(7, { pricesOf: "BR", investment: { kind: "asset", asset: "sp500" }, assumptions: { growth: 0.07, volatility: null, inflation: null } });
      expect(outcome(seven).realReturn).toBeCloseTo(1.07 / 1.03 - 1, 12);
      expect(outcome(seven).volatility).toBeCloseTo(resolveInvestment({ kind: "asset", asset: "sp500" }).volatility, 12);
      expect(outcome(seven).total).toBeCloseTo(futureValueWithContributions(10_000, 300, 1.07 / 1.03 - 1, 25), 6);
      // With its own inflation.
      const typed = file(7, { investment: { kind: "custom" }, assumptions: { growth: 0.07, volatility: 0.12, inflation: 0.03 } });
      expect(typed.ok && typed.state.plan.assumptions).toEqual({ growth: 1.07 / 1.03 - 1, volatility: 0.12, inflation: 0.03 });
    });

    it("keep Custom growth's own figures, saved again as they are", () => {
      const result = file(6, { investment: { kind: "custom" }, assumptions: { growth: { rate: 0.06, basis: "real" }, volatility: 0.12, inflation: null } });
      const { realReturn, total } = outcome(result);
      expect(realReturn).toBe(0.06);
      expect(total).toBeCloseTo(futureValueWithContributions(10_000, 300, 0.06, 25), 6);
      if (!result.ok) throw new Error("not loaded");
      const again = parseDataFile(serializeState(result.state, today));
      expect(again.ok && again.state.plan).toEqual(result.state.plan);
    });

    it("read amounts saved before they were typed (version 8) as still to type; missing ones in older files as 0", () => {
      const empty = file(8, { invested: null, monthlyContribution: null });
      expect(empty.ok && empty.state.plan).toMatchObject({ invested: null, monthlyContribution: null });
      const older = file(7, { invested: null, monthlyContribution: undefined });
      expect(older.ok && older.state.plan).toMatchObject({ invested: 0, monthlyContribution: 0 });
    });
  });

  describe("files with what the app no longer offers", () => {
    const v5 = (investment: unknown, plan: Record<string, unknown> = {}) =>
      parseDataFile(
        JSON.stringify({
          kind: "wealth-lens-data",
          version: 5,
          plan: { invested: 1000, monthlyContribution: 200, years: 20, withdrawalRate: 0.04, inflation: 0.02, goals: [], investment, ...plan },
          holdings: [],
          uploadedPrices: {},
        }),
      );

    it("read a single stock as US stocks, with a one-line notice", () => {
      const result = v5({ kind: "stock", id: "BRK-B" });
      expect(result.ok && result.state.plan.investment).toEqual({ kind: "asset", asset: "sp500" });
      expect(result.ok && result.notices).toEqual([{ code: "stocks-now-us" }]);
      const [notice] = result.ok ? result.notices : [];
      expect(problemText(notice, EN.m.problems)).toMatch(/US stocks/);
      expect(problemText(notice, getI18n("es").m.problems)).toMatch(/acciones de EE\. UU\./i);
    });

    it("read the stocks and indexes of a mix as US stocks, adding up weights", () => {
      const result = v5({
        kind: "mix",
        parts: [
          { ref: "index:nasdaq100", weight: 50 },
          { ref: "stock:NVDA", weight: 30 },
          { ref: "index:bonds", weight: 20 },
        ],
        rebalance: true,
      });
      expect(result.ok && result.state.plan.investment).toEqual({
        kind: "mix",
        parts: [
          { asset: "sp500", weight: 80 },
          { asset: "bonds", weight: 20 },
        ],
        rebalance: true,
      });
      expect(result.ok && result.notices.map((notice) => notice.code).sort()).toEqual(["series-retired", "stocks-now-us"]);
    });

    it("read My portfolio as US stocks, with a notice", () => {
      const result = parseDataFile(JSON.stringify({ kind: "wealth-lens-data", version: 10, plan: { ...INITIAL_STATE.plan, investment: { kind: "portfolio" }, assumptions: STANDARD_ASSUMPTIONS }, holdings: [{ ticker: "VWCE" }] }));
      expect(result.ok && result.state.plan.investment).toEqual({ kind: "asset", asset: "sp500" });
      expect(result.ok && result.notices).toEqual([{ code: "portfolio-retired" }]);
    });

    it("read world stocks as US stocks, a custom rate as Custom growth after inflation, and an inflation other than the old default as typed", () => {
      expect(v5({ kind: "index", index: "world" })).toMatchObject({ ok: true, notices: [{ code: "series-retired", series: "world" }], state: { plan: { investment: { kind: "asset", asset: "sp500" } } } });
      const custom = v5({ kind: "custom", realReturn: 0.045 }, { inflation: 0.03 });
      expect(custom.ok && custom.state.plan).toMatchObject({
        investment: { kind: "custom" },
        pricesOf: "NL",
        // Custom growth then moved like the S&P 500: it still does, so the result is the same.
        assumptions: { growth: 0.045, volatility: FORMER_CUSTOM_VOLATILITY, inflation: 0.03 },
      });
      // The old default of 2% is the Netherlands' reference: nothing typed.
      const standard = v5({ kind: "index", index: "sp500" });
      expect(standard.ok && standard.state.plan.assumptions).toEqual(STANDARD_ASSUMPTIONS);
    });
  });
});
