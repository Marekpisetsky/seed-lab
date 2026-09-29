import { describe, expect, it } from "vitest";
import { annualizedReturn, INDEXES } from "./indexes";
import { blendedReturns, dividendNote, indexForHolding, periodText, portfolioMix, resolveInvestment, scaleToAverage } from "./investment";
import type { Holding } from "./types";

const holding = (ticker: string, value: number, currency = "EUR"): Holding => ({
  id: ticker,
  ticker,
  quantity: 1,
  costBasis: value,
  currency,
  currentPrice: value,
  priceSource: "manual",
  priceDate: null,
});

describe("indexForHolding", () => {
  it("uses the index a curated ETF tracks, or a stock's closest index", () => {
    expect(indexForHolding({ ticker: "VWCE", currency: "EUR" })).toEqual({ index: "world", assumed: false });
    expect(indexForHolding({ ticker: "NVDA", currency: "USD" })).toEqual({ index: "nasdaq100", assumed: false });
    expect(indexForHolding({ ticker: "BRK-B", currency: "USD" })).toEqual({ index: "sp500", assumed: false });
  });

  it("recognizes other well-known trackers, with or without exchange suffix", () => {
    expect(indexForHolding({ ticker: "CSPX", currency: "USD" })).toEqual({ index: "sp500", assumed: false });
    expect(indexForHolding({ ticker: "IWDA.AS", currency: "EUR" })).toEqual({ index: "world", assumed: false });
    expect(indexForHolding({ ticker: "qqq", currency: "USD" })).toEqual({ index: "nasdaq100", assumed: false });
  });

  it("counts anything else as World, and says so", () => {
    expect(indexForHolding({ ticker: "XYZ", currency: "EUR" })).toEqual({ index: "world", assumed: true });
  });
});

describe("portfolioMix", () => {
  it("weights each index by the value of its holdings in euros", () => {
    const mix = portfolioMix([holding("VUAA", 6000), holding("SXR8", 2000), holding("VWCE", 2000)]);
    expect(mix.total).toBe(10_000);
    expect(mix.weights).toEqual([
      { index: "sp500", value: 8000, weight: 0.8 },
      { index: "world", value: 2000, weight: 0.2 },
    ]);
    expect(mix.assumedWorld).toEqual([]);
  });

  it("leaves out holdings without a price or in another currency", () => {
    const unpriced = { ...holding("EQQQ", 0), currentPrice: null };
    const mix = portfolioMix([holding("VWCE", 3000), unpriced, holding("NVDA", 5000, "USD")]);
    expect(mix.weights).toEqual([{ index: "world", value: 3000, weight: 1 }]);
  });

  it("lists the tickers it had to count as World", () => {
    expect(portfolioMix([holding("XYZ", 100), holding("VWCE", 100)]).assumedWorld).toEqual(["XYZ"]);
  });
});

describe("blendedReturns", () => {
  it("is the index's own history for a single index", () => {
    const { years } = blendedReturns([{ index: "world", weight: 1 }]);
    expect(years).toEqual(INDEXES.world.years);
  });

  it("mixes yearly returns over the years every index covers", () => {
    const { years } = blendedReturns([
      { index: "sp500", weight: 0.5 },
      { index: "nasdaq100", weight: 0.5 },
    ]);
    // Every index is used over the years all three share.
    expect([years[0].year, years.at(-1)?.year]).toEqual([1988, 2022]);
    const year2008 = years.find((entry) => entry.year === 2008)?.realReturn;
    const sp = INDEXES.sp500.years.find((entry) => entry.year === 2008)?.realReturn ?? NaN;
    const ndx = INDEXES.nasdaq100.years.find((entry) => entry.year === 2008)?.realReturn ?? NaN;
    expect(year2008).toBeCloseTo((sp + ndx) / 2, 12);
  });
});

describe("scaleToAverage", () => {
  it("keeps the ups and downs but averages exactly the target", () => {
    const scaled = scaleToAverage([0.2, -0.1, 0.05], 0.04);
    expect(annualizedReturn(scaled)).toBeCloseTo(0.04, 12);
    expect(scaled[0]).toBeGreaterThan(scaled[2]);
    expect(scaled[1]).toBeLessThan(0);
  });
});

