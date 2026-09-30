import { describe, expect, it } from "vitest";
import { EN, getI18n } from "@/i18n";
import { problemText } from "../problems";
import type { Holding } from "../types";
import { importHoldingsCsv, mergeImportedHoldings, type ImportOutcome } from "./index";

const T212_HEADER =
  "Action,Time,ISIN,Ticker,Name,Notes,ID,No. of shares,Price / share,Currency (Price / share)," +
  "Exchange rate,Result,Currency (Result),Total,Currency (Total),Withholding tax," +
  "Currency (Withholding tax),Currency conversion fee,Currency (Currency conversion fee)";

/** Shaped like a real Trading 212 History → Export file (EUR account). */
const T212_EXPORT = [
  T212_HEADER,
  'Deposit,2024-01-02 09:00:00,,,,"Bank Transfer",D1,,,,,,,1000.00,EUR,,,,', // line 2
  'Market buy,2024-01-03 15:31:12,US0378331005,AAPL,"Apple Inc.",,E1,2.0000000000,185.00,USD,1.09500,,,338.44,EUR,,,0.51,EUR', // 3
  'Market buy,2024-01-04 10:02:00.123,IE00BK5BQT80,VWCE,"Vanguard FTSE All-World (Acc)",,E2,3.0000000000,105.20,EUR,1.00000,,,315.60,EUR,,,,', // 4
  'Limit buy,2024-02-01 16:00:00,US0378331005,AAPL,"Apple Inc.",,E3,1.0000000000,190.00,USD,1.08000,,,176.19,EUR,,,0.26,EUR', // 5
  'Market sell,2024-03-01 16:00:00,US0378331005,AAPL,"Apple Inc.",,E4,1.5000000000,180.00,USD,1.09000,-10.00,EUR,247.33,EUR,,,0.37,EUR', // 6
  'Dividend (Dividend),2024-03-15 12:00:00,US0378331005,AAPL,"Apple Inc.",,,1.5000000000,0.24,USD,,,,0.30,EUR,0.05,USD,,', // 7
  "Interest on cash,2024-03-31 00:00:00,,,,,,,,,,,,0.50,EUR,,,,", // 8
  'Market buy,2024-04-01 10:00:00,IE00BK5BQT80,VWCE,"Vanguard FTSE All-World (Acc)",,E5,abc,110.00,EUR,1.00000,,,110.00,EUR,,,,', // 9
  'Stock split open,2024-06-10 00:00:00,US67066G1040,NVDA,"NVIDIA",,,10.0000000000,100.00,USD,,,,,,,,,', // 10
].join("\n");

function expectOk(outcome: ImportOutcome) {
  if (!outcome.ok) throw new Error(`expected ok, got: ${outcome.error.code}`);
  return outcome;
}

