import { describe, expect, it } from "vitest";
import { EN } from "@/i18n";
import { SERIES } from "./indexes";
import { resolveInvestment } from "./investment";
import { MARKET } from "./market-data";
import { defaultReference, portfolioAllocation, portfolioInputs, referenceFor } from "./portfolio";
import type { Holding } from "./types";

const holding = (ticker: string, value: number, currency = "EUR", reference?: Holding["reference"]): Holding => ({
  id: ticker,
  ticker,
  quantity: 1,
  costBasis: value,
  currency,
  currentPrice: value,
  priceSource: "manual",
  priceDate: null,
  ...(reference ? { reference } : {}),
});

describe("what each holding grows like", () => {
  it("is the index of a stock's market: US tech on the Nasdaq-100, other US stocks the S&P 500, European ones World", () => {
    expect(defaultReference({ ticker: "NVDA", currency: "USD" })).toEqual({ asset: "nasdaq100", assumed: false });
    expect(defaultReference({ ticker: "BRK-B", currency: "USD" })).toEqual({ asset: "sp500", assumed: false });
    expect(defaultReference({ ticker: "SAP", currency: "EUR" })).toEqual({ asset: "world", assumed: false });
  });

  it("is what a fund holds: an index ETF its index, a bond ETF bonds, a gold ETC gold", () => {
    expect(defaultReference({ ticker: "VWCE", currency: "EUR" })).toEqual({ asset: "world", assumed: false });
    expect(defaultReference({ ticker: "CSPX", currency: "USD" })).toEqual({ asset: "sp500", assumed: false });
    expect(defaultReference({ ticker: "qqq", currency: "USD" })).toEqual({ asset: "nasdaq100", assumed: false });
    expect(defaultReference({ ticker: "IEGA", currency: "EUR" })).toEqual({ asset: "bonds", assumed: false });
    expect(defaultReference({ ticker: "4GLD.DE", currency: "EUR" })).toEqual({ asset: "gold", assumed: false });
  });

  it("is World for anything else, marked as a guess", () => {
    expect(defaultReference({ ticker: "XYZ", currency: "EUR" })).toEqual({ asset: "world", assumed: true });
  });

  it("is the user's choice when there is one", () => {
    expect(referenceFor(holding("XYZ", 100, "EUR", "gold"))).toEqual({ asset: "gold", assumed: false, chosen: true });
    expect(referenceFor(holding("NVDA", 100, "USD", "sp500"))).toEqual({ asset: "sp500", assumed: false, chosen: true });
    expect(referenceFor(holding("NVDA", 100, "USD"))).toEqual({ asset: "nasdaq100", assumed: false, chosen: false });
  });
});

describe("the portfolio's allocation", () => {
  it("weights each holding by its value in euros, leaving out other currencies and unpriced holdings", () => {
    const unpriced = { ...holding("EQQQ", 0), currentPrice: null };
    const allocation = portfolioAllocation([holding("VUAA", 6000), holding("IEGA", 3000), holding("4GLD", 1000), unpriced, holding("NVDA", 5000, "USD")]);
    expect(allocation.total).toBe(10_000);
    expect(allocation.entries.map((entry) => [entry.holding.ticker, entry.asset, entry.weight])).toEqual([
      ["VUAA", "sp500", 0.6],
      ["IEGA", "bonds", 0.3],
      ["4GLD", "gold", 0.1],
    ]);
    expect(allocation.left.map((entry) => entry.ticker)).toEqual(["EQQQ", "NVDA"]);
  });

  it("keeps a curated stock apart, with its own ups and downs, while it grows like a stock index", () => {
    const allocation = portfolioAllocation([holding("ASML", 4000), holding("VWCE", 6000)]);
    expect(allocation.entries[0]).toMatchObject({ asset: "nasdaq100", stock: { id: "ASML" } });
    expect(portfolioInputs(allocation)).toEqual([
      { asset: "nasdaq100", weight: 40, stock: allocation.entries[0].stock },
      { asset: "world", weight: 60 },
    ]);
    // Moved to gold by the user, it is simply gold.
    const moved = portfolioAllocation([holding("ASML", 4000, "EUR", "gold"), holding("VWCE", 6000)]);
    expect(moved.entries[0]).toMatchObject({ asset: "gold", stock: null, chosen: true });
  });

  it("merges holdings that grow like the same asset", () => {
    expect(portfolioInputs(portfolioAllocation([holding("VUAA", 5000), holding("CSPX", 5000, "EUR")]))).toEqual([{ asset: "sp500", weight: 100 }]);
  });
});

describe("the portfolio as a projection", () => {
  it("grows at the weighted average of what the holdings grow like, never a stock's own past", () => {
    const resolved = resolveInvestment({ kind: "portfolio" }, [holding("ASML", 4000), holding("IEGA", 6000)]);
    expect(resolved.realReturn).toBeCloseTo(0.4 * SERIES.nasdaq100.averageReturn + 0.6 * SERIES.bonds.averageReturn, 12);
    // ASML swings as much as its daily closes say.
    const stockPart = resolved.model?.parts.find((part) => part.kind === "stock");
    expect(stockPart).toMatchObject({ kind: "stock", volatility: MARKET.prices.ASML.stats?.volatility });
  });

  it("follows the user's choice of what a holding grows like", () => {
    const standard = resolveInvestment({ kind: "portfolio" }, [holding("XYZ", 1000)]);
    const gold = resolveInvestment({ kind: "portfolio" }, [holding("XYZ", 1000, "EUR", "gold")]);
    expect(standard.realReturn).toBeCloseTo(SERIES.world.averageReturn, 12);
    expect(gold.realReturn).toBeCloseTo(SERIES.gold.averageReturn, 12);
  });

  it("says it is a simple projection", () => {
    expect(EN.m.portfolio.label).toBe("Simple projection: each stock grows like its index. Stocks can't be predicted.");
  });
});
