import { describe, expect, it } from "vitest";
import { sparklinePoints } from "./sparkline";

describe("sparklinePoints", () => {
  it("fits the series in the box, highest price at the top", () => {
    expect(sparklinePoints([10, 20, 15], 100, 40)).toBe(
      "0,40 50,0 100,20",
    );
  });

  it("draws flat and single-point series through the middle", () => {
    expect(sparklinePoints([5, 5], 10, 20)).toBe("0,10 10,10");
    expect(sparklinePoints([5], 10, 20)).toBe("0,10");
    expect(sparklinePoints([], 10, 20)).toBe("");
  });
});
