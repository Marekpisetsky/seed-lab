import { describe, expect, it } from "vitest";
import { mulberry32 } from "../../src/lib/monte-carlo.ts";
import { parsePricesFile, type Instrument, type InstrumentPrices, type PricesFile } from "../../src/lib/market-format.ts";
import { formatPricesFile, nextPricesFile } from "./price-files.mts";
import type { PricePoint } from "./series.mts";
import { calendarYearReturns, closesOn, instrumentStats, MIN_SHARED_WEEKS, volatility, weeklyCorrelations } from "./stats.mts";

/** Weekday closes from `from` to `to`; each day's log return comes from `step(dayIndex)`. */
function weekdays(from: string, to: string, step: (index: number) => number = () => 0): PricePoint[] {
  const points: PricePoint[] = [];
  let close = 100;
  for (let day = new Date(`${from}T00:00:00Z`); day.toISOString().slice(0, 10) <= to; day.setUTCDate(day.getUTCDate() + 1)) {
    if (day.getUTCDay() === 0 || day.getUTCDay() === 6) continue;
    if (points.length > 0) close *= Math.exp(step(points.length));
    points.push({ time: day.toISOString().slice(0, 10), close });
  }
  return points;
}

describe("volatility", () => {
  it("is the daily spread scaled to a year", () => {
    // Daily log returns of +1% and −1% in turn: a daily spread of about 1%.
    const points = weekdays("2020-01-01", "2023-12-31", (index) => (index % 2 === 0 ? 0.01 : -0.01));
    const perYear = volatility(points) ?? 0;
    const returnsPerYear = (points.length - 1) / ((Date.parse("2023-12-29") - Date.parse("2020-01-01")) / (365.25 * 86_400_000));
    expect(perYear).toBeCloseTo(0.01 * Math.sqrt(returnsPerYear), 3);
    expect(perYear).toBeGreaterThan(0.15);
    expect(perYear).toBeLessThan(0.17);
  });

  it("needs about three months of closes", () => {
    expect(volatility(weekdays("2024-01-01", "2024-02-15"))).toBeNull();
  });
});

describe("calendar years", () => {
  it("are the change over each full year only", () => {
    // Growing about 10% a year from mid-2019: 2019 is not a full year, 2020-2022 are, 2023 is cut short.
    const points = weekdays("2019-06-03", "2023-03-31", () => Math.log(1.1) / 261);
    const years = calendarYearReturns(points);
    expect(Object.keys(years)).toEqual(["2020", "2021", "2022"]);
    for (const change of Object.values(years)) expect(change).toBeCloseTo(0.1, 2);
  });
});

describe("weekly closes", () => {
  it("take the last close on or before each day, none before the start or long after the end", () => {
    const points: PricePoint[] = [
      { time: "2024-01-02", close: 10 },
      { time: "2024-01-05", close: 11 },
      { time: "2024-01-09", close: 12 },
    ];
    expect(closesOn(points, ["2024-01-01", "2024-01-05", "2024-01-12", "2024-01-19"])).toEqual([null, 11, 12, null]);
  });
});

describe("weekly correlations", () => {
  /** Seeded daily moves, the same for a seed whatever series uses them. */
  const noise = (seed: number) => {
    const random = mulberry32(seed);
    const moves = Array.from({ length: 4000 }, () => (random() - 0.5) * 0.02);
    return (index: number) => moves[index];
  };
  const a = weekdays("2018-01-01", "2024-12-31", noise(1));
  const b = weekdays("2018-01-01", "2024-12-31", (index) => -noise(1)(index));
  const c = weekdays("2018-01-01", "2024-12-31", noise(7));
  const late = weekdays("2023-06-01", "2024-12-31", noise(1));

  it("are 1 with itself, −1 with its mirror, and near 0 with unrelated moves", () => {
    const { ids, matrix, weeks } = weeklyCorrelations({ a, b, c, late });
    expect(ids).toEqual(["a", "b", "c", "late"]);
    expect(matrix[0][0]).toBe(1);
    expect(matrix[0][1]).toBeCloseTo(-1, 3);
    expect(Math.abs(matrix[0][2] ?? 1)).toBeLessThan(0.2);
    // Symmetric.
    expect(matrix[2][0]).toBe(matrix[0][2]);
    // Under three years of shared weeks: no figure.
    expect(weeks[0][3]).toBeLessThan(MIN_SHARED_WEEKS);
    expect(matrix[0][3]).toBeNull();
    expect(weeks[0][1]).toBeGreaterThan(MIN_SHARED_WEEKS);
  });
});

describe("the prices file", () => {
  const instrument: Instrument = { id: "NVDA", name: "NVIDIA", kind: "stock", index: "nasdaq100", symbol: "NVDA", stooq: null, currency: "USD" };
  const entry: InstrumentPrices = {
    symbol: "NVDA",
    currency: "USD",
    source: "yahoo",
    date: "2024-12-31",
    close: 130,
    change1y: 1.7,
    growth: null,
    drawdown: null,
  };
  const previous: PricesFile = { version: 1, updatedAt: "2024-12-30T00:00:00.000Z", prices: { NVDA: entry } };
  const points = weekdays("2020-01-01", "2024-12-31", (index) => (index % 3 === 0 ? 0.02 : -0.009));
  const stats = instrumentStats(points);
  const correlations = weeklyCorrelations({ NVDA: points });
  // As the job builds it: the day's figures, with the stats worked out from the same download.
  const fresh = { NVDA: { ...entry, date: "2025-01-01", stats } };

  it("carries each instrument's stats and the correlations, and reads them back", () => {
    const { file, changed } = nextPricesFile([instrument], previous, fresh, new Date("2025-01-01T00:00:00Z"), correlations);
    expect(changed).toBe(true);
    expect(file.prices.NVDA.stats?.volatility).toBe(stats?.volatility);
    const text = formatPricesFile(file);
    expect(text).toContain('"correlations": {');
    expect(parsePricesFile(JSON.parse(text))).toEqual(file);
  });

  it("is unchanged when neither prices nor stats move", () => {
    const { file } = nextPricesFile([instrument], previous, fresh, new Date("2025-01-01T00:00:00Z"), correlations);
    expect(nextPricesFile([instrument], file, fresh, new Date("2025-01-02T00:00:00Z"), correlations).changed).toBe(false);
    // A failed download keeps yesterday's figures, stats included.
    expect(nextPricesFile([instrument], file, {}, new Date("2025-01-02T00:00:00Z"), correlations).file.prices.NVDA.stats).toEqual(stats);
  });

  it("drops malformed stats and correlations instead of failing", () => {
    const parsed = parsePricesFile({
      prices: { NVDA: { ...entry, stats: { from: "x", volatility: -1 } } },
      correlations: { ids: ["NVDA"], matrix: [[2]], weeks: [[1]] },
    });
    expect(parsed.prices.NVDA.stats).toBeNull();
    expect(parsed.correlations).toBeUndefined();
  });
});
