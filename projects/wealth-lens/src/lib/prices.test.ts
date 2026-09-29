import { describe, expect, it } from "vitest";
import { includePriceInRange, parsePriceCsv, summarizeSeries, visibleRangeStart } from "./prices";

const STOOQ_CSV = [
  "Date,Open,High,Low,Close,Volume",
  "2026-09-24,226.1,229.0,225.4,228.4,41000000",
  "2026-09-25,228.5,230.2,227.9,229.9,39000000",
  "2026-09-26,229.0,231.0,226.0,227.15,45000000",
].join("\n");

describe("parsePriceCsv", () => {
  it("reads a daily CSV with open/high/low/close columns", () => {
    expect(parsePriceCsv(STOOQ_CSV)).toEqual({
      ok: true,
      points: [
        { time: "2026-09-24", close: 228.4 },
        { time: "2026-09-25", close: 229.9 },
        { time: "2026-09-26", close: 227.15 },
      ],
      skippedRows: 0,
    });
  });

  it("reads a minimal user CSV in any order, with ; and decimal commas", () => {
    const csv = "Date;Note;Close\n2026/09/26;x;131,50\n20260925;x;130,10\n2026-09-24T00:00:00;x;129,00";
    const result = parsePriceCsv(csv);
    expect(result.ok && result.points).toEqual([
      { time: "2026-09-24", close: 129 },
      { time: "2026-09-25", close: 130.1 },
      { time: "2026-09-26", close: 131.5 },
    ]);
  });

  it("prefers Close over Adj Close and keeps one point per day", () => {
    const csv = "Date,Adj Close,Close\n2026-09-25,99,100\n2026-09-25,99,101";
    const result = parsePriceCsv(csv);
    expect(result.ok && result.points).toEqual([{ time: "2026-09-25", close: 101 }]);
  });

  it("skips unreadable rows and counts them", () => {
    const csv = "Date,Close\n2026-09-24,100\nnot a date,101\n2026-02-30,102\n2026-09-25,\n2026-09-26,-1\n2026-09-27,103";
    const result = parsePriceCsv(csv);
    expect(result).toEqual({
      ok: true,
      points: [
        { time: "2026-09-24", close: 100 },
        { time: "2026-09-27", close: 103 },
      ],
      skippedRows: 4,
    });
  });

  it("explains what is missing", () => {
    expect(parsePriceCsv("Ticker,Value\nA,1")).toEqual({
      ok: false,
      error: "Expected a header with a date column and a close (or price) column.",
    });
    expect(parsePriceCsv("Date,Close\nx,y")).toEqual({
      ok: false,
      error: "No rows with a valid date and a positive close price.",
    });
  });
});

describe("summarizeSeries", () => {
  const points = [
    { time: "2026-09-25", close: 200 },
    { time: "2026-09-26", close: 250 },
  ];

  it("compares the last close with the average cost", () => {
    expect(summarizeSeries(points, 200)).toEqual({ last: points[1], vsAverageCost: 0.25 });
    expect(summarizeSeries(points, 312.5)?.vsAverageCost).toBeCloseTo(-0.2, 12);
  });

  it("handles a missing cost and an empty series", () => {
    expect(summarizeSeries(points, null)?.vsAverageCost).toBeNull();
    expect(summarizeSeries([], 100)).toBeNull();
  });
});

describe("visibleRangeStart", () => {
  it("starts N years before the last point", () => {
    const points = [
      { time: "2010-01-04", close: 1 },
      { time: "2026-09-25", close: 2 },
    ];
    expect(visibleRangeStart(points, 2)).toBe("2024-09-25");
  });

  it("is clamped to the first point for short series", () => {
    const points = [
      { time: "2026-01-02", close: 1 },
      { time: "2026-09-25", close: 2 },
    ];
    expect(visibleRangeStart(points, 2)).toBe("2026-01-02");
    expect(visibleRangeStart([], 2)).toBeNull();
  });
});

describe("includePriceInRange", () => {
  it("widens the range to include the reference price", () => {
    expect(includePriceInRange({ minValue: 220, maxValue: 400 }, 185)).toEqual({ minValue: 185, maxValue: 400 });
    expect(includePriceInRange({ minValue: 90, maxValue: 120 }, 150)).toEqual({ minValue: 90, maxValue: 150 });
    expect(includePriceInRange({ minValue: 90, maxValue: 120 }, 100)).toEqual({ minValue: 90, maxValue: 120 });
  });

  it("leaves the range alone without a price or a range", () => {
    expect(includePriceInRange({ minValue: 1, maxValue: 2 }, null)).toEqual({ minValue: 1, maxValue: 2 });
    expect(includePriceInRange(null, 5)).toBeNull();
  });
});
