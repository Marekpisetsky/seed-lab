import { describe, expect, it } from "vitest";
import { EN, getI18n } from "@/i18n";
import { problemText } from "./problems";
import { INITIAL_STATE, type AppState } from "./app-store";
import { dataFileName, parseDataFile, serializeState } from "./data-file";

const state: AppState = {
  plan: {
    ...INITIAL_STATE.plan,
    invested: 20_000,
    monthlyContribution: 500,
    years: 25,
    goals: [
      { id: "a", kind: "live", country: "PT", housing: true },
      { id: "b", kind: "buy-own", name: "Boat", amount: 15_000 },
      { id: "c", kind: "monthly", amount: 1200, label: "Half-time" },
    ],
    investment: { kind: "portfolio" },
    withdrawalRate: 0.035,
    pricesOf: "PT",
    assumptions: { growth: { rate: 0.06, basis: "nominal" }, volatility: 0.12, inflation: 0.025 },
  },
  holdings: [
    {
      id: "1",
      ticker: "VWCE",
      quantity: 10,
      costBasis: 1000,
      currency: "EUR",
      currentPrice: null,
      priceSource: "auto",
      priceDate: null,
    },
    {
      id: "2",
      ticker: "XYZ",
      quantity: 5,
      costBasis: 500,
      currency: "EUR",
      currentPrice: 120,
      priceSource: "manual",
      priceDate: null,
      reference: "gold",
    },
  ],
  uploadedPrices: { XYZ: { fileName: "xyz.csv", points: [{ time: "2026-09-25", close: 12.5 }] } },
  whatIf: null,
};

