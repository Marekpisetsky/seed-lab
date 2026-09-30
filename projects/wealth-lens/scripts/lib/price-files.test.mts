import { describe, expect, it } from "vitest";
import { parsePricesFile, type Instrument, type InstrumentPrices, type PricesFile } from "../../src/lib/market-format.ts";
import {
  changeOverYear,
  checkSeries,
  formatPricesFile,
  growthPerYear,
  lastYears,
  maxDrawdown,
  nextPricesFile,
  summarize,
} from "./price-files.mts";
import type { PricePoint } from "./series.mts";

const VUAA: Instrument = {
  id: "VUAA",
  name: "Vanguard S&P 500",
  kind: "etf",
  index: "sp500",
  symbol: "VUAA.DE",
  stooq: "vuaa.de",
  currency: "EUR",
};
const NVDA: Instrument = { ...VUAA, id: "NVDA", name: "NVIDIA", kind: "stock", index: "nasdaq100", symbol: "NVDA", currency: "USD" };

/** Weekday closes from `from` to `to`, growing smoothly by `yearly` a year. */
function weekdays(from: string, to: string, start = 100, yearly = 0.1): PricePoint[] {
  const points: PricePoint[] = [];
  const first = Date.parse(`${from}T00:00:00Z`);
  for (let day = new Date(first); day.toISOString().slice(0, 10) <= to; day.setUTCDate(day.getUTCDate() + 1)) {
    if (day.getUTCDay() === 0 || day.getUTCDay() === 6) continue;
    const years = (day.getTime() - first) / (365.25 * 86_400_000);
    points.push({ time: day.toISOString().slice(0, 10), close: start * Math.pow(1 + yearly, years) });
  }
  return points;
}

const entry = (overrides: Partial<InstrumentPrices> = {}): InstrumentPrices => ({
  symbol: "VUAA.DE",
  currency: "EUR",
  source: "yahoo",
  date: "2026-09-25",
  close: 110,
  change1y: 0.1,
  growth: null,
  drawdown: null,
  ...overrides,
});

describe("the series downloaded", () => {
  it("keeps the last N years only", () => {
    const points = weekdays("2010-01-04", "2026-09-25");
    const kept = lastYears(points, 10);
    expect(kept[0].time >= "2016-09-25").toBe(true);
    expect(kept.at(-1)?.time).toBe("2026-09-25");
  });
});

describe("summary figures", () => {
  const tenYears = weekdays("2016-09-26", "2026-09-25", 100, 0.1);

  it("grows about 10 % a year over a 10 %-a-year series", () => {
    expect(growthPerYear(tenYears)).toEqual({ from: "2016-09-26", perYear: expect.closeTo(0.1, 3) });
    expect(changeOverYear(tenYears)).toBeCloseTo(0.1, 2);
  });

  it("has no growth or yearly change with less than a year of history", () => {
    const months = weekdays("2026-03-02", "2026-09-25");
    expect(growthPerYear(months)).toBeNull();
    expect(changeOverYear(months)).toBeNull();
  });

  it("publishes figures only: no series of closes goes into the file", () => {
    const summary = summarize(VUAA, tenYears, "yahoo");
    expect(Object.values(summary).some(Array.isArray)).toBe(false);
    const text = formatPricesFile({ version: 1, updatedAt: null, prices: { VUAA: summary } });
    // One number per figure: the ten years of closes would be thousands.
    expect((text.match(/\d+\.\d+/g) ?? []).length).toBeLessThan(10);
  });

  it("summarizes the latest close in the instrument's currency", () => {
    const summary = summarize(VUAA, tenYears, "stooq");
    expect(summary).toMatchObject({ symbol: "VUAA.DE", currency: "EUR", source: "stooq", date: "2026-09-25" });
    expect(summary.close).toBe(Number(tenYears.at(-1)?.close.toFixed(4)));
    expect(summary.growth?.perYear).toBeCloseTo(0.1, 3);
  });
});

describe("maxDrawdown", () => {
  it("is the worst fall from a previous peak", () => {
    const points = [100, 120, 90, 60, 130, 104].map((close, index) => ({ time: `2026-01-0${index + 1}`, close }));
    // Peak 120 → low 60: −50 %. The later fall from 130 to 104 is only −20 %.
    expect(maxDrawdown(points)).toEqual({ from: "2026-01-01", max: 0.5 });
    expect(maxDrawdown([{ time: "2026-01-01", close: 5 }])).toEqual({ from: "2026-01-01", max: 0 });
    expect(maxDrawdown([])).toBeNull();
  });
});

