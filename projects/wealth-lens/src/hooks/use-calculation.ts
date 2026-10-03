"use client";

import { type AppState } from "@/lib/app-store";
import { priceHoldings } from "@/lib/auto-price";
import { calculate, type Calculation } from "@/lib/calculator";
import { toIsoDate } from "@/lib/dates";
import { planReady } from "@/lib/plan";
import { successRatesFor } from "@/lib/projections";
import type { Holding } from "@/lib/types";
import { WITHDRAWAL_STEPS } from "@/lib/withdrawal";
import { useAppState } from "./use-app";
import { useToday } from "./use-plan";

export interface CalculationBundle {
  state: AppState;
  today: Date;
  holdings: readonly Holding[];
  /** Both amounts are known: there is a result to show (lib/plan.ts). Until then the page only asks. */
  ready: boolean;
  /** What the page shows: the plan, with the "What if…?" applied if there is one. */
  calc: Calculation;
  /** The plan as it is, without a "What if…?": the findings and the scenarios' effects are about it. */
  base: Calculation;
  /** The withdrawal rates the slider offers, lowest first; how often the plan's lasted is in `calc.result.lasted`. */
  rates: number[];
}

let last: { state: AppState; day: string; bundle: CalculationBundle } | null = null;

/** The rates the slider offers, 2 % to 7 % (the plan's own is always one of them: lib/validation.ts). */
export function offeredRates(withdrawalRate: number): number[] {
  return [...new Set([...WITHDRAWAL_STEPS, withdrawalRate])].sort((a, b) => a - b);
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
  const base = calculate(state.plan, holdings, today);
  const calc = state.whatIf ? calculate(state.plan, holdings, today, state.whatIf) : base;
  const rates = offeredRates(state.plan.withdrawalRate);
  const bundle = { state, today, holdings, ready: planReady(state.plan, holdings), calc, base, rates };
  try {
    performance.measure("wealth-lens:report", { start, end: performance.now() });
  } catch {
    // Measuring is optional.
  }
  // The other rates on offer, in one pass once the page is idle: picking one then shows it at once.
  if (typeof window !== "undefined") {
    const ahead = () => successRatesFor(calc.investment, rates);
    if (typeof window.requestIdleCallback === "function") window.requestIdleCallback(ahead);
    else window.setTimeout(ahead, 30);
  }
  last = { state, day, bundle };
  return bundle;
}

export function useCalculation(): CalculationBundle {
  return calculationFor(useAppState(), useToday());
}
