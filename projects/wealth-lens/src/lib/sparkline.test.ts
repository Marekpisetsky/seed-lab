import { describe, expect, it } from "vitest";
import { lastDays, periodChange, sparklinePoints } from "./sparkline";

const p = (time: string, close: number) => ({ time, close });

describe("sparklinePoints", () => {
  it("fits the series in the box, highest price at the top", () => {
    expect(sparklinePoints([p("2026-01-01", 10), p("2026-01-02", 20), p("2026-01-03", 15)], 100, 40)).toBe(
      "0,40 50,0 100,20",
    );
  });

  it("draws flat and single-point series through the middle", () => {
    expect(sparklinePoints([p("2026-01-01", 5), p("2026-01-02", 5)], 10, 20)).toBe("0,10 10,10");
    expect(sparklinePoints([p("2026-01-01", 5)], 10, 20)).toBe("0,10");
    expect(sparklinePoints([], 10, 20)).toBe("");
  });
});

describe("lastDays / periodChange", () => {
  const series = [p("2025-09-01", 80), p("2025-09-26", 100), p("2026-03-01", 110), p("2026-09-26", 125)];

  it("keeps the last N calendar days", () => {
    expect(lastDays(series, 365).map((point) => point.time)).toEqual(["2025-09-26", "2026-03-01", "2026-09-26"]);
    expect(lastDays([], 365)).toEqual([]);
  });

  it("measures the change over the period", () => {
    expect(periodChange(lastDays(series, 365))).toBeCloseTo(0.25, 12);
    expect(periodChange([p("2026-01-01", 5)])).toBeNull();
  });
});
