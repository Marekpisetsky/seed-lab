import { describe, expect, it } from "vitest";
import msciWorld from "@/data/msci-world-real-returns.json";
import nasdaq100 from "@/data/nasdaq100-real-returns.json";
import { annualizedReturn, INDEXES, INDEX_IDS, parseReturns } from "./indexes";

describe("annualizedReturn", () => {
  it("is the constant yearly return that compounds to the same result", () => {
    // +50 % then −50 % leaves 0.75: −13.4 % a year, not the 0 % arithmetic mean.
    expect(annualizedReturn([0.5, -0.5])).toBeCloseTo(Math.sqrt(0.75) - 1, 12);
    expect(annualizedReturn([0.07, 0.07, 0.07])).toBeCloseTo(0.07, 12);
  });

  it("rejects an empty list", () => {
    expect(() => annualizedReturn([])).toThrow(RangeError);
  });
});

describe("parseReturns", () => {
  const years = (count: number, from = 1990) =>
    Array.from({ length: count }, (_, index) => ({ year: from + index, realReturn: 0.05 }));

  it("accepts consecutive years with a source", () => {
    expect(parseReturns("test", { source: "x", years: years(20) })).toHaveLength(20);
  });

  it("fails loudly on gaps, bad values, short series or a missing source", () => {
    const gap = years(21);
    gap.splice(5, 1);
    expect(() => parseReturns("test", { source: "x", years: gap })).toThrow(/does not follow/);
    const bad = years(20);
    bad[3] = { year: 1993, realReturn: -1 };
    expect(() => parseReturns("test", { source: "x", years: bad })).toThrow(/invalid return/);
    expect(() => parseReturns("test", { source: "x", years: years(10) })).toThrow(/fewer than 20/);
    expect(() => parseReturns("test", { source: "", years: years(20) })).toThrow(/source/);
  });
});

describe("INDEXES", () => {
  it("has the three ETFs a European investor knows best", () => {
    expect(INDEX_IDS.map((id) => INDEXES[id].etf)).toEqual(["VUAA", "VWCE", "EQQQ"]);
  });

  it("covers decades of history for each index", () => {
    expect([INDEXES.sp500.firstYear, INDEXES.sp500.lastYear]).toEqual([1928, 2022]);
    expect([INDEXES.world.firstYear, INDEXES.world.lastYear]).toEqual([1988, 2024]);
    expect([INDEXES.nasdaq100.firstYear, INDEXES.nasdaq100.lastYear]).toEqual([1986, 2024]);
  });

  it("gives long-run real averages in the expected ranges", () => {
    expect(INDEXES.sp500.averageReturn).toBeCloseTo(0.0658, 3);
    expect(INDEXES.world.averageReturn).toBeCloseTo(0.0512, 3);
    expect(INDEXES.nasdaq100.averageReturn).toBeCloseTo(0.1082, 3);
  });

  it("reflects the big crashes", () => {
    const real = (id: keyof typeof INDEXES, year: number) =>
      INDEXES[id].years.find((entry) => entry.year === year)?.realReturn;
    expect(real("world", 2008)).toBeLessThan(-0.4);
    expect(real("nasdaq100", 2000)).toBeLessThan(-0.35);
    expect(real("nasdaq100", 2022)).toBeLessThan(-0.35);
  });
});

/**
 * The files keep the published nominal figures next to inflation. Recomputing
 * the real return from them catches a hand edit that breaks the link.
 */
describe("MSCI World dataset", () => {
  it("derives each real return from the nominal return and inflation", () => {
    for (const { year, nominalReturn, inflation, realReturn } of msciWorld.years) {
      expect(realReturn, String(year)).toBeCloseTo((1 + nominalReturn) / (1 + inflation) - 1, 4);
    }
  });

  it("compounds to the annualized returns printed on MSCI's factsheets", () => {
    const nominal = new Map(msciWorld.years.map((entry) => [entry.year, entry.nominalReturn]));
    const annualized = (from: number, to: number) => {
      const returns = [];
      for (let year = from; year <= to; year++) returns.push(nominal.get(year) ?? NaN);
      return annualizedReturn(returns);
    };
    // Factsheet of December 2024: 3, 5 and 10 years.
    expect(annualized(2022, 2024)).toBeCloseTo(0.0634, 4);
    expect(annualized(2020, 2024)).toBeCloseTo(0.1117, 4);
    expect(annualized(2015, 2024)).toBeCloseTo(0.0995, 4);
    // Factsheets of December 2019 and December 2014.
    expect(annualized(2010, 2019)).toBeCloseTo(0.0947, 4);
    expect(annualized(2005, 2014)).toBeCloseTo(0.0603, 4);
  });
});

describe("Nasdaq-100 dataset", () => {
  it("derives each real return from consecutive year-end closes and inflation", () => {
    let previous = nasdaq100.baseYear.close;
    for (const { year, close, inflation, realReturn } of nasdaq100.years) {
      expect(realReturn, String(year)).toBeCloseTo(close / previous / (1 + inflation) - 1, 4);
      previous = close;
    }
  });

  it("matches well-known closes", () => {
    const close = new Map(nasdaq100.years.map((entry) => [entry.year, entry.close]));
    expect(close.get(1999)).toBe(3707.83); // dot-com peak year
    expect(close.get(2002)).toBe(984.36);
    expect(close.get(2024)).toBe(21012.17);
  });
});

describe("inflation shared by both datasets", () => {
  it("uses the same US CPI figure for the same year", () => {
    const world = new Map(msciWorld.years.map((entry) => [entry.year, entry.inflation]));
    for (const { year, inflation } of nasdaq100.years) {
      if (world.has(year)) expect(inflation, String(year)).toBe(world.get(year));
    }
    expect(world.get(2021)).toBeCloseTo(0.07, 2); // 7.0 % in 2021 (BLS)
  });
});
