import { describe, expect, it } from "vitest";
import euroBonds from "@/data/euro-bonds-real-returns.json";
import gold from "@/data/gold-real-returns.json";
import msciWorld from "@/data/msci-world-real-returns.json";
import nasdaq100 from "@/data/nasdaq100-real-returns.json";
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

describe("MSCI World dataset", () => {
  it("publishes only real returns and the inflation behind them", () => {
    for (const entry of msciWorld.years) expect(Object.keys(entry).sort()).toEqual(["inflation", "realReturn", "year"]);
  });

  it("compounds to the annualized returns printed on MSCI's factsheets", () => {
    const nominal = beforeInflation(msciWorld.years);
    const annualized = (from: number, to: number) => {
      const returns = [];
      for (let year = from; year <= to; year++) returns.push(nominal.get(year) ?? NaN);
      return annualizedReturn(returns);
    };
    // Factsheet of December 2024: 3, 5 and 10 years (to about 0.01 point: real returns keep 4 decimals).
    expect(annualized(2022, 2024)).toBeCloseTo(0.0634, 3);
    expect(annualized(2020, 2024)).toBeCloseTo(0.1117, 3);
    expect(annualized(2015, 2024)).toBeCloseTo(0.0995, 3);
    // Factsheets of December 2019 and December 2014.
    expect(annualized(2010, 2019)).toBeCloseTo(0.0947, 3);
    expect(annualized(2005, 2014)).toBeCloseTo(0.0603, 3);
  });
});

describe("Nasdaq-100 dataset", () => {
  it("publishes only real returns and the inflation behind them", () => {
    for (const entry of nasdaq100.years) expect(Object.keys(entry).sort()).toEqual(["inflation", "realReturn", "year"]);
  });

  it("matches well-known moves of the index", () => {
    const nominal = beforeInflation(nasdaq100.years);
    // The dot-com crash: from the 1999 close to the 2002 close, about −73.5%.
    expect(compounded(nominal, 2000, 2002)).toBeCloseTo(-0.7345, 2);
    // 2008: about −41.9%.
    expect(nominal.get(2008)).toBeCloseTo(-0.4189, 3);
  });
});

describe("SERIES: the other assets with a history", () => {
  it("has euro government bonds and gold beside the three indexes, over the same years", () => {
    expect(SERIES_IDS).toEqual(["sp500", "world", "nasdaq100", "bonds", "gold"]);
    for (const id of SERIES_IDS) {
      expect([SERIES[id].firstYear, SERIES[id].lastYear], id).toEqual([1988, 2022]);
      expect(SERIES[id].years, id).toHaveLength(35);
    }
    expect([SERIES.bonds.dataset.firstYear, SERIES.bonds.dataset.lastYear]).toEqual([1988, 2024]);
    expect([SERIES.gold.dataset.firstYear, SERIES.gold.dataset.lastYear]).toEqual([1988, 2024]);
  });

  it("gives bonds a modest real return and gold a low one, both below stocks", () => {
    expect(SERIES.bonds.averageReturn).toBeCloseTo(0.0247, 3);
    expect(SERIES.gold.averageReturn).toBeCloseTo(0.0106, 3);
    for (const id of INDEX_IDS) {
      expect(SERIES.bonds.averageReturn).toBeLessThan(INDEXES[id].averageReturn);
      expect(SERIES.gold.averageReturn).toBeLessThan(INDEXES[id].averageReturn);
    }
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
  it("publishes only real returns and the inflation behind them", () => {
    for (const entry of gold.years) expect(Object.keys(entry).sort()).toEqual(["inflation", "realReturn", "year"]);
  });

  it("deflates by the same US inflation as the index datasets", () => {
    const us = new Map(nasdaq100.years.map((entry) => [entry.year, entry.inflation]));
    for (const { year, inflation } of gold.years) expect(inflation, String(year)).toBe(us.get(year));
  });

  it("shows gold's long flat spells and big swings", () => {
    const nominal = beforeInflation(gold.years);
    const real = new Map(gold.years.map((entry) => [entry.year, entry.realReturn]));
    // Under its end-of-1987 price for about twenty years, then the 2013 crash.
    expect(compounded(nominal, 1988, 1999)).toBeLessThan(0);
    expect(compounded(nominal, 1988, 2005)).toBeGreaterThan(0);
    expect(real.get(2013)).toBeLessThan(-0.25);
    // From the end of 2000 to the end of 2011, the price rose about 5.6 times (×5.62).
    expect(compounded(nominal, 2001, 2011)).toBeCloseTo(4.615, 1);
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
