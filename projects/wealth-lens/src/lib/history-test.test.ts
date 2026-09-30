import { describe, expect, it } from "vitest";
import { calculate, type CalculatorPlan } from "./calculator";
import { parseIsoDate } from "./dates";
import { averageResult, CRISES, crisisResult, crisisResults, everyStartYear, historyPath, historySource, SP500_ALONE, yearsCovered, type HistorySource } from "./history-test";
import { SERIES } from "./indexes";
import { resolveInvestment } from "./investment";
import type { Holding } from "./types";
import { DEFAULT_PLAN } from "./validation";

const today = parseIsoDate("2026-09-30");
const sp = (year: number) => SERIES.sp500.dataset.years.find((entry) => entry.year === year)?.realReturn ?? NaN;
const world = (year: number) => SERIES.world.dataset.years.find((entry) => entry.year === year)?.realReturn ?? NaN;
const bondsReturn = (year: number) => SERIES.bonds.dataset.years.find((entry) => entry.year === year)?.realReturn ?? NaN;
const worldOnly: HistorySource = { parts: [{ asset: "world", weight: 1 }], rebalance: true, savingsReturn: 0 };
const sixtyForty: HistorySource = { parts: [{ asset: "world", weight: 0.6 }, { asset: "bonds", weight: 0.4 }], rebalance: true, savingsReturn: 0 };

describe("the history a plan follows", () => {
  it("is its asset, a mix's parts, or the index of each stock of My portfolio; none for savings or custom growth", () => {
    expect(historySource(resolveInvestment({ kind: "asset", asset: "sp500" }, []))).toEqual(SP500_ALONE);
    expect(historySource(resolveInvestment({ kind: "asset", asset: "savings" }, []))).toBeNull();
    expect(historySource(resolveInvestment({ kind: "custom" }, []))).toBeNull();
    const mix = historySource(resolveInvestment({ kind: "mix", parts: [{ asset: "world", weight: 60 }, { asset: "bonds", weight: 40 }], rebalance: true }, []));
    expect(mix).toMatchObject({ rebalance: true, parts: [{ asset: "world", weight: 0.6 }, { asset: "bonds", weight: 0.4 }] });
    const nasdaqFund: Holding = { id: "n", ticker: "EQQQ", quantity: 1, costBasis: 100, currency: "EUR", currentPrice: 100, priceSource: "manual", priceDate: null };
    expect(historySource(resolveInvestment({ kind: "portfolio" }, [nasdaqFund]))?.parts.map((part) => part.asset)).toEqual(["nasdaq100"]);
  });

  it("covers the years every part has data for", () => {
    expect(yearsCovered(SP500_ALONE)).toEqual([1928, 2022]);
    expect(yearsCovered(worldOnly)).toEqual([1988, 2024]);
    expect(yearsCovered({ ...sixtyForty, parts: [...sixtyForty.parts, { asset: "sp500", weight: 0 }] })).toEqual([1988, 2022]);
  });
});

describe("a path through real years", () => {
  it("grows the money by each year's real return, with half the year's amounts at its start and half at its end", () => {
    expect(historyPath(SP500_ALONE, { start: 1000, monthly: 0 }, 2008, 1)).toEqual([1000, 1000 * (1 + sp(2008))]);
    const [, afterOne] = historyPath(SP500_ALONE, { start: 0, monthly: 100 }, 2008, 1);
    expect(afterOne).toBeCloseTo(600 * (1 + sp(2008)) + 600, 9);
    // Linear in the amounts, like the simulations.
    const both = historyPath(SP500_ALONE, { start: 1000, monthly: 100 }, 1990, 10);
    const apart = [historyPath(SP500_ALONE, { start: 1000, monthly: 0 }, 1990, 10), historyPath(SP500_ALONE, { start: 0, monthly: 100 }, 1990, 10)];
    both.forEach((value, index) => expect(value).toBeCloseTo(apart[0][index] + apart[1][index], 6));
  });

  it("rebalances a mix to its weights every year, or lets it drift", () => {
    const [, rebalanced, twoYears] = historyPath(sixtyForty, { start: 1000, monthly: 0 }, 2008, 2);
    const first = 600 * (1 + world(2008)) + 400 * (1 + bondsReturn(2008));
    expect(rebalanced).toBeCloseTo(first, 9);
    expect(twoYears).toBeCloseTo(first * (0.6 * (1 + world(2009)) + 0.4 * (1 + bondsReturn(2009))), 9);
    const drifting = historyPath({ ...sixtyForty, rebalance: false }, { start: 1000, monthly: 0 }, 2008, 2)[2];
    expect(drifting).toBeCloseTo(600 * (1 + world(2008)) * (1 + world(2009)) + 400 * (1 + bondsReturn(2008)) * (1 + bondsReturn(2009)), 9);
  });

  it("stops where the data ends", () => {
    expect(historyPath(SP500_ALONE, { start: 1, monthly: 0 }, 2020, 20)).toHaveLength(4);
    expect(historyPath(SP500_ALONE, { start: 1, monthly: 0 }, 1900, 5)).toEqual([]);
  });
});

