import { describe, expect, it } from "vitest";
import { annualizedReturn } from "./indexes";
import { successRates } from "./monte-carlo";
import { inverseNormal, normalReturns, POOL_SIZE } from "./normal";
import { logStats } from "./volatility";

describe("inverseNormal", () => {
  it("gives the well-known quantiles of the standard normal", () => {
    expect(inverseNormal(0.5)).toBeCloseTo(0, 9);
    expect(inverseNormal(0.975)).toBeCloseTo(1.959964, 5);
    expect(inverseNormal(0.025)).toBeCloseTo(-1.959964, 5);
    expect(inverseNormal(0.8413447)).toBeCloseTo(1, 5);
    expect(inverseNormal(0.001)).toBeCloseTo(-3.090232, 5);
  });

  it("refuses probabilities outside (0, 1)", () => {
    expect(() => inverseNormal(0)).toThrow(RangeError);
    expect(() => inverseNormal(1)).toThrow(RangeError);
  });
});

describe("normalReturns: the pool the simulations draw from for typed figures", () => {
  it("has the typed growth as its typical year and the typed swings as its spread", () => {
    const pool = normalReturns(0.06, 0.15);
    expect(pool).toHaveLength(POOL_SIZE);
    const { mean, deviation } = logStats(pool);
    expect(Math.expm1(mean)).toBeCloseTo(0.06, 9);
    expect(annualizedReturn(pool)).toBeCloseTo(0.06, 9);
    expect(deviation).toBeCloseTo(0.15, 2);
    // Two years in three within one spread of the typical year.
    const within = pool.filter((value) => Math.abs(Math.log1p(value) - Math.log(1.06)) <= 0.15).length / pool.length;
    expect(within).toBeCloseTo(0.6827, 2);
  });

  it("never loses more than everything, even with huge swings, and is flat with none", () => {
    expect(Math.min(...normalReturns(0.07, 0.8))).toBeGreaterThan(-1);
    expect(new Set(normalReturns(-0.01, 0))).toEqual(new Set([-0.01]));
    expect(() => normalReturns(-1, 0.1)).toThrow(RangeError);
    expect(() => normalReturns(0.05, -0.1)).toThrow(RangeError);
  });

  it("lasts less often at the same growth the more it swings", () => {
    const [calm] = successRates({ withdrawalRates: [0.04], returns: normalReturns(0.04, 0.05) });
    const [wild] = successRates({ withdrawalRates: [0.04], returns: normalReturns(0.04, 0.3) });
    expect(wild).toBeLessThan(calm - 0.1);
  });
});
