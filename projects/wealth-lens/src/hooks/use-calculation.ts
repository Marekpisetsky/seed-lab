"use client";

import { type AppState } from "@/lib/app-store";
import { priceHoldings } from "@/lib/auto-price";
import { calculate, WITHDRAWAL_CHOICES, type Calculation } from "@/lib/calculator";
import { toIsoDate } from "@/lib/dates";
import { topFindings, type Finding } from "@/lib/findings";
import { mixFigures, successRatesFor, type MixFigures } from "@/lib/projections";
import type { Holding } from "@/lib/types";
import { useAppState } from "./use-app";
import { useToday } from "./use-plan";

export interface CalculationBundle {
  state: AppState;
  today: Date;
  holdings: readonly Holding[];
  calc: Calculation;
  /** How often each offered withdrawal rate lasted 30 years with this investment, lowest rate first. */
  rates: { rate: number; lasted: number }[];
  /** For a mix or the portfolio: its range and worst year, with the S&P 500 alone beside them. */
  mix: MixFigures | null;
}

let last: { state: AppState; day: string; bundle: CalculationBundle } | null = null;

/** The rates offered: 3, 4 and 5 %, plus the plan's own if a file set another. */
export function offeredRates(withdrawalRate: number): number[] {
  return [...new Set([...WITHDRAWAL_CHOICES, withdrawalRate])].sort((a, b) => a - b);
}

/**
 * Everything the page shows, worked out once per change of the shared state
 * and shared by every section. The time it takes is recorded as the
 * performance measure "wealth-lens:report".
 */
export function calculationFor(state: AppState, today: Date): CalculationBundle {
  const day = toIsoDate(today);
  if (last && last.state === state && last.day === day) return last.bundle;
  const start = performance.now();
  const holdings = priceHoldings(state.holdings, state.uploadedPrices);
  const calc = calculate(state.plan, holdings, today);
  const rates = offeredRates(state.plan.withdrawalRate);
  const lasted = successRatesFor(calc.investment, rates);
  const mix = mixFigures(calc.investment, { start: calc.scenario.capital, monthly: calc.scenario.monthly, years: calc.result.years });
  const bundle = { state, today, holdings, calc, rates: rates.map((rate, index) => ({ rate, lasted: lasted[index] })), mix };
  try {
    performance.measure("wealth-lens:report", { start, end: performance.now() });
  } catch {
    // Measuring is optional.
  }
  last = { state, day, bundle };
  return bundle;
}

let lastFindings: { bundle: CalculationBundle; findings: Finding[] } | null = null;

/** The findings of a calculation, worked out only when their section is open. */
export function findingsFor(bundle: CalculationBundle): Finding[] {
  if (lastFindings?.bundle === bundle) return lastFindings.findings;
  const findings = topFindings({ calc: bundle.calc, inflation: bundle.calc.investment.inflation, today: bundle.today, holdings: bundle.holdings });
  lastFindings = { bundle, findings };
  return findings;
}

export function useCalculation(): CalculationBundle {
  return calculationFor(useAppState(), useToday());
}