describe("Trading 212 import", () => {
  it("rebuilds open positions from buys and sells with the average-cost method", () => {
    const result = expectOk(importHoldingsCsv(T212_EXPORT));
    expect(result.format).toBe("trading212");
    expect(result.rowCount).toBe(9);
    expect(result.positions).toEqual([
      // Bought 2 @ 185 + 1 @ 190 = 560 USD for 3 shares; sold 1.5 at the
      // average cost of 186.67 → 1.5 shares left with 280 USD of cost.
      { ticker: "AAPL", quantity: 1.5, costBasis: 280, currency: "USD", currentPrice: null },
      // Same currency as the account: the real total paid is used.
      { ticker: "VWCE", quantity: 3, costBasis: 315.6, currency: "EUR", currentPrice: null },
    ]);
  });

  it("lists every row it could not read, with line numbers", () => {
    const result = expectOk(importHoldingsCsv(T212_EXPORT));
    expect(result.issues).toEqual([
      { line: 9, problem: { code: "bad-shares", ticker: "VWCE", raw: "abc" } },
      { line: 10, problem: { code: "t212-unsupported", action: "Stock split open" } },
    ]);
  });

  it("ignores rows that are not trades, and says how many", () => {
    const result = expectOk(importHoldingsCsv(T212_EXPORT));
    expect(result.ignored).toEqual([
      { label: "Deposit", count: 1 },
      { label: "Dividend (Dividend)", count: 1 },
      { label: "Interest on cash", count: 1 },
    ]);
  });

  it("replays trades chronologically even if the file is newest-first", () => {
    const [header, ...rows] = T212_EXPORT.split("\n");
    const reversed = [header, ...rows.reverse()].join("\n");
    const result = expectOk(importHoldingsCsv(reversed));
    expect(result.positions.map((p) => [p.ticker, p.quantity, p.costBasis])).toEqual([
      ["AAPL", 1.5, 280],
      ["VWCE", 3, 315.6],
    ]);
  });

  it("drops positions that were sold completely", () => {
    const csv = [
      T212_HEADER,
      "Market buy,2024-01-03 10:00:00,X,TSLA,Tesla,,1,0.5,200,USD,1,,,,,,,,",
      "Market sell,2024-02-03 10:00:00,X,TSLA,Tesla,,2,0.5,250,USD,1,,,,,,,,",
    ].join("\n");
    expect(expectOk(importHoldingsCsv(csv)).positions).toEqual([]);
  });

  it("reports a sell of more shares than held instead of going negative", () => {
    const csv = [
      T212_HEADER,
      "Market buy,2024-01-03 10:00:00,X,MSFT,Microsoft,,1,1,300,USD,1,,,,,,,,",
      "Market sell,2024-02-03 10:00:00,X,MSFT,Microsoft,,2,3,310,USD,1,,,,,,,,",
    ].join("\n");
    const result = expectOk(importHoldingsCsv(csv));
    expect(result.positions).toEqual([
      { ticker: "MSFT", quantity: 1, costBasis: 300, currency: "USD", currentPrice: null },
    ]);
    expect(result.issues).toHaveLength(1);
    expect(result.issues[0].line).toBe(3);
    expect(result.issues[0].problem).toEqual({ code: "oversold", ticker: "MSFT", shares: 3, held: 1 });
    expect(problemText(result.issues[0].problem, EN.m.problems)).toBe("MSFT: sells 3 shares, but only 1 were held. Are older trades missing?");
    expect(problemText(result.issues[0].problem, getI18n("es").m.problems)).toBe("MSFT: vende 3, pero solo había 1. ¿Faltan operaciones antiguas?");
  });

  it("reads legacy exports with a 'Total (EUR)' column and negative buy totals", () => {
    const csv = [
      "Action,Time,ISIN,Ticker,Name,No. of shares,Price / share,Currency (Price / share),Exchange rate,Result (EUR),Total (EUR)",
      "Market buy,2021-05-04 10:00:00,IE00B5BMR087,CSPX,iShares S&P 500,2,350.10,EUR,1.0,,-700.80",
    ].join("\n");
    expect(expectOk(importHoldingsCsv(csv)).positions).toEqual([
      { ticker: "CSPX", quantity: 2, costBasis: 700.8, currency: "EUR", currentPrice: null },
    ]);
  });

  it("fails with a clear message when required columns are missing", () => {
    const outcome = importHoldingsCsv("Action,Time,Ticker,No. of shares\nMarket buy,2024-01-01,AAPL,1");
    expect(outcome).toEqual({
      ok: false,
      error: { code: "t212-missing-columns", columns: "Price / share, Currency (Price / share)" },
    });
  });
});

