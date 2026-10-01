import { describe, expect, it } from "vitest";
import { availablePeriods, changeTicks, defaultPeriod, lineChange, loadLines, pointDates, type LinesFile } from "./lines";
import { parsePricesFile } from "./market-format";

// Three points a week apart, then the latest close four days later.
const year = { from: "2025-09-26", to: "2025-10-14", line: [100, 104.2, 98.5, 127.5] };

const file: LinesFile = {
  version: 1,
  id: "NVDA",
  benchmark: "EQQQ",
  periods: { "1y": { ...year, index: [100, 101, 99, 103.4] }, max: { from: "2016-09-30", to: "2016-10-07", line: [100, 80] } },
};

describe("a period's line", () => {
  it("has a point a week from its start, the last one the latest close", () => {
    expect(pointDates(file.periods["1y"]!)).toEqual(["2025-09-26", "2025-10-03", "2025-10-10", "2025-10-14"]);
  });

  it("changes by its last value against the start's 100, up in green, down in red", () => {
    expect(lineChange([100, 104.2, 127.5])).toBeCloseTo(0.275, 12);
    expect(lineChange([100, 80])).toBeCloseTo(-0.2, 12);
  });
});

describe("the period choice", () => {
  it("offers only the periods the data reaches, and opens on a year", () => {
    expect(availablePeriods(file)).toEqual(["1y", "max"]);
    expect(defaultPeriod(file)).toBe("1y");
  });

  it("opens on all the data when it is under a year, and has nothing without a file", () => {
    expect(defaultPeriod({ ...file, periods: { max: file.periods.max } })).toBe("max");
    expect(availablePeriods(null)).toEqual([]);
    expect(defaultPeriod(null)).toBeNull();
  });
});

describe("the change axis", () => {
  it("has round steps with 0 among them", () => {
    expect(changeTicks(-0.06, 0.32)).toEqual([0, 0.1, 0.2, 0.3]);
    expect(changeTicks(-0.25, 0.1)).toEqual([-0.2, -0.1, 0, 0.1]);
    expect(changeTicks(0, 120)).toEqual([0, 50, 100]);
  });
});

describe("loading a line", () => {
  const answer = (status: number, body: unknown) => async () => new Response(JSON.stringify(body), { status });

  it("reads the instrument's file from the site itself", async () => {
    const asked: string[] = [];
    const fetcher = (async (url: string) => {
      asked.push(url);
      return answer(200, file)();
    }) as unknown as typeof fetch;
    expect(await loadLines("NVDA", fetcher)).toEqual(file);
    expect(asked).toEqual(["/wealth-lens/data/lines/NVDA.json"]);
    // Kept for the visit: opening the row again asks nothing.
    await loadLines("NVDA", fetcher);
    expect(asked).toHaveLength(1);
  });

  it("is nothing before the price job writes it, and is asked again next time", async () => {
    let calls = 0;
    const missing = (async () => {
      calls += 1;
      return answer(404, {})();
    }) as unknown as typeof fetch;
    expect(await loadLines("NEW", missing)).toBeNull();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(await loadLines("NEW", missing)).toBeNull();
    expect(calls).toBe(2);
  });

  it("refuses a file about another instrument, or a broken one", async () => {
    expect(await loadLines("AAPL", answer(200, file) as unknown as typeof fetch)).toBeNull();
    const broken = (async () => new Response("{", { status: 200 })) as unknown as typeof fetch;
    expect(await loadLines("MSFT", broken)).toBeNull();
  });
});

describe("the small picture of a row", () => {
  it("is read from the prices file as a line from 100, never a price", () => {
    const parsed = parsePricesFile({
      prices: {
        NVDA: { symbol: "NVDA", currency: "USD", source: "yahoo", date: "2026-09-29", close: 227.21, change1y: 0.25, growth: null, line1y: [100, 101.5, 127.5] },
        AAPL: { symbol: "AAPL", currency: "USD", source: "yahoo", date: "2026-09-29", close: 250, change1y: 0.2, growth: null, line1y: [100, -3] },
      },
    });
    expect(parsed.prices.NVDA.line1y).toEqual([100, 101.5, 127.5]);
    expect(parsed.prices.AAPL.line1y).toBeNull();
  });
});
