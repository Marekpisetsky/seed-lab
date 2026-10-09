import { describe, expect, it } from "vitest";
import { planReady, startingCapital } from "./plan";

describe("startingCapital", () => {
  it("is the amount typed, and 0 before anything is typed", () => {
    expect(startingCapital(50_000)).toEqual({ amount: 50_000, source: "answer" });
    expect(startingCapital(null)).toEqual({ amount: 0, source: "answer" });
  });
});

describe("planReady", () => {
  it("needs both amounts; 0 is an answer, an empty field is not", () => {
    expect(planReady({ invested: null, monthlyContribution: null })).toBe(false);
    expect(planReady({ invested: 1000, monthlyContribution: null })).toBe(false);
    expect(planReady({ invested: null, monthlyContribution: 200 })).toBe(false);
    expect(planReady({ invested: 0, monthlyContribution: 0 })).toBe(true);
  });
});
