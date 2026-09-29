import { describe, expect, it } from "vitest";
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
      { id: "c", kind: "income", amount: 1200, name: "Half-time" },
    ],
    investment: { kind: "portfolio" },
    withdrawalRate: 0.035,
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
  ],
  uploadedPrices: { XYZ: { fileName: "xyz.csv", points: [{ time: "2026-09-25", close: 12.5 }] } },
};

describe("data file", () => {
  it("loads back exactly what was downloaded", () => {
    const text = serializeState(state, new Date("2026-09-29T10:00:00Z"));
    expect(parseDataFile(text)).toEqual({ ok: true, state });
  });

  it("says what the file is and when it was saved", () => {
    const json = JSON.parse(serializeState(state, new Date("2026-09-29T10:00:00Z")));
    expect(json).toMatchObject({ kind: "wealth-lens-data", version: 4, savedAt: "2026-09-29T10:00:00.000Z" });
    expect(dataFileName(new Date("2026-09-29T10:00:00Z"))).toBe("wealth-lens-2026-09-29.json");
  });

  it("refuses files that are not Wealth Lens data", () => {
    expect(parseDataFile("not json")).toEqual({ ok: false, error: expect.stringMatching(/not valid JSON/) });
    expect(parseDataFile('{"holdings": []}')).toEqual({ ok: false, error: expect.stringMatching(/not a Wealth Lens/) });
    expect(parseDataFile('{"kind": "wealth-lens-data", "version": 5}')).toEqual({
      ok: false,
      error: expect.stringMatching(/newer version/),
    });
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

  it("keeps the valid parts of a damaged file", () => {
    const damaged = JSON.stringify({
      kind: "wealth-lens-data",
      version: 1,
      plan: { invested: "lots", monthlyContribution: 300 },
      holdings: [state.holdings[0], { id: "bad" }],
      uploadedPrices: { XYZ: { fileName: "x.csv", points: [] } },
    });
    const result = parseDataFile(damaged);
    expect(result.ok && result.state.holdings).toEqual(state.holdings);
    // What the file lacks is 0, not the example numbers of a first visit.
    expect(result.ok && result.state.plan).toEqual({ ...INITIAL_STATE.plan, invested: 0, monthlyContribution: 300 });
    expect(result.ok && result.state.uploadedPrices).toEqual({});
  });
});
