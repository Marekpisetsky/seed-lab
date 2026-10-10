"use client";

import { type AppState } from "@/lib/app-store";
import { calculate, type Calculation } from "@/lib/calculator";
import { toIsoDate } from "@/lib/dates";
import { planReady } from "@/lib/plan";
import { planChecks, type PlanCheck } from "@/lib/plan-check";
import { successRatesFor } from "@/lib/projections";
import { offeredRates } from "@/lib/withdrawal";
import { useAppState } from "./use-app";
import { useToday } from "./use-plan";

export interface CalculationBundle {
  state: AppState;
  today: Date;
  /** Both amounts are known: there is a result to show (lib/plan.ts). Until then the page only asks. */
  ready: boolean;
  /** What the page shows: the plan, with the "What if…?" applied if there is one. */
  calc: Calculation;
  /** The plan as it is, without a "What if…?": the findings and the scenarios' effects are about it. */
  base: Calculation;
  /** The withdrawal rates the slider offers, lowest first; how often the plan's lasted is in `calc.result.lasted`. */
  rates: number[];
  /** "Check your plan": what stands out in the plan as it is, without a "What if…?" (lib/plan-check.ts). */
  checks: PlanCheck[];
}

let last: { state: AppState; day: string; bundle: CalculationBundle } | null = null;

export { offeredRates };

/**
 * Everything the page shows, worked out once per change of the shared state
 * and shared by every section. The time it takes is recorded as the
 * performance measure "wealth-lens:report".
 */
export function calculationFor(state: AppState, today: Date): CalculationBundle {
  const day = toIsoDate(today);
  if (last && last.state === state && last.day === day) return last.bundle;
  const start = performance.now();
  const base = calculate(state.plan, today, null);
  const calc = state.whatIf ? calculate(state.plan, today, state.whatIf) : base;
  const rates = offeredRates(base.scenario.withdrawalRate, base.safe.rate);
  const ready = planReady(state.plan);
  // Simulated futures only once there is a result to show.
  const checks = ready ? planChecks(base, state.plan) : [];
  const bundle = { state, today, ready, calc, base, rates, checks };
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
