import { describe, expect, it } from "vitest";
import { KNOWN_SYMBOLS, priceSymbolCandidates, toYahooSymbol, yahooToStooq } from "./symbols";
import { normalizeYahooSymbol } from "./yahoo";

describe("priceSymbolCandidates", () => {
  it("maps well-known European tickers to their EUR listing on Yahoo", () => {
    expect(priceSymbolCandidates("VWCE", "EUR")).toEqual(["VWCE.DE"]);
    expect(priceSymbolCandidates("vuaa", "EUR")).toEqual(["VUAA.DE"]);
    expect(priceSymbolCandidates("EQQQ", "EUR")).toEqual(["EQQQ.DE"]);
    expect(priceSymbolCandidates("ASML", "EUR")).toEqual(["ASML.AS"]);
  });

  it("never maps a known European ticker to a US listing", () => {
    expect(priceSymbolCandidates("VUAA", "USD")).toEqual(["VUAA.DE"]);
  });

  it("uses no suffix for US shares", () => {
    expect(priceSymbolCandidates("AAPL", "USD")).toEqual(["AAPL"]);
  });

  it("tries the European listing first for other EUR holdings, then the US one", () => {
    expect(priceSymbolCandidates("XYZ", "EUR")).toEqual(["XYZ.DE", "XYZ"]);
  });

  it("guesses by currency for other markets", () => {
    expect(priceSymbolCandidates("BARC", "GBX")).toEqual(["BARC.L", "BARC"]);
    expect(priceSymbolCandidates("7203", "JPY")).toEqual(["7203.T", "7203"]);
    expect(priceSymbolCandidates("NESN", "CHF")).toEqual(["NESN.SW", "NESN"]);
    expect(priceSymbolCandidates("ABC", "SEK")).toEqual(["ABC"]);
  });

  it("respects explicit symbols and user overrides", () => {
    expect(priceSymbolCandidates("vwce.de", "EUR")).toEqual(["VWCE.DE"]);
    expect(priceSymbolCandidates("^GSPC", "USD")).toEqual(["^GSPC"]);
    expect(priceSymbolCandidates("VWCE", "EUR", "VWCE.MI")).toEqual(["VWCE.MI"]);
  });

  it("only contains valid Yahoo symbols", () => {
    for (const symbol of Object.values(KNOWN_SYMBOLS)) expect(normalizeYahooSymbol(symbol), symbol).toBe(symbol);
  });
});

describe("yahooToStooq", () => {
  it("translates the notation for markets Stooq covers", () => {
    expect(yahooToStooq("AAPL")).toBe("aapl.us");
    expect(yahooToStooq("VWCE.DE")).toBe("vwce.de");
    expect(yahooToStooq("VUSA.L")).toBe("vusa.uk");
    expect(yahooToStooq("7203.T")).toBe("7203.jp");
  });

  it("maps Euronext listings to the same security on Xetra", () => {
    expect(yahooToStooq("ASML.AS")).toBe("asme.de");
    expect(yahooToStooq("IWDA.AS")).toBe("eunl.de");
  });

  it("has no equivalent for other markets or indices", () => {
    expect(yahooToStooq("NESN.SW")).toBeNull();
    expect(yahooToStooq("ENEL.MI")).toBeNull();
    expect(yahooToStooq("^GSPC")).toBeNull();
  });
});

describe("toYahooSymbol", () => {
  it("converts symbols saved in Stooq notation by earlier versions", () => {
    expect(toYahooSymbol("aapl.us")).toBe("AAPL");
    expect(toYahooSymbol("vwce.de")).toBe("VWCE.DE");
    expect(toYahooSymbol("vusa.uk")).toBe("VUSA.L");
    expect(toYahooSymbol("asme.de")).toBe("ASME.DE");
  });

  it("keeps Yahoo symbols and rejects junk", () => {
    expect(toYahooSymbol("ASML.AS")).toBe("ASML.AS");
    expect(toYahooSymbol("not a symbol!")).toBeNull();
  });
});
