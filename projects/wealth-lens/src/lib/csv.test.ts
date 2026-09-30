import { describe, expect, it } from "vitest";
import { detectDelimiter, findColumn, normalizeHeader, parseCsv, parseCsvRecords, parseLooseNumber } from "./csv";

describe("parseCsvRecords", () => {
  it("splits simple rows", () => {
    expect(parseCsvRecords("a,b\n1,2\n").map((r) => r.fields)).toEqual([
      ["a", "b"],
      ["1", "2"],
    ]);
  });

  it("handles quotes, escaped quotes and delimiters inside quotes", () => {
    const [record] = parseCsvRecords('"Apple, Inc.","He said ""hi""",x');
    expect(record.fields).toEqual(["Apple, Inc.", 'He said "hi"', "x"]);
  });

  it("keeps newlines inside quoted fields and reports the starting line", () => {
    const records = parseCsvRecords('h1,h2\n"multi\nline",2\nlast,3');
    expect(records.map((r) => r.line)).toEqual([1, 2, 4]);
    expect(records[1].fields[0]).toBe("multi\nline");
  });

  it("handles CRLF, a byte-order mark and blank lines", () => {
    const records = parseCsvRecords("﻿a,b\r\n\r\n1,2\r\n");
    expect(records).toEqual([
      { line: 1, fields: ["a", "b"] },
      { line: 3, fields: ["1", "2"] },
    ]);
  });

  it("keeps empty fields", () => {
    expect(parseCsvRecords("a,,c,")[0].fields).toEqual(["a", "", "c", ""]);
  });
});

describe("detectDelimiter / parseCsv", () => {
  it("detects comma, semicolon and tab", () => {
    expect(detectDelimiter("a,b,c\n1;2")).toBe(",");
    expect(detectDelimiter("a;b;c\n1,5;2")).toBe(";");
    expect(detectDelimiter("a\tb\n")).toBe("\t");
  });

  it("ignores delimiters inside quoted header names", () => {
    expect(detectDelimiter('"x,y";"z"\n')).toBe(";");
  });

  it("returns a trimmed header and the data records", () => {
    const table = parseCsv(" ticker ; qty \nAAPL;2\n");
    expect(table.delimiter).toBe(";");
    expect(table.header).toEqual(["ticker", "qty"]);
    expect(table.records).toEqual([{ line: 2, fields: ["AAPL", "2"] }]);
  });
});

describe("normalizeHeader / findColumn", () => {
  it("normalizes header names", () => {
    expect(normalizeHeader("No. of shares")).toBe("noofshares");
    expect(normalizeHeader("Currency (Price / share)")).toBe("currencypriceshare");
  });

  it("finds a column by name or pattern, in candidate order", () => {
    const header = ["Action", "Total (EUR)", "Ticker"];
    expect(findColumn(header, "ticker")).toBe(2);
    expect(findColumn(header, "total", /^total[a-z]{3}$/)).toBe(1);
    expect(findColumn(header, "missing")).toBe(-1);
  });
});

describe("parseLooseNumber", () => {
  it.each([
    ["1234.5", 1234.5],
    ["1,234.50", 1234.5],
    ["1.234,50", 1234.5],
    ["1234,5", 1234.5],
    ["0,123", 0.123],
    ["1,234", 1234],
    ["1.234.567", 1234567],
    ["1.234", 1.234],
    ["€ 1 234,56", 1234.56],
    ["1'234.50", 1234.5],
    ["-12.5%", -12.5],
    ["USD 99", 99],
    [".5", 0.5],
    ["2.0000000000", 2],
  ])("reads %j as %d", (raw, expected) => {
    expect(parseLooseNumber(raw)).toBeCloseTo(expected, 10);
  });

  it.each(["", "   ", "abc", "1.2.3,4,5", "--1", "12abc34", undefined])("rejects %j", (raw) => {
    expect(parseLooseNumber(raw)).toBeNull();
  });

  it.each([
    ["10.000", 10_000],
    ["1.000,5", 1000.5],
    ["1,5", 1.5],
    ["1,234", 1.234],
    ["7.5", 7.5],
    ["0.125", 0.125],
    ["1.234.567", 1_234_567],
    ["1,234.5", 1234.5],
  ])("reads %j the Spanish way (decimal comma) as %d", (raw, expected) => {
    expect(parseLooseNumber(raw, true)).toBeCloseTo(expected, 10);
  });
});