describe("data file", () => {
  it("loads back exactly what was downloaded: the changed assumptions, Prices of and what each holding grows like included", () => {
    const text = serializeState(state, new Date("2026-09-29T10:00:00Z"));
    expect(parseDataFile(text)).toEqual({ ok: true, state, notices: [] });
    const custom = { ...state, plan: { ...state.plan, investment: { kind: "custom" as const } } };
    expect(parseDataFile(serializeState(custom, new Date()))).toEqual({ ok: true, state: custom, notices: [] });
  });

  it("says what the file is and when it was saved", () => {
    const json = JSON.parse(serializeState(state, new Date("2026-09-29T10:00:00Z")));
    expect(json).toMatchObject({ kind: "wealth-lens-data", version: 6, savedAt: "2026-09-29T10:00:00.000Z" });
    expect(dataFileName(new Date("2026-09-29T10:00:00Z"))).toBe("wealth-lens-2026-09-29.json");
  });

  it("refuses files that are not Wealth Lens data", () => {
    expect(parseDataFile("not json")).toEqual({ ok: false, error: { code: "data-not-json" } });
    expect(parseDataFile('{"holdings": []}')).toEqual({ ok: false, error: { code: "data-not-ours" } });
    expect(parseDataFile('{"kind": "wealth-lens-data", "version": 7}')).toEqual({ ok: false, error: { code: "data-newer" } });
    expect(problemText({ code: "data-newer" }, EN.m.problems)).toBe("A newer Wealth Lens made this file.");
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
    expect(result.ok && result.state.plan).toEqual({
      ...INITIAL_STATE.plan,
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
      { id: "g1", kind: "live", country: "PT", housing: false },
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
    expect(goals(v3({ kind: "stop-working" }, { homeCountry: "PE", housing: "rent" }))).toEqual([
      { id: "g1", kind: "live", country: "PE", housing: true },
    ]);
    expect(goals(v3({ kind: "live-abroad", country: "MX" }, { housing: "own" }))).toEqual([
      { id: "g1", kind: "live", country: "MX", housing: false },
    ]);
    expect(goals(v3({ kind: "buy", item: "used-car" }))).toEqual([{ id: "g1", kind: "buy", item: "used-car" }]);
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

  it("keeps the valid parts of a damaged file", () => {
    const damaged = JSON.stringify({
      kind: "wealth-lens-data",
      version: 1,
      plan: { invested: "lots", monthlyContribution: 300 },
      holdings: [state.holdings[0], { id: "bad" }, { ...state.holdings[1], quantity: -1 }],
      uploadedPrices: { XYZ: { fileName: "x.csv", points: [] } },
    });
    const result = parseDataFile(damaged);
    expect(result.ok && result.state.holdings).toEqual([state.holdings[0]]);
    // What the file lacks is 0, not the example numbers of a first visit.
    expect(result.ok && result.state.plan).toEqual({ ...INITIAL_STATE.plan, invested: 0, monthlyContribution: 300 });
    expect(result.ok && result.state.uploadedPrices).toEqual({});
  });

  describe("version 5 files that projected a single stock", () => {
    const v5 = (investment: unknown, holdings: unknown[] = [], plan: Record<string, unknown> = {}) =>
      parseDataFile(
        JSON.stringify({
          kind: "wealth-lens-data",
          version: 5,
          plan: { invested: 1000, monthlyContribution: 200, years: 20, withdrawalRate: 0.04, inflation: 0.02, goals: [], investment, ...plan },
          holdings,
          uploadedPrices: {},
        }),
      );
    const nvidia = { id: "n", ticker: "NVDA", quantity: 2, costBasis: 200, currency: "USD", currentPrice: 180, priceSource: "manual", priceDate: null };

    it("move to My portfolio when the file holds the stock, with a one-line notice", () => {
      const result = v5({ kind: "stock", id: "NVDA" }, [nvidia]);
      expect(result.ok && result.state.plan.investment).toEqual({ kind: "portfolio" });
      expect(result.ok && result.notices).toEqual([{ code: "stock-now-portfolio", name: "NVIDIA" }]);
    });

    it("move to the stock's index otherwise", () => {
      const result = v5({ kind: "stock", id: "BRK-B" });
      expect(result.ok && result.state.plan.investment).toEqual({ kind: "asset", asset: "sp500" });
      expect(result.ok && result.notices).toEqual([{ code: "stock-now-index", name: "Berkshire Hathaway", index: "sp500" }]);
      const [notice] = result.ok ? result.notices : [];
      expect(problemText(notice, EN.m.problems)).toBe("Your file projected Berkshire Hathaway alone. One stock is no longer projected alone. It now grows like the S&P 500.");
      expect(problemText(notice, getI18n("es").m.problems)).toMatch(/Ahora crece como el S&P 500\.$/);
      // A stock no longer on the list: the default, quietly.
      expect(v5({ kind: "stock", id: "GONE" })).toMatchObject({ ok: true, notices: [], state: { plan: { investment: { kind: "asset", asset: "sp500" } } } });
    });

    it("count each stock of a mix as its index, adding up weights", () => {
      const result = v5({
        kind: "mix",
        parts: [
          { ref: "index:nasdaq100", weight: 50 },
          { ref: "stock:NVDA", weight: 30 },
          { ref: "stock:SAP", weight: 20 },
        ],
        rebalance: true,
      });
      expect(result.ok && result.state.plan.investment).toEqual({
        kind: "mix",
        parts: [
          { asset: "nasdaq100", weight: 80 },
          { asset: "world", weight: 20 },
        ],
        rebalance: true,
      });
      expect(result.ok && result.notices).toEqual([{ code: "mix-had-stocks" }]);
    });

    it("read an index as that asset, a custom rate as Custom growth after inflation, and an inflation other than the old default as typed", () => {
      expect(v5({ kind: "index", index: "world" })).toMatchObject({ ok: true, notices: [], state: { plan: { investment: { kind: "asset", asset: "world" } } } });
      const custom = v5({ kind: "custom", realReturn: 0.045 }, [], { inflation: 0.03 });
      expect(custom.ok && custom.state.plan).toMatchObject({
        investment: { kind: "custom" },
        pricesOf: "NL",
        assumptions: { growth: { rate: 0.045, basis: "real" }, volatility: null, inflation: 0.03 },
      });
      // The old default of 2% is the Netherlands' reference: nothing typed.
      const standard = v5({ kind: "index", index: "sp500" });
      expect(standard.ok && standard.state.plan.assumptions).toEqual(INITIAL_STATE.plan.assumptions);
    });
  });
});
