"use client";

import { type AppState } from "@/lib/app-store";
import { priceHoldings } from "@/lib/auto-price";
import { calculate, WITHDRAWAL_CHOICES, type Calculation } from "@/lib/calculator";
import { toIsoDate } from "@/lib/dates";
import { topFindings, type Finding } from "@/lib/findings";
import { portfolioMix, resolveInvestment, type ResolvedInvestment } from "@/lib/investment";
import { INDEX_IDS } from "@/lib/indexes";
import { cachedSuccessRates, wealthPercentiles } from "@/lib/simulation";
import type { Holding, Investment } from "@/lib/types";
import { useAppState } from "./use-app";
import { useToday } from "./use-plan";

export interface CalculationBundle {
  state: AppState;
  today: Date;
  holdings: readonly Holding[];
  calc: Calculation;
  /** How often each offered withdrawal rate lasted 30 years with this investment, lowest rate first. */
  rates: { rate: number; lasted: number }[];
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
  const lasted = cachedSuccessRates(calc.investment.key, calc.investment.returns, rates);
  const bundle = { state, today, holdings, calc, rates: rates.map((rate, index) => ({ rate, lasted: lasted[index] })) };
  try {
    performance.measure("wealth-lens:report", { start, end: performance.now() });
  } catch {
    // Measuring is optional.
  }
  last = { state, day, bundle };
  if (typeof window !== "undefined") warmOtherInvestments(bundle);
  return bundle;
}

let lastFindings: { bundle: CalculationBundle; findings: Finding[] } | null = null;

/** The findings of a calculation, worked out only when their section is open. */
export function findingsFor(bundle: CalculationBundle): Finding[] {
  if (lastFindings?.bundle === bundle) return lastFindings.findings;
  const findings = topFindings({ calc: bundle.calc, inflation: bundle.state.plan.inflation, today: bundle.today, holdings: bundle.holdings });
  lastFindings = { bundle, findings };
  return findings;
}

const warmed = new Set<string>();

function idle(callback: () => void): void {
  if (typeof window.requestIdleCallback === "function") window.requestIdleCallback(callback);
  else window.setTimeout(callback, 50);
}

/**
 * Simulates the investments the user has not chosen while the browser is
 * idle: the first simulation of a history is the only slow step, so
 * afterwards choosing one recomputes as fast as typing a number.
 */
function warmOtherInvestments({ calc, holdings, state }: CalculationBundle): void {
  const choices: Investment[] = INDEX_IDS.map((index) => ({ kind: "index", index }));
  if (portfolioMix(holdings).weights.length > 0) choices.push({ kind: "portfolio" });
  const rates = offeredRates(state.plan.withdrawalRate);
  const todo: ResolvedInvestment[] = choices
    .map((choice) => resolveInvestment(choice, holdings))
    .filter((investment) => investment.key !== calc.investment.key && !warmed.has(investment.key));
  const step = () => {
    const investment = todo.shift();
    if (!investment) return;
    warmed.add(investment.key);
    cachedSuccessRates(investment.key, investment.returns, rates);
    wealthPercentiles({ start: 0, monthly: 0, returns: investment.returns, years: 10, key: investment.key });
    idle(step);
  };
  if (todo.length > 0) idle(step);
}

export function useCalculation(): CalculationBundle {
  return calculationFor(useAppState(), useToday());
}
