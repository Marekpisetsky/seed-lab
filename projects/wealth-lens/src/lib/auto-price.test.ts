import { describe, expect, it } from "vitest";
import { marketPrice, priceHoldings } from "./auto-price";
import { parsePricesFile } from "./market-format";
import type { Holding } from "./types";

const entry = (currency: string, close: number) => ({
  symbol: "X",
  currency,
  source: "yahoo",
  date: "2026-09-25",
  close,
  change1y: null,
  spark: [],
  growth: null,
});
const market = parsePricesFile({ prices: { VWCE: entry("EUR", 131.5), NVDA: entry("USD", 180.2) } });

const holding: Holding = {
  id: "1",
  ticker: "VWCE",
  quantity: 10,
  costBasis: 1000,
  currency: "EUR",
  currentPrice: null,
  priceSource: "auto",
  priceDate: null,
};

describe("marketPrice", () => {
  it("finds the latest close of a curated instrument in the holding's currency", () => {
    expect(marketPrice(holding, market)).toEqual({ close: 131.5, date: "2026-09-25" });
    expect(marketPrice({ ticker: "nvda", currency: "USD" }, market)).toEqual({ close: 180.2, date: "2026-09-25" });
  });

  it("has nothing for other currencies, unknown tickers or instruments not downloaded yet", () => {
    expect(marketPrice({ ticker: "NVDA", currency: "EUR" }, market)).toBeNull();
    expect(marketPrice({ ticker: "XYZ", currency: "EUR" }, market)).toBeNull();
    expect(marketPrice({ ticker: "EQQQ", currency: "EUR" }, market)).toBeNull();
  });
});

describe("priceHoldings", () => {
  it("fills an automatic price with the latest close and its date", () => {
    expect(priceHoldings([holding], {}, market)[0]).toMatchObject({ currentPrice: 131.5, priceDate: "2026-09-25" });
  });

  it("never replaces a price typed by the user", () => {
    const typed = { ...holding, currentPrice: 120, priceSource: "manual" as const };
    expect(priceHoldings([typed], {}, market)[0]).toBe(typed);
  });

  it("leaves holdings without market data, or already up to date, as they are", () => {
    const unknown = { ...holding, ticker: "XYZ" };
    const current = { ...holding, currentPrice: 131.5, priceDate: "2026-09-25" };
    const [a, b] = priceHoldings([unknown, current], {}, market);
    expect(a).toBe(unknown);
    expect(b).toBe(current);
  });

  it("uses the last close of the user's price file for a ticker without downloaded prices", () => {
    const unknown = { ...holding, ticker: "XYZ" };
    const uploaded = { XYZ: { fileName: "xyz.csv", points: [{ time: "2026-09-24", close: 9 }, { time: "2026-09-25", close: 10 }] } };
    expect(priceHoldings([unknown], uploaded, market)[0]).toMatchObject({ currentPrice: 10, priceDate: "2026-09-25" });
    // Downloaded prices win over a file.
    expect(priceHoldings([holding], { VWCE: uploaded.XYZ }, market)[0].currentPrice).toBe(131.5);
  });
});
