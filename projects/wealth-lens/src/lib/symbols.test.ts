import { describe, expect, it } from "vitest";
import { isValidStooqSymbol, stooqQuoteCurrency } from "./prices";
import { KNOWN_STOOQ_SYMBOLS, stooqCandidates } from "./symbols";

describe("stooqCandidates", () => {
  it("maps well-known European tickers to their EUR listing", () => {
    expect(stooqCandidates("VWCE", "EUR")).toEqual(["vwce.de"]);
    expect(stooqCandidates("vuaa", "EUR")).toEqual(["vuaa.de"]);
    expect(stooqCandidates("EQQQ", "EUR")).toEqual(["eqqq.de"]);
    expect(stooqCandidates("ASML", "EUR")).toEqual(["asme.de"]);
    expect(stooqCandidates("IWDA", "EUR")).toEqual(["eunl.de"]);
  });

  it("never maps a known European ticker to a US listing", () => {
    expect(stooqCandidates("VUAA", "USD")).toEqual(["vuaa.de"]);
  });

  it("tries the European listing first for other EUR holdings, then the US one", () => {
    expect(stooqCandidates("XYZ", "EUR")).toEqual(["xyz.de", "xyz.us"]);
  });

  it("guesses by currency for other markets", () => {
    expect(stooqCandidates("AAPL", "USD")).toEqual(["aapl.us"]);
    expect(stooqCandidates("VUSA", "GBP")).toEqual(["vusa.de"]);
    expect(stooqCandidates("BARC", "GBX")).toEqual(["barc.uk", "barc.us"]);
    expect(stooqCandidates("7203", "JPY")).toEqual(["7203.jp", "7203.us"]);
    expect(stooqCandidates("NESN", "CHF")).toEqual(["nesn.us"]);
  });

  it("respects explicit symbols and user overrides", () => {
    expect(stooqCandidates("VWCE.DE", "EUR")).toEqual(["vwce.de"]);
    expect(stooqCandidates("^SPX", "USD")).toEqual(["^spx"]);
    expect(stooqCandidates("VWCE", "EUR", "vwce.f")).toEqual(["vwce.f"]);
  });

  it("only contains valid Stooq symbols quoted in EUR", () => {
    for (const symbol of Object.values(KNOWN_STOOQ_SYMBOLS)) {
      expect(isValidStooqSymbol(symbol), symbol).toBe(true);
      expect(stooqQuoteCurrency(symbol), symbol).toBe("EUR");
    }
  });
});
