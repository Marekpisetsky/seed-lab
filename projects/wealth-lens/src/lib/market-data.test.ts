import { describe, expect, it } from "vitest";
import catalogue from "@/data/instruments.json";
import { INDEX_TRACKERS, INSTRUMENTS, instrumentForHolding, latestPriceDate, MARKET } from "./market-data";
import { parseCatalogue, parsePricesFile } from "./market-format";

describe("curated instrument list", () => {
  it("has the three well-known ETFs, one per index, in EUR", () => {
    const etfs = INSTRUMENTS.filter((instrument) => instrument.kind === "etf");
    expect(etfs.map(({ id, index, currency }) => [id, index, currency])).toEqual([
      ["VUAA", "sp500", "EUR"],
      ["VWCE", "world", "EUR"],
      ["EQQQ", "nasdaq100", "EUR"],
    ]);
  });

  it("has 10-12 large stocks, each with the index used to project it", () => {
    const stocks = INSTRUMENTS.filter((instrument) => instrument.kind === "stock");
    expect(stocks.length).toBeGreaterThanOrEqual(10);
    expect(stocks.length).toBeLessThanOrEqual(12);
    expect(stocks.map((stock) => stock.id)).toEqual(expect.arrayContaining(["NVDA", "AAPL", "MSFT", "ASML"]));
  });

  it("lists each tracked ETF under its index", () => {
    for (const instrument of INSTRUMENTS.filter((item) => item.kind === "etf")) {
      expect(INDEX_TRACKERS[instrument.index]).toContain(instrument.id);
    }
  });

  it("fails loudly on a bad or duplicated entry", () => {
    const bad = { ...catalogue, instruments: [{ ...catalogue.instruments[0], index: "dax" }] };
    expect(() => parseCatalogue(bad)).toThrow(/entry 0/);
    const twice = { ...catalogue, instruments: [catalogue.instruments[0], catalogue.instruments[0]] };
    expect(() => parseCatalogue(twice)).toThrow(/duplicate/);
  });
});

describe("instrumentForHolding", () => {
  it("matches the ticker, the Yahoo symbol or its base, in the listing currency", () => {
    expect(instrumentForHolding("vwce", "EUR")?.id).toBe("VWCE");
    expect(instrumentForHolding("VWCE.DE", "EUR")?.id).toBe("VWCE");
    expect(instrumentForHolding("ASML", "EUR")?.id).toBe("ASML");
    expect(instrumentForHolding("NVDA", "USD")?.id).toBe("NVDA");
  });

  it("finds nothing in another currency or for an unknown ticker", () => {
    expect(instrumentForHolding("NVDA", "EUR")).toBeUndefined();
    expect(instrumentForHolding("XYZ", "EUR")).toBeUndefined();
  });
});

describe("parsePricesFile", () => {
  const good = {
    symbol: "VUAA.DE",
    currency: "EUR",
    source: "yahoo",
    date: "2026-09-29",
    close: 113.96,
    change1y: 0.12,
    growth: { from: "2019-05-14", perYear: 0.14 },
  };

  it("keeps valid entries and drops broken ones", () => {
    const file = parsePricesFile({
      version: 1,
      updatedAt: "2026-09-29T22:41:00Z",
      prices: { VUAA: good, BAD: { ...good, close: -1 }, ALSO_BAD: "x" },
    });
    expect(Object.keys(file.prices)).toEqual(["VUAA"]);
    expect(file.updatedAt).toBe("2026-09-29T22:41:00Z");
  });

  it("reads missing optional figures as null", () => {
    const file = parsePricesFile({ prices: { VUAA: { ...good, change1y: "x", growth: {} } } });
    expect(file.prices.VUAA).toMatchObject({ change1y: null, growth: null });
  });

  it("never keeps the closes an older file carried: only figures are used", () => {
    const file = parsePricesFile({ prices: { VUAA: { ...good, spark: [100, 113.96] } } });
    expect(file.prices.VUAA).not.toHaveProperty("spark");
  });

  it("turns anything unreadable into an empty file", () => {
    expect(parsePricesFile(null)).toEqual({ version: 1, updatedAt: null, prices: {} });
  });

  it("gives the latest trading day across instruments", () => {
    const file = parsePricesFile({ prices: { A: good, B: { ...good, date: "2026-09-26" } } });
    expect(latestPriceDate(file)).toBe("2026-09-29");
    expect(latestPriceDate(parsePricesFile(null))).toBeNull();
  });

  it("reads the committed file", () => {
    expect(MARKET.version).toBe(1);
    for (const id of Object.keys(MARKET.prices)) expect(INSTRUMENTS.some((item) => item.id === id)).toBe(true);
  });
});
