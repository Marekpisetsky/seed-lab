import { describe, expect, it } from "vitest";
import { parseIsoDate, toIsoDate } from "./dates";
import { futureValueWithContributions, requiredMonthlyContribution } from "./finance";
import { projectGoal } from "./goal-projection";

const today = parseIsoDate("2026-09-29");
const assumptions = { realReturn: 0.07, monthlyContribution: 500, inflation: 0.02 };

describe("projectGoal", () => {
  it("projects the months to the goal and the month it is reached", () => {
    const projection = projectGoal({
      startingCapital: 10_000,
      goal: { amount: 100_000, targetDate: null },
      assumptions,
      today,
    });
    expect(projection.months).toBeCloseTo(115.1742, 4);
    // Reached during month 116 → 2036-05-29.
    expect(toIsoDate(projection.reachDate!)).toBe("2036-05-29");
    expect(projection.nominalReturn).toBeCloseTo(0.0914, 10);
    expect(projection.target).toBeNull();
  });

  it("shows how the result changes with the assumed return", () => {
    const { sensitivity } = projectGoal({
      startingCapital: 10_000,
      goal: { amount: 100_000, targetDate: null },
      assumptions,
      today,
    });
    expect(sensitivity.map((s) => s.rate)).toEqual([0.03, 0.05, 0.07, 0.1]);
    const months = sensitivity.map((s) => s.months);
    // Higher return → sooner, strictly.
    expect([...months].sort((a, b) => b - a)).toEqual(months);
    expect(months[2]).toBeCloseTo(115.1742, 4);
  });

  it("compares the projection with a target date", () => {
    const projection = projectGoal({
      startingCapital: 10_000,
      goal: { amount: 100_000, targetDate: "2035-09-29" },
      assumptions,
      today,
    });
    const target = projection.target!;
    expect(target.months).toBe(108);
    expect(target.projectedValue).toBeCloseTo(futureValueWithContributions(10_000, 500, 0.07, 9), 6);
    expect(target.gap).toBeLessThan(0); // 9 years is shorter than the ~9.6 needed
    expect(target.requiredContribution).toBeCloseTo(requiredMonthlyContribution(10_000, 0.07, 108, 100_000), 6);
    expect(target.requiredContribution).toBeGreaterThan(500);
  });

  it("handles a target date in the past", () => {
    const target = projectGoal({
      startingCapital: 10_000,
      goal: { amount: 100_000, targetDate: "2025-01-01" },
      assumptions,
      today,
    }).target!;
    expect(target.months).toBeLessThan(0);
    expect(target.projectedValue).toBe(10_000);
    expect(target.requiredContribution).toBe(Infinity);
  });

  it("returns no reach date when the goal is unreachable", () => {
    const projection = projectGoal({
      startingCapital: 0,
      goal: { amount: 100_000, targetDate: null },
      assumptions: { ...assumptions, monthlyContribution: 0 },
      today,
    });
    expect(projection.months).toBe(Infinity);
    expect(projection.reachDate).toBeNull();
  });
});
