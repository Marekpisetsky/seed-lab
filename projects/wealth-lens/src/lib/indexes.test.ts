import { describe, expect, it } from "vitest";
import msciWorld from "@/data/msci-world-real-returns.json";
import nasdaq100 from "@/data/nasdaq100-real-returns.json";
import { annualizedReturn, COMMON_PERIOD, commonPeriod, INDEXES, INDEX_IDS, parseReturns } from "./indexes";

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

describe("commonPeriod", () => {
  const run = (from: number, to: number) => Array.from({ length: to - from + 1 }, (_, index) => ({ year: from + index, realReturn: 0 }));

  it("is the latest start and the earliest end", () => {
    expect(commonPeriod([run(1928, 2022), run(1988, 2024), run(1986, 2024)])).toEqual([1988, 2022]);
  });

  it("fails loudly when the datasets share fewer than 20 years", () => {
    expect(() => commonPeriod([run(1950, 1980), run(1970, 2020)])).toThrow(/fewer than 20 years/);
  });
});

describe("INDEXES", () => {
  it("has the three ETFs a European investor knows best", () => {
    expect(INDEX_IDS.map((id) => INDEXES[id].etf)).toEqual(["VUAA", "VWCE", "EQQQ"]);
  });

  it("keeps each whole dataset: decades of history", () => {
    expect([INDEXES.sp500.dataset.firstYear, INDEXES.sp500.dataset.lastYear]).toEqual([1928, 2022]);
    expect([INDEXES.world.dataset.firstYear, INDEXES.world.dataset.lastYear]).toEqual([1988, 2024]);
    expect([INDEXES.nasdaq100.dataset.firstYear, INDEXES.nasdaq100.dataset.lastYear]).toEqual([1986, 2024]);
    expect(INDEXES.sp500.dataset.averageReturn).toBeCloseTo(0.0658, 3);
    expect(INDEXES.world.dataset.averageReturn).toBeCloseTo(0.0512, 3);
    expect(INDEXES.nasdaq100.dataset.averageReturn).toBeCloseTo(0.1082, 3);
  });

  it("compares all three over the longest period they share", () => {
    expect(COMMON_PERIOD).toEqual([1988, 2022]);
    for (const id of INDEX_IDS) {
      expect([INDEXES[id].firstYear, INDEXES[id].lastYear], id).toEqual([1988, 2022]);
      expect(INDEXES[id].years, id).toHaveLength(35);
      expect(INDEXES[id].averageReturn, id).toBeCloseTo(annualizedReturn(INDEXES[id].years.map((entry) => entry.realReturn)), 12);
    }
  });

  it("gives real averages over 1988–2022 in the expected ranges", () => {
    expect(INDEXES.sp500.averageReturn).toBeCloseTo(0.0754, 3);
    expect(INDEXES.world.averageReturn).toBeCloseTo(0.0445, 3);
    expect(INDEXES.nasdaq100.averageReturn).toBeCloseTo(0.099, 3);
  });

  it("says which figures leave dividends out", () => {
    expect(INDEX_IDS.filter((id) => INDEXES[id].priceOnly)).toEqual(["nasdaq100"]);
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
