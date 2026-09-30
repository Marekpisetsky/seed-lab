import { describe, expect, it } from "vitest";
import { MONTHLY_STEP, stepValue, YEARS_STEP } from "./step";
import { MAX_AMOUNT, MAX_YEARS_AHEAD, MIN_YEARS } from "./validation";

const monthly = { ...MONTHLY_STEP, max: MAX_AMOUNT };

describe("the monthly stepper", () => {
  it("moves in steps of €50, snapping to them", () => {
    expect(stepValue(200, 1, monthly)).toBe(250);
    expect(stepValue(200, -1, monthly)).toBe(150);
    expect(stepValue(230, 1, monthly)).toBe(250);
    expect(stepValue(230, -1, monthly)).toBe(200);
    expect(stepValue(0.5, 1, monthly)).toBe(50);
  });

  it("never goes below 0 or above the largest amount", () => {
    expect(stepValue(0, -1, monthly)).toBe(0);
    expect(stepValue(20, -1, monthly)).toBe(0);
    expect(stepValue(MAX_AMOUNT, 1, monthly)).toBe(MAX_AMOUNT);
  });
});

describe("the years stepper", () => {
  it("moves a year at a time between 1 and 60", () => {
    expect(YEARS_STEP.min).toBe(MIN_YEARS);
    expect(YEARS_STEP.max).toBe(MAX_YEARS_AHEAD);
    expect(stepValue(20, 1, YEARS_STEP)).toBe(21);
    expect(stepValue(20, -1, YEARS_STEP)).toBe(19);
    expect(stepValue(60, 1, YEARS_STEP)).toBe(60);
    expect(stepValue(1, -1, YEARS_STEP)).toBe(1);
  });
});