describe("simple holdings CSV import", () => {
  it("reads a semicolon-separated file with decimal commas", () => {
    const csv = "Ticker;Quantity;Cost basis;Currency;Current price\nvwce;12;1.250,40;eur;118,20\nAAPL;2;300;USD;";
    const result = expectOk(importHoldingsCsv(csv));
    expect(result.format).toBe("holdings");
    expect(result.positions).toEqual([
      { ticker: "VWCE", quantity: 12, costBasis: 1250.4, currency: "EUR", currentPrice: 118.2 },
      { ticker: "AAPL", quantity: 2, costBasis: 300, currency: "USD", currentPrice: null },
    ]);
  });

  it("accepts an average price per share instead of a total cost", () => {
    const csv = "symbol,shares,avg_price,currency\nMSFT,4,250,USD";
    expect(expectOk(importHoldingsCsv(csv)).positions[0].costBasis).toBe(1000);
  });

  it("reports bad rows and keeps the good ones", () => {
    const csv = [
      "ticker,quantity,cost_basis,currency,current_price",
      "GOOD,1,100,EUR,110",
      ",1,100,EUR,",
      "BADQTY,zero,100,EUR,",
      "BADCCY,1,100,euros,",
      "BADPRICE,1,100,EUR,n/a",
    ].join("\n");
    const result = expectOk(importHoldingsCsv(csv));
    expect(result.positions.map((p) => p.ticker)).toEqual(["GOOD"]);
    expect(result.issues.map((issue) => issue.line)).toEqual([3, 4, 5, 6]);
    expect(result.issues.map((issue) => issue.problem.code)).toEqual(["missing-ticker", "bad-quantity", "bad-currency", "bad-price"]);
  });

  it("names the missing columns", () => {
    const outcome = importHoldingsCsv("ticker,quantity\nAAPL,1");
    expect(outcome.ok).toBe(false);
    if (!outcome.ok) expect(outcome.error).toMatchObject({ code: "holdings-missing-columns", columns: "cost_basis or avg_price, currency" });
  });
});

describe("importHoldingsCsv", () => {
  it("rejects empty and header-only files", () => {
    expect(importHoldingsCsv("")).toEqual({ ok: false, error: { code: "file-empty" } });
    expect(importHoldingsCsv("ticker,quantity\n")).toEqual({ ok: false, error: { code: "file-no-rows" } });
  });

  it("rejects unrecognized files instead of guessing", () => {
    const outcome = importHoldingsCsv("date,amount\n2024-01-01,5");
    expect(outcome.ok).toBe(false);
    if (!outcome.ok) expect(outcome.error.code).toBe("file-unknown");
  });
});

describe("mergeImportedHoldings", () => {
  it("assigns ids and decides where each price comes from", () => {
    const existing: Holding[] = [
      { id: "old", ticker: "AAPL", quantity: 1, costBasis: 100, currency: "USD", currentPrice: 200, priceSource: "auto", priceDate: "2026-09-25" },
      { id: "old2", ticker: "VWCE", quantity: 1, costBasis: 100, currency: "EUR", currentPrice: 120, priceSource: "manual", priceDate: null },
    ];
    let next = 0;
    const merged = mergeImportedHoldings(
      existing,
      [
        { ticker: "AAPL", quantity: 2, costBasis: 300, currency: "USD", currentPrice: null },
        { ticker: "VWCE", quantity: 5, costBasis: 500, currency: "EUR", currentPrice: 125 },
        { ticker: "AAPL", quantity: 1, costBasis: 150, currency: "EUR", currentPrice: null },
      ],
      () => `id-${next++}`,
    );
    expect(merged).toEqual([
      // Known ticker and currency: keeps the existing price and its origin.
      { id: "id-0", ticker: "AAPL", quantity: 2, costBasis: 300, currency: "USD", currentPrice: 200, priceSource: "auto", priceDate: "2026-09-25" },
      // Price in the file: treated as typed by the user.
      { id: "id-1", ticker: "VWCE", quantity: 5, costBasis: 500, currency: "EUR", currentPrice: 125, priceSource: "manual", priceDate: null },
      // Unknown: filled automatically later.
      { id: "id-2", ticker: "AAPL", quantity: 1, costBasis: 150, currency: "EUR", currentPrice: null, priceSource: "auto", priceDate: null },
    ]);
  });
});
