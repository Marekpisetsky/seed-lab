import { describe, expect, it } from "vitest";
import { snapWithdrawal, withdrawalZone, WITHDRAWAL_STEPS } from "./withdrawal";

describe("the slider's withdrawal rates", () => {
  it("go from 2 % to 7 % in steps of 0.5 %", () => {
    expect(WITHDRAWAL_STEPS).toEqual([0.02, 0.025, 0.03, 0.035, 0.04, 0.045, 0.05, 0.055, 0.06, 0.065, 0.07]);
  });

  it("take any rate from a file to the nearest step within them", () => {
    expect(snapWithdrawal(0.04)).toBe(0.04);
    expect(snapWithdrawal(0.033)).toBe(0.035);
    expect(snapWithdrawal(0.0324)).toBe(0.03);
    expect(snapWithdrawal(0.01)).toBe(0.02);
    expect(snapWithdrawal(0.1)).toBe(0.07);
    for (const rate of WITHDRAWAL_STEPS) expect(snapWithdrawal(rate)).toBe(rate);
  });
});

describe("the zone of a withdrawal rate", () => {
  it("is prudent from 9 futures in 10, risky from 3 in 4, very risky below", () => {
    expect(withdrawalZone(1)).toBe("prudent");
    expect(withdrawalZone(0.9)).toBe("prudent");
    expect(withdrawalZone(0.899)).toBe("risky");
    expect(withdrawalZone(0.75)).toBe("risky");
    expect(withdrawalZone(0.749)).toBe("very-risky");
    expect(withdrawalZone(0)).toBe("very-risky");
  });
});
