import { describe, expect, it } from "vitest";
import euroBonds from "@/data/euro-bonds-real-returns.json";
import gold from "@/data/gold-real-returns.json";
import { annualizedReturn, COMMON_PERIOD, commonPeriod, INDEXES, INDEX_IDS, parseReturns, SERIES, SERIES_IDS } from "./indexes";

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
  it("is US stocks alone: the one stock series whose data may be published", () => {
    expect(INDEX_IDS).toEqual(["sp500"]);
    expect(INDEXES.sp500.priceOnly).toBe(false);
  });

  it("keeps the whole dataset: decades of history", () => {
    expect([INDEXES.sp500.dataset.firstYear, INDEXES.sp500.dataset.lastYear]).toEqual([1928, 2022]);
    expect(INDEXES.sp500.dataset.averageReturn).toBeCloseTo(0.0658, 3);
  });

  it("compares every series over the longest period they share", () => {
    expect(COMMON_PERIOD).toEqual([1988, 2022]);
    for (const id of SERIES_IDS) {
      expect([SERIES[id].firstYear, SERIES[id].lastYear], id).toEqual([1988, 2022]);
      expect(SERIES[id].years, id).toHaveLength(35);
      expect(SERIES[id].averageReturn, id).toBeCloseTo(annualizedReturn(SERIES[id].years.map((entry) => entry.realReturn)), 12);
    }
  });

  it("gives US stocks a real average over 1988–2022 in the expected range", () => {
    expect(INDEXES.sp500.averageReturn).toBeCloseTo(0.0754, 3);
  });

  it("reflects the big crashes", () => {
    const real = (year: number) => INDEXES.sp500.dataset.years.find((entry) => entry.year === year)?.realReturn;
    expect(real(1931)).toBeLessThan(-0.35);
    expect(real(2008)).toBeLessThan(-0.35);
  });
});

/**
 * The files publish only the real returns worked out from each source's
 * figures, with the inflation used (the sources' terms do not allow
 * redistributing their own figures). Putting inflation back and compounding
 * must give well-known published results, which catches a hand edit that
 * breaks the link.
 */
const beforeInflation = (years: readonly { year: number; inflation: number; realReturn: number }[]) =>
  new Map(years.map((entry) => [entry.year, (1 + entry.realReturn) * (1 + entry.inflation) - 1]));
const compounded = (returns: ReadonlyMap<number, number>, from: number, to: number) => {
  let growth = 1;
  for (let year = from; year <= to; year++) growth *= 1 + (returns.get(year) ?? NaN);
  return growth - 1;
};

describe("SERIES: the other assets with a history", () => {
  it("has German government bonds and gold beside US stocks, over the same years", () => {
    expect(SERIES_IDS).toEqual(["sp500", "bonds", "gold"]);
    for (const id of SERIES_IDS) {
      expect([SERIES[id].firstYear, SERIES[id].lastYear], id).toEqual([1988, 2022]);
      expect(SERIES[id].years, id).toHaveLength(35);
    }
    expect([SERIES.bonds.dataset.firstYear, SERIES.bonds.dataset.lastYear]).toEqual([1988, 2024]);
    expect([SERIES.gold.dataset.firstYear, SERIES.gold.dataset.lastYear]).toEqual([1988, 2024]);
  });

  it("gives bonds a modest real return and gold a low one, both below stocks", () => {
    expect(SERIES.bonds.averageReturn).toBeCloseTo(0.0247, 3);
    expect(SERIES.gold.averageReturn).toBeLessThan(SERIES.bonds.averageReturn);
    expect(SERIES.bonds.averageReturn).toBeLessThan(INDEXES.sp500.averageReturn);
  });
});

/** The price of a bond paying `coupon` a year for `years` more years, at `rate`, per 1 of face value. */
function bondPrice(coupon: number, rate: number, years: number): number {
  if (Math.abs(rate) < 1e-12) return coupon * years + 1;
  const discount = Math.pow(1 + rate, -years);
  return (coupon * (1 - discount)) / rate + discount;
}

describe("Euro government bonds dataset", () => {
  it("derives each year from the December yields and German inflation stored beside it", () => {
    let previous = euroBonds.baseYear.yield;
    for (const { year, yield: rate, inflation, nominalReturn, realReturn } of euroBonds.years) {
      // Bought at par at last December's yield, sold a year later with 9 years left at this December's.
      const expected = previous + bondPrice(previous, rate, 9) - 1;
      expect(nominalReturn, String(year)).toBeCloseTo(expected, 4);
      expect(realReturn, String(year)).toBeCloseTo((1 + nominalReturn) / (1 + inflation) - 1, 4);
      previous = rate;
    }
  });

  it("shows the well-known bond years", () => {
    const real = new Map(euroBonds.years.map((entry) => [entry.year, entry.realReturn]));
    const nominal = new Map(euroBonds.years.map((entry) => [entry.year, entry.nominalReturn]));
    // 1994 and 1999: rates jumped; 2022: the worst year for euro bonds in decades, with 8.6 % inflation.
    expect(nominal.get(1994)).toBeLessThan(-0.04);
    expect(nominal.get(1999)).toBeLessThan(-0.04);
    expect(Math.min(...real.values())).toBe(real.get(2022));
    expect(real.get(2022)).toBeLessThan(-0.25);
    // 2008 and 2014: flight to safety, then falling rates.
    expect(nominal.get(2008)).toBeGreaterThan(0.12);
    expect(nominal.get(2014)).toBeGreaterThan(0.12);
  });

  it("records yields that went below zero, as Bunds' did from 2019 to 2021", () => {
    const yields = new Map(euroBonds.years.map((entry) => [entry.year, entry.yield]));
    for (const year of [2019, 2020, 2021]) expect(yields.get(year), String(year)).toBeLessThan(0);
    expect(euroBonds.years.find((entry) => entry.year === 2022)?.inflation).toBe(0.086); // Destatis, December 2022
  });
});

describe("Gold dataset", () => {
  it("publishes only real returns and the inflation behind them, with its World Bank source and licence", () => {
    for (const entry of gold.years) expect(Object.keys(entry).sort()).toEqual(["inflation", "realReturn", "year"]);
    expect(gold.source).toMatch(/^World Bank, Commodity Price Data/);
    expect(gold.license).toMatch(/CC BY 4\.0/);
  });

  it("recomputes every year from the December prices kept beside it", () => {
    const prices = gold.decemberPrices as Record<string, number>;
    for (const { year, inflation, realReturn } of gold.years) {
      const nominal = prices[String(year)] / prices[String(year - 1)] - 1;
      expect(realReturn, String(year)).toBeCloseTo((1 + nominal) / (1 + inflation) - 1, 4);
    }
  });

  it("shows gold's long flat spells and big swings", () => {
    const nominal = beforeInflation(gold.years);
    const real = new Map(gold.years.map((entry) => [entry.year, entry.realReturn]));
    // Under its end-of-1987 price for about twenty years, then the 2013 crash.
    expect(compounded(nominal, 1988, 1999)).toBeLessThan(0);
    expect(compounded(nominal, 1988, 2007)).toBeGreaterThan(0);
    expect(real.get(2013)).toBeLessThan(-0.25);
    // From the end of 2000 to the end of 2011, the price rose about six times.
    expect(compounded(nominal, 2001, 2011)).toBeGreaterThan(4);
  });
});