describe("checkSeries", () => {
  const today = new Date("2026-09-26T22:40:00Z");
  const series = weekdays("2025-09-01", "2026-09-25", 100, 0.1);

  it("accepts a fresh series in the expected currency", () => {
    expect(checkSeries(VUAA, series, "EUR", entry(), today)).toEqual({ ok: true });
  });

  it.each([
    ["too few points", series.slice(-5), "EUR", undefined, /only 5 prices/],
    ["another currency", series, "USD", undefined, /quoted in USD, expected EUR/],
    ["an unknown currency", series, null, undefined, /unknown currency/],
    ["older data than committed", series.slice(0, -10), "EUR", entry({ date: "2026-09-25" }), /older than/],
    ["an implausible jump", series, "EUR", entry({ close: 5 }), /jumps from 5/],
  ])("keeps the previous data for %s", (_, points, currency, previous, reason) => {
    const result = checkSeries(VUAA, points, currency, previous, today);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toMatch(reason);
  });

  it("rejects a series whose latest close is stale", () => {
    const result = checkSeries(VUAA, series, "EUR", undefined, new Date("2026-12-01T00:00:00Z"));
    expect(!result.ok && result.reason).toMatch(/latest close is from 2026-09-25/);
  });
});

describe("nextPricesFile", () => {
  const now = new Date("2026-09-29T22:40:00Z");
  const previous: PricesFile = {
    version: 1,
    updatedAt: "2026-09-28T22:41:00Z",
    prices: { VUAA: entry(), NVDA: entry({ symbol: "NVDA", currency: "USD", close: 180 }) },
  };

  it("keeps the previous entry of an instrument whose download failed", () => {
    const fresh = { VUAA: entry({ date: "2026-09-29", close: 111 }) };
    const { file, changed } = nextPricesFile([VUAA, NVDA], previous, fresh, now);
    expect(changed).toBe(true);
    expect(file.updatedAt).toBe(now.toISOString());
    expect(file.prices.VUAA.close).toBe(111);
    expect(file.prices.NVDA).toEqual(previous.prices.NVDA);
  });

  it("reports no change, and keeps the old timestamp, when nothing moved", () => {
    const { file, changed } = nextPricesFile([VUAA, NVDA], previous, { VUAA: entry() }, now);
    expect(changed).toBe(false);
    expect(file).toEqual(previous);
  });

  it("keeps everything when every download failed", () => {
    expect(nextPricesFile([VUAA, NVDA], previous, {}, now)).toEqual({ file: previous, changed: false });
  });

  it("drops instruments removed from the list and follows the list's order", () => {
    const { file } = nextPricesFile([NVDA], previous, {}, now);
    expect(Object.keys(file.prices)).toEqual(["NVDA"]);
  });

  it("writes the same text whatever order an entry's keys were built in", () => {
    const built = entry({ close: 111 });
    const reordered = Object.fromEntries(Object.entries(built).reverse()) as typeof built;
    const text = (prices: PricesFile["prices"]) => formatPricesFile({ version: 1, updatedAt: "2026-09-29T22:40:00.000Z", prices });
    expect(text({ VUAA: reordered })).toBe(text({ VUAA: built }));
    // Read back from yesterday's file in another key order, nothing has moved.
    const readBack: PricesFile = { ...previous, prices: { VUAA: Object.fromEntries(Object.entries(entry()).reverse()) as ReturnType<typeof entry>, NVDA: previous.prices.NVDA } };
    expect(nextPricesFile([VUAA, NVDA], readBack, { VUAA: entry() }, now).changed).toBe(false);
  });

  it("writes a file the app reads back identically, one instrument per line", () => {
    const { file } = nextPricesFile([VUAA, NVDA], previous, { VUAA: entry({ close: 111 }) }, now);
    const text = formatPricesFile(file);
    expect(parsePricesFile(JSON.parse(text))).toEqual(file);
    expect(text.split("\n").filter((line) => line.startsWith('"VUAA"') || line.startsWith('"NVDA"'))).toHaveLength(2);
    expect(formatPricesFile({ version: 1, updatedAt: null, prices: {} })).toBe(
      '{\n"version": 1,\n"updatedAt": null,\n"prices": {}\n}\n',
    );
  });
});
