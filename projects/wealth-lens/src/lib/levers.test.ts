import { describe, expect, it } from "vitest";
import { parseIsoDate } from "./dates";
import { buildLevers, describeEffect } from "./levers";
import { buildReport, type ReportPlan } from "./report";
import type { Holding } from "./types";

const today = parseIsoDate("2026-09-29");
const plan = (overrides: Partial<ReportPlan> = {}): ReportPlan => ({
  invested: 1000,
  monthlyContribution: 200,
  investment: { kind: "index", index: "sp500" },
  withdrawalRate: 0.04,
  inflation: 0.02,
  housing: "rent",
  homeCountry: "NL",
  mission: { kind: "live-abroad", country: "IN" },
  horizonYears: null,
  customConnections: [],
  ...overrides,
});
const levers = (overrides: Partial<ReportPlan> = {}, holdings: Holding[] = []) =>
  buildLevers(buildReport(plan(overrides), holdings, today), holdings);

describe("describeEffect", () => {
  it("speaks in years for goals", () => {
    expect(describeEffect({ mode: "goal", months: 240 }, { mode: "goal", months: 216 }, "live")).toEqual({
      text: "2 years earlier",
      tone: "better",
    });
    expect(describeEffect({ mode: "goal", months: 240 }, { mode: "goal", months: 246 }, "live")).toEqual({
      text: "6 months later",
      tone: "worse",
    });
    expect(describeEffect({ mode: "goal", months: 240 }, { mode: "goal", months: 240.2 }, "live").tone).toBe("same");
    expect(describeEffect({ mode: "goal", months: Infinity }, { mode: "goal", months: 300 }, "live").text).toBe(
      "reachable in 25 years",
    );
    expect(describeEffect({ mode: "goal", months: 300 }, { mode: "goal", months: Infinity }, "live").text).toBe("not reachable");
  });

  it("counts no year beyond 60: past it a goal is not reachable at this pace", () => {
    // 67 and 75 years: both out of reach, so no "8 years earlier".
    expect(describeEffect({ mode: "goal", months: 900 }, { mode: "goal", months: 800 }, "live")).toEqual({
      text: "still not reachable",
      tone: "same",
    });
    expect(describeEffect({ mode: "goal", months: 800 }, { mode: "goal", months: 700 }, "live")).toEqual({
      text: "reachable in 58 years",
      tone: "better",
    });
    expect(describeEffect({ mode: "goal", months: 700 }, { mode: "goal", months: 721 }, "live").text).toBe("not reachable");
  });

  it("speaks in euros when looking a fixed number of years ahead", () => {
    expect(describeEffect({ mode: "horizon", value: 120 }, { mode: "horizon", value: 150 }, "live")).toEqual({
      text: "+€30/month",
      tone: "better",
    });
    expect(describeEffect({ mode: "horizon", value: 20_000 }, { mode: "horizon", value: 18_500 }, "buy")).toEqual({
      text: "-€1,500",
      tone: "worse",
    });
  });
});

describe("monthly amount", () => {
  it("shows what one step more or less does", () => {
    const { monthly } = levers();
    expect(monthly).toMatchObject({ value: 200, step: 50 });
    expect(monthly.up.tone).toBe("better");
    expect(monthly.up.text).toMatch(/earlier$/);
    expect(monthly.down?.tone).toBe("worse");
  });

  it("has nothing to take away at zero, and bigger steps for bigger amounts", () => {
    expect(levers({ monthlyContribution: 0 }).monthly.down).toBeNull();
    expect(levers({ monthlyContribution: 1000 }).monthly.step).toBe(100);
    expect(levers({ monthlyContribution: 3000 }).monthly.step).toBe(250);
  });
});

describe("what it is invested in", () => {
  it("compares each index with the current one", () => {
    const options = levers().investment;
    expect(options.map((option) => option.label)).toEqual(["S&P 500", "World", "Nasdaq-100"]);
    const byLabel = new Map(options.map((option) => [option.label, option]));
    expect(byLabel.get("S&P 500")).toMatchObject({ selected: true, effect: null });
    expect(byLabel.get("World")?.effect?.tone).toBe("worse");
    expect(byLabel.get("Nasdaq-100")?.effect?.tone).toBe("better");
    // All three over the same years, with the period next to the rate.
    expect(byLabel.get("World")).toMatchObject({ detail: "VWCE · 4.5%", note: "1988–2022" });
    expect(byLabel.get("S&P 500")).toMatchObject({ detail: "VUAA · 7.5%", note: "1988–2022" });
    expect(byLabel.get("Nasdaq-100")).toMatchObject({ detail: "EQQQ · 9.9%", note: "1988–2022 · no dividends" });
  });

  it("offers the portfolio once there are euro holdings, and keeps a custom choice", () => {
    const holdings: Holding[] = [
      { id: "1", ticker: "VWCE", quantity: 10, costBasis: 1000, currency: "EUR", currentPrice: 150, priceSource: "manual", priceDate: null },
    ];
    expect(levers({}, holdings).investment.map((option) => option.label)).toContain("My portfolio");
    const custom = levers({ investment: { kind: "custom", realReturn: 0.05 } }).investment;
    expect(custom.at(-1)).toMatchObject({ label: "Your own rate", selected: true });
  });
});

describe("years", () => {
  it("offers 'when reached' and fixed horizons with what the money pays then", () => {
    const options = levers().horizon;
    expect(options.map((option) => option.label)).toEqual(["When reached", "5 years", "10 years", "20 years", "30 years"]);
    expect(options[0]).toMatchObject({ selected: true });
    expect(options[0].detail).toMatch(/^20\d\d$/);
    const incomes = options.slice(1).map((option) => Number(option.detail.replace(/[^\d]/g, "")));
    expect([...incomes].sort((a, b) => a - b)).toEqual(incomes);
  });

  it("says 'not at this pace' instead of a year more than 60 years away", () => {
    expect(levers({ monthlyContribution: 1, mission: { kind: "live-abroad", country: "IN" } }).horizon[0].detail).toBe("not at this pace");
  });

  it("keeps a chosen horizon in the list", () => {
    const options = levers({ horizonYears: 15 }).horizon;
    expect(options.find((option) => option.selected)?.label).toBe("15 years");
  });
});

describe("withdrawal rate", () => {
  it("shows each rate's effect and how often it lasted 30 years", () => {
    const options = levers().withdrawal ?? [];
    expect(options.map((option) => option.label)).toEqual(["3%", "4%", "5%"]);
    expect(options[0].effect?.tone).toBe("worse"); // 3% needs more capital: later
    expect(options[2].effect?.tone).toBe("better");
    const lasted = options.map((option) => Number(option.detail.match(/(\d+)%$/)?.[1]));
    expect(lasted[0]).toBeGreaterThanOrEqual(lasted[1]);
    expect(lasted[1]).toBeGreaterThanOrEqual(lasted[2]);
    expect(options.every((option) => option.note === "S&P 500, 1988–2022")).toBe(true);
  });

  it("does not apply to a purchase", () => {
    expect(levers({ mission: { kind: "buy", item: "new-car" } }).withdrawal).toBeNull();
  });

  it("speaks in euros per month when looking ahead", () => {
    const options = levers({ horizonYears: 10 }).withdrawal ?? [];
    expect(options[2].effect?.text).toMatch(/^\+€\d+\/month$/);
  });
});
