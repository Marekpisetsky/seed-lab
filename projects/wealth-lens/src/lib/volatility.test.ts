import { describe, expect, it } from "vitest";
import { indexVolatility, logStats } from "./volatility";

describe("logStats", () => {
  it("is the mean and spread of log(1 + r)", () => {
    const { mean, deviation } = logStats([0.1, -0.1]);
    expect(mean).toBeCloseTo((Math.log(1.1) + Math.log(0.9)) / 2, 12);
    expect(deviation).toBeCloseTo(Math.abs(Math.log(1.1) - Math.log(0.9)) / Math.SQRT2, 12);
    expect(logStats([0.05]).deviation).toBe(0);
  });
});

describe("indexVolatility", () => {
  it("is bigger for stocks than for bonds", () => {
    expect(indexVolatility("sp500")).toBeGreaterThan(indexVolatility("bonds"));
  });
});