describe("resolveInvestment", () => {
  it("uses an index's own average and history", () => {
    const resolved = resolveInvestment({ kind: "index", index: "nasdaq100" }, []);
    expect(resolved).toMatchObject({ name: "Nasdaq-100", period: [1988, 2022], proxyIndex: null, withoutDividends: 1 });
    expect(resolved.realReturn).toBeCloseTo(INDEXES.nasdaq100.averageReturn, 12);
    expect(resolved.returns).toHaveLength(35);
  });

  it("projects a single stock with its closest index, never its own past", () => {
    const resolved = resolveInvestment({ kind: "stock", id: "NVDA" }, []);
    expect(resolved).toMatchObject({ name: "NVIDIA", proxyIndex: "nasdaq100" });
    expect(resolved.realReturn).toBe(INDEXES.nasdaq100.averageReturn);
  });

  it("weights the portfolio's growth by holding value", () => {
    const resolved = resolveInvestment({ kind: "portfolio" }, [holding("VUAA", 5000), holding("EQQQ", 5000)]);
    const { years } = blendedReturns([
      { index: "sp500", weight: 0.5 },
      { index: "nasdaq100", weight: 0.5 },
    ]);
    expect(resolved.name).toBe("My portfolio");
    expect(resolved.realReturn).toBeCloseTo(annualizedReturn(years.map((entry) => entry.realReturn)), 12);
    expect(resolved.period).toEqual([1988, 2022]);
    expect(resolved.mix?.weights.map((weight) => weight.weight)).toEqual([0.5, 0.5]);
    // Half of it is the Nasdaq-100, whose figures leave dividends out.
    expect(resolved.withoutDividends).toBe(0.5);
  });

  it("uses the typed rate, with the S&P 500's ups and downs scaled to it", () => {
    const resolved = resolveInvestment({ kind: "custom", realReturn: 0.05 }, []);
    expect(resolved.realReturn).toBe(0.05);
    expect(annualizedReturn(resolved.returns)).toBeCloseTo(0.05, 12);
    expect(resolved.period).toEqual([1988, 2022]);
    expect(resolved.withoutDividends).toBe(0);
  });

  it("keys each history, so simulations can be cached", () => {
    expect(resolveInvestment({ kind: "index", index: "world" }, []).key).toBe("index:world");
    expect(resolveInvestment({ kind: "stock", id: "NVDA" }, []).key).toBe("index:nasdaq100");
    expect(resolveInvestment({ kind: "custom", realReturn: 0.05 }, []).key).toBe("custom:0.0500");
    expect(resolveInvestment({ kind: "portfolio" }, [holding("VUAA", 3000), holding("EQQQ", 1000)]).key).toBe(
      "mix:sp500=0.750,nasdaq100=0.250",
    );
  });

  it("falls back to the S&P 500 when the choice cannot be used", () => {
    expect(resolveInvestment({ kind: "portfolio" }, []).investment).toEqual({ kind: "index", index: "sp500" });
    expect(resolveInvestment({ kind: "stock", id: "GONE" }, []).name).toBe("S&P 500");
    expect(resolveInvestment({ kind: "stock", id: "VWCE" }, []).name).toBe("S&P 500"); // an ETF is not a stock
  });
});

describe("periodText and dividendNote", () => {
  it("say where a growth figure comes from", () => {
    expect(periodText(resolveInvestment({ kind: "index", index: "world" }, []))).toBe("1988–2022");
    expect(dividendNote(resolveInvestment({ kind: "index", index: "world" }, []))).toBeNull();
    expect(dividendNote(resolveInvestment({ kind: "index", index: "nasdaq100" }, []))).toBe(
      "price only: dividends (roughly 1% a year) not included",
    );
    expect(dividendNote({ withoutDividends: 0.3 })).toBe("the Nasdaq-100 part is price only: dividends (roughly 1% a year) not included");
  });
});