describe("the crashes", () => {
  it("are six, from the Great Depression to the inflation shock of 2022", () => {
    expect(CRISES.map((crisis) => `${crisis.id} ${crisis.year}`)).toEqual(["depression 1929", "oil 1973", "dotcom 2000", "financial 2008", "covid 2020", "inflation 2022"]);
  });

  it("are all in the S&P 500's data; World's starts in 1988, so not the first two", () => {
    const amounts = { start: 1000, monthly: 200 };
    expect(Object.values(crisisResults(SP500_ALONE, amounts, 20)).every(Boolean)).toBe(true);
    const inWorld = crisisResults(worldOnly, amounts, 20);
    expect(inWorld.depression).toBeNull();
    expect(inWorld.oil).toBeNull();
    expect(inWorld.dotcom && inWorld.financial && inWorld.covid && inWorld.inflation).toBeTruthy();
    expect(Object.values(crisisResults(null, amounts, 20)).every((result) => result === null)).toBe(true);
  });

  it("start the year before (2007 for 2008) and measure the fall from the peak, and the years back to it", () => {
    const result = crisisResult(SP500_ALONE, { start: 10_000, monthly: 0 }, 20, "financial");
    expect(result?.startYear).toBe(2007);
    const path = [10_000, 10_000 * (1 + sp(2007)), 10_000 * (1 + sp(2007)) * (1 + sp(2008))];
    expect(result?.fall).toMatchObject({ peak: 0, trough: 2 });
    expect(result?.fall?.drop).toBeCloseTo(1 - path[2] / path[0], 9);
    let value = path[2];
    let years = 2;
    for (let year = 2009; value < 10_000; year++, years++) value *= 1 + sp(year);
    expect(result?.yearsToRecover).toBe(years);
  });

  it("measure the crash on the money there was at the top, whatever is added each year", () => {
    const alone = crisisResult(SP500_ALONE, { start: 10_000, monthly: 0 }, 20, "financial");
    const adding = crisisResult(SP500_ALONE, { start: 10_000, monthly: 500 }, 20, "financial");
    expect(adding?.fall?.drop).toBeCloseTo(alone?.fall?.drop ?? NaN, 12);
    expect(adding?.yearsToRecover).toBe(alone?.yearsToRecover);
    expect(adding?.fall?.from).toBeCloseTo(adding?.path[adding?.fall?.peak ?? 0] ?? NaN, 9);
    expect(adding?.fall?.to).toBeCloseTo((adding?.fall?.from ?? 0) * (1 - (alone?.fall?.drop ?? 0)), 9);
    // The money itself (with €6,000 added a year) ends higher than the money at the top fell to.
    expect(adding?.path[adding.fall?.trough ?? 0]).toBeGreaterThan(adding?.fall?.to ?? Infinity);
    // The S&P 500 ended 2020 up: in yearly data the Covid crash does not show.
    expect(crisisResult(SP500_ALONE, { start: 10_000, monthly: 0 }, 20, "covid")?.fall).toBeNull();
  });

  it("say when the money was not back before the data ends, and run the plan's years only as far as the data goes", () => {
    const shock = crisisResult(SP500_ALONE, { start: 10_000, monthly: 0 }, 20, "inflation");
    expect(shock?.fall?.drop).toBeCloseTo(-sp(2022), 9);
    expect(shock?.yearsToRecover).toBeNull();
    expect(shock).toMatchObject({ startYear: 2021, years: 2, lastYear: 2022 });
    const depression = crisisResult(SP500_ALONE, { start: 10_000, monthly: 0 }, 20, "depression");
    expect(depression).toMatchObject({ startYear: 1928, years: 20 });
    expect(depression?.final).toBeCloseTo(depression?.path[20] ?? NaN, 9);
  });

  it("cushion a mix's fall, next to the S&P 500 alone", () => {
    const amounts = { start: 10_000, monthly: 0 };
    const mix = crisisResult(sixtyForty, amounts, 20, "financial");
    const alone = crisisResult(SP500_ALONE, amounts, 20, "financial");
    expect(mix?.fall?.drop ?? 1).toBeLessThan(alone?.fall?.drop ?? 0);
  });
});

describe("every start year", () => {
  it("runs the plan's years from each year the data allows, and marks the worst, the middle and the best", () => {
    const amounts = { start: 1000, monthly: 200 };
    const result = everyStartYear(SP500_ALONE, amounts, 20);
    expect(result?.window).toBe(20);
    expect(result?.starts.map((start) => start.year)).toEqual(Array.from({ length: 2022 - 20 - 1928 + 2 }, (_, index) => 1928 + index));
    for (const start of result?.starts ?? []) expect(start.final).toBeCloseTo(historyPath(SP500_ALONE, amounts, start.year, 20)[20], 6);
    const finals = (result?.starts ?? []).map((start) => start.final).sort((a, b) => a - b);
    expect(result?.worst.final).toBe(finals[0]);
    expect(result?.best.final).toBe(finals.at(-1));
    expect(result?.median.final).toBe(finals[Math.floor((finals.length - 1) / 2)]);
  });

  it("uses shorter runs when the data is too short for the plan's years", () => {
    const result = everyStartYear(worldOnly, { start: 1000, monthly: 0 }, 60);
    expect(result?.window).toBe(2024 - 1988 + 1 - 4);
    expect(result?.starts).toHaveLength(5);
    expect(everyStartYear(null, { start: 1000, monthly: 0 }, 20)).toBeNull();
  });

  it("can keep another plan's start years, to compare alike", () => {
    const years = [1990, 1995, 2000];
    expect(everyStartYear(SP500_ALONE, { start: 1000, monthly: 0 }, 20, years)?.starts.map((start) => start.year)).toEqual(years);
  });

  it("is compared with the plan's own average growth over the same years", () => {
    const plan: CalculatorPlan = { ...DEFAULT_PLAN, invested: 1000, monthlyContribution: 200 };
    const calc = calculate(plan, [], today);
    expect(averageResult(calc.scenario, calc.result.years)).toBeCloseTo(calc.result.total, 6);
  });
});
