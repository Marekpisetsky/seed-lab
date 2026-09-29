/**
 * The FIRE simulator's two views, computed from the finance primitives:
 * which countries the current capital already covers, and how much capital
 * (and time) each country needs.
 */

import type { CountryCost } from "./cost-of-living";
import { monthsToGoal, requiredCapital, sustainableAnnualIncome } from "./finance";
import type { FireSettings } from "./types";

/** Whether the cost includes paying rent or assumes a home without rent. */
export type Housing = FireSettings["housing"];

export function monthlyCost(country: CountryCost, housing: Housing): number {
  return housing === "rent" ? country.monthlyCostEur.withRent : country.monthlyCostEur.withoutRent;
}

export interface CoverageRow {
  country: CountryCost;
  monthlyCost: number;
  /** Sustainable income ÷ annual cost; 1 or more means covered. */
  coverage: number;
  covered: boolean;
  /** Sustainable monthly income minus the monthly cost (negative = short). */
  monthlyMargin: number;
}

export interface CoverageResult {
  annualIncome: number;
  monthlyIncome: number;
  rows: CoverageRow[];
  coveredCount: number;
}

/** View "with my current capital": income = capital × withdrawal rate. */
export function coverageByCountry(
  countries: readonly CountryCost[],
  capital: number,
  withdrawalRate: number,
  housing: Housing,
): CoverageResult {
  const annualIncome = sustainableAnnualIncome(capital, withdrawalRate);
  const monthlyIncome = annualIncome / 12;
  const rows = countries
    .map((country) => {
      const cost = monthlyCost(country, housing);
      return {
        country,
        monthlyCost: cost,
        coverage: monthlyIncome / cost,
        covered: monthlyIncome >= cost,
        monthlyMargin: monthlyIncome - cost,
      };
    })
    .sort((a, b) => a.monthlyCost - b.monthlyCost || a.country.name.localeCompare(b.country.name));
  return { annualIncome, monthlyIncome, rows, coveredCount: rows.filter((row) => row.covered).length };
}

export interface RequirementInput {
  capital: number;
  withdrawalRate: number;
  realReturn: number;
  monthlyContribution: number;
  housing: Housing;
}

export interface RequirementRow {
  country: CountryCost;
  monthlyCost: number;
  annualCost: number;
  /** annual cost ÷ withdrawal rate (× 25 at 4 %). */
  requiredCapital: number;
  /** Months until the capital reaches `requiredCapital`; 0 if already there, Infinity if never. */
  monthsToReach: number;
}

/** View "how much I need": required capital per country and time to get there. */
export function requirementsByCountry(
  countries: readonly CountryCost[],
  { capital, withdrawalRate, realReturn, monthlyContribution, housing }: RequirementInput,
): RequirementRow[] {
  return countries
    .map((country) => {
      const cost = monthlyCost(country, housing);
      const needed = requiredCapital(cost * 12, withdrawalRate);
      return {
        country,
        monthlyCost: cost,
        annualCost: cost * 12,
        requiredCapital: needed,
        monthsToReach: monthsToGoal(capital, monthlyContribution, realReturn, needed),
      };
    })
    .sort((a, b) => a.requiredCapital - b.requiredCapital || a.country.name.localeCompare(b.country.name));
}
