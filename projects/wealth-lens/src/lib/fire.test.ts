import { describe, expect, it } from "vitest";
import type { CountryCost } from "./cost-of-living";
import { monthsToGoal } from "./finance";
import { coverageByCountry, monthlyCost, requirementsByCountry } from "./fire";

function country(code: string, withoutRent: number, withRent: number): CountryCost {
  return {
    code,
    name: code,
    region: "Europe",
    monthlyCostEur: { withoutRent, withRent },
    source: "test",
    referenceDate: "2026-09",
  };
}

const countries = [country("BB", 1200, 2000), country("AA", 500, 800), country("CC", 1500, 2500)];

describe("monthlyCost", () => {
  it("picks the cost for the housing situation", () => {
    expect(monthlyCost(countries[0], "rent")).toBe(2000);
    expect(monthlyCost(countries[0], "own")).toBe(1200);
  });
});

describe("coverageByCountry", () => {
  // €450,000 × 4 % = €18,000/year = €1,500/month.
  it("computes the sustainable income from capital × withdrawal rate", () => {
    const result = coverageByCountry(countries, 450_000, 0.04, "rent");
    expect(result.annualIncome).toBeCloseTo(18_000, 6);
    expect(result.monthlyIncome).toBeCloseTo(1500, 6);
  });

  it("lists countries from cheapest to most expensive and marks the covered ones", () => {
    const result = coverageByCountry(countries, 450_000, 0.04, "rent");
    expect(result.rows.map((row) => [row.country.code, row.covered])).toEqual([
      ["AA", true],
      ["BB", false],
      ["CC", false],
    ]);
    expect(result.coveredCount).toBe(1);
    expect(result.rows[0].coverage).toBeCloseTo(1500 / 800, 10);
    expect(result.rows[1].monthlyMargin).toBeCloseTo(-500, 6);
  });

  it("covers more countries without rent", () => {
    const result = coverageByCountry(countries, 450_000, 0.04, "own");
    expect(result.rows.map((row) => row.covered)).toEqual([true, true, true]);
    expect(result.coveredCount).toBe(3);
  });

  it("covers nothing with no capital", () => {
    expect(coverageByCountry(countries, 0, 0.04, "rent").coveredCount).toBe(0);
  });
});

describe("requirementsByCountry", () => {
  const input = { capital: 100_000, withdrawalRate: 0.04, realReturn: 0.07, monthlyContribution: 1000, housing: "rent" as const };

  it("needs 25 × the annual cost at a 4 % withdrawal rate", () => {
    const rows = requirementsByCountry(countries, input);
    // AA: €800/month → €9,600/year → €240,000.
    expect(rows[0].country.code).toBe("AA");
    expect(rows[0].annualCost).toBe(9600);
    expect(rows[0].requiredCapital).toBeCloseTo(240_000, 6);
    expect(rows.map((row) => row.requiredCapital)).toEqual([240_000, 600_000, 750_000].map((n) => expect.closeTo(n, 6)));
  });

  it("reuses the time-to-goal math for each country", () => {
    const rows = requirementsByCountry(countries, input);
    for (const row of rows) {
      expect(row.monthsToReach).toBeCloseTo(monthsToGoal(100_000, 1000, 0.07, row.requiredCapital), 10);
    }
    // More expensive countries take longer.
    expect(rows[0].monthsToReach).toBeLessThan(rows[1].monthsToReach);
  });

  it("reports countries already within reach as 0 months", () => {
    const rows = requirementsByCountry(countries, { ...input, capital: 300_000 });
    expect(rows[0].monthsToReach).toBe(0);
  });

  it("reports unreachable targets as Infinity", () => {
    const rows = requirementsByCountry(countries, { ...input, capital: 0, monthlyContribution: 0 });
    expect(rows.every((row) => row.monthsToReach === Infinity)).toBe(true);
  });
});
