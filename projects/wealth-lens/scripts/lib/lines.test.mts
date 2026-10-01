import { describe, expect, it } from "vitest";
import { parseLinesFile, type Instrument } from "../../src/lib/market-format.ts";
import { benchmarkFor, formatLinesFile, linePeriods, linesFile, periodStart, recentLine, weeklyPoints } from "./lines.mts";
import type { PricePoint } from "./series.mts";

/** Weekday closes from `from` to `to`, the close of each day given by `price(dayIndex)`. */
function weekdays(from: string, to: string, price: (index: number) => number = (index) => 100 + index): PricePoint[] {
  const points: PricePoint[] = [];
  for (let day = new Date(`${from}T00:00:00Z`); day.toISOString().slice(0, 10) <= to; day.setUTCDate(day.getUTCDate() + 1)) {
    if (day.getUTCDay() === 0 || day.getUTCDay() === 6) continue;
    points.push({ time: day.toISOString().slice(0, 10), close: price(points.length) });
  }
  return points;
}

const instrument = (id: string, kind: "etf" | "stock", index: Instrument["index"]): Instrument => ({
  id,
  name: id,
  kind,
  index,
  symbol: id,
  stooq: null,
  currency: "USD",
});

describe("weekly points", () => {
  it("take each Friday's close, or the last one before it, and the latest close of the week so far", () => {
    const points: PricePoint[] = [
      { time: "2024-01-02", close: 10 }, // Tuesday
      { time: "2024-01-05", close: 11 }, // Friday
      { time: "2024-01-10", close: 12 }, // Wednesday: Friday 12th was a holiday
      { time: "2024-01-16", close: 13 }, // Tuesday: the latest
    ];
    expect(weeklyPoints(points)).toEqual([
      { time: "2024-01-05", close: 11 },
      { time: "2024-01-12", close: 12 },
      { time: "2024-01-16", close: 13 },
    ]);
  });

  it("do not repeat a latest close that is itself a Friday", () => {
    const points = weekdays("2024-01-01", "2024-01-19");
    expect(weeklyPoints(points).map((point) => point.time)).toEqual(["2024-01-05", "2024-01-12", "2024-01-19"]);
  });
});

describe("periods", () => {
  const tenYears = weekdays("2016-09-30", "2026-09-29");

  it("start that many years before the latest close, on the last Friday on or before", () => {
    const weekly = weeklyPoints(tenYears);
    expect(weekly[periodStart(weekly, 1) ?? -1].time).toBe("2025-09-26");
    expect(weekly[periodStart(weekly, 5) ?? -1].time).toBe("2021-09-24");
    expect(periodStart(weekly, null)).toBe(0);
  });

  it("are only there when the history covers them", () => {
    const young = weekdays("2024-12-30", "2026-09-29");
    expect(Object.keys(linePeriods(young))).toEqual(["1y", "max"]);
    expect(Object.keys(linePeriods(tenYears))).toEqual(["1y", "3y", "5y", "max"]);
    expect(Object.keys(linePeriods(weekdays("2026-03-02", "2026-09-29")))).toEqual(["max"]);
  });

  it("each start again at 100 and hold only shares of that start, to a tenth: never a price", () => {
    const periods = linePeriods(tenYears);
    for (const period of Object.values(periods)) {
      expect(period.line[0]).toBe(100);
      expect(period.to).toBe("2026-09-29");
      expect(period.line.every((value) => Number.isInteger(Math.round(value * 10)) && Math.abs(value * 10 - Math.round(value * 10)) < 1e-9)).toBe(true);
    }
    const weekly = weeklyPoints(tenYears);
    const start = weekly.find((point) => point.time === periods["1y"]?.from);
    expect(periods["1y"]?.line.at(-1)).toBe(Math.round((tenYears.at(-1)!.close / start!.close) * 1000) / 10);
    // A price of 437.21: no value of the file is one of its closes.
    const priced = weekdays("2016-09-30", "2026-09-29", (index) => Math.round(437.21 * Math.exp(index * 0.0003) * 100) / 100);
    const closes = new Set(priced.map((point) => point.close));
    for (const period of Object.values(linePeriods(priced))) expect(period.line.some((value) => closes.has(value))).toBe(false);
  });

  it("are a week apart, the last one the latest close", () => {
    const period = linePeriods(tenYears)["1y"]!;
    expect(period.from).toBe("2025-09-26");
    expect(period.line).toHaveLength(54);
    expect(parseLinesFile({ version: 1, id: "X", periods: { "1y": period } })?.periods["1y"]).toEqual(period);
  });
});

describe("the index fund's line", () => {
  const stock = weekdays("2016-09-30", "2026-09-29", (index) => 50 * Math.exp(index * 0.001));
  const fund = weekdays("2016-09-30", "2026-09-29", (index) => 200 * Math.exp(index * 0.0004));

  it("covers the same weeks and starts at 100 at the same point", () => {
    const periods = linePeriods(stock, fund);
    for (const period of Object.values(periods)) {
      expect(period.index).toHaveLength(period.line.length);
      expect(period.index?.[0]).toBe(100);
    }
    // Five years of 0.04% a trading day against 0.1%.
    const fiveYears = periods["5y"]!;
    expect(fiveYears.index!.at(-1)).toBeLessThan(fiveYears.line.at(-1)!);
  });

  it("is left out where the fund's prices start later than the period", () => {
    const youngFund = weekdays("2024-12-30", "2026-09-29");
    const periods = linePeriods(stock, youngFund);
    expect(periods["1y"]?.index).toBeDefined();
    expect(periods["3y"]?.index).toBeUndefined();
    expect(periods.max?.index).toBeUndefined();
  });

  it("is the first fund on the list that follows the stock's index; funds are compared with nothing", () => {
    const list = [instrument("VUAA", "etf", "sp500"), instrument("EQQQ", "etf", "nasdaq100"), instrument("NVDA", "stock", "nasdaq100")];
    expect(benchmarkFor(list[2], list)?.id).toBe("EQQQ");
    expect(benchmarkFor(list[0], list)).toBeNull();
    expect(benchmarkFor(instrument("SAP", "stock", "world"), list)).toBeNull();
  });
});

describe("the lines file", () => {
  it("reads back exactly as written, one period per line", () => {
    const nvda = instrument("NVDA", "stock", "nasdaq100");
    const file = linesFile(nvda, weekdays("2020-01-01", "2026-09-29"), { id: "EQQQ", points: weekdays("2020-01-01", "2026-09-29", (i) => 300 + i / 2) });
    const text = formatLinesFile(file);
    expect(text.split("\n").filter((line) => line.startsWith('"1y"') || line.startsWith('"3y"') || line.startsWith('"5y"') || line.startsWith('"max"'))).toHaveLength(4);
    expect(parseLinesFile(JSON.parse(text))).toEqual(file);
  });

  it("gives the small picture the last year's line", () => {
    expect(recentLine(weekdays("2024-01-01", "2026-09-29"))?.[0]).toBe(100);
    expect(recentLine(weekdays("2026-03-02", "2026-09-29"))).toBeNull();
  });

  it("drops a period whose points do not line up with its dates", () => {
    const bad = { version: 1, id: "X", periods: { "1y": { from: "2025-09-26", to: "2026-09-29", line: [100, 101] }, max: { from: "2025-09-26", to: "2025-10-03", line: [100, 0] } } };
    expect(parseLinesFile(bad)?.periods).toEqual({});
    expect(parseLinesFile({ version: 2, id: "X", periods: {} })).toBeNull();
  });
});
