"use client";

import { type AppState } from "@/lib/app-store";
import { priceHoldings } from "@/lib/auto-price";
import { toIsoDate } from "@/lib/dates";
import { topFindings, type Finding } from "@/lib/findings";
import { resolveInvestment, type ResolvedInvestment } from "@/lib/investment";
import { buildLevers, WITHDRAWAL_CHOICES, type Levers } from "@/lib/levers";
import { buildReport, type Report } from "@/lib/report";
import { cachedSuccessRates, wealthPercentiles } from "@/lib/simulation";
import type { Holding } from "@/lib/types";
import { useAppState } from "./use-app";
import { useToday } from "./use-plan";

export interface ReportBundle {
  holdings: readonly Holding[];
  report: Report;
  findings: Finding[];
  levers: Levers;
}

let last: { state: AppState; day: string; bundle: ReportBundle } | null = null;

/**
 * Everything "My money" shows, worked out once per change of the shared
 * state and shared by every section. The time it takes is recorded as the
 * performance measure "wealth-lens:report".
 */
export function reportFor(state: AppState, today: Date): ReportBundle {
  const day = toIsoDate(today);
  if (last && last.state === state && last.day === day) return last.bundle;
  const start = performance.now();
  const bundle = compute(state, today);
  try {
    performance.measure("wealth-lens:report", { start, end: performance.now() });
  } catch {
    // Measuring is optional.
  }
  last = { state, day, bundle };
  if (typeof window !== "undefined") warmOtherInvestments(bundle);
  return bundle;
}

function compute(state: AppState, today: Date): ReportBundle {
  const holdings = priceHoldings(state.holdings, state.uploadedPrices);
  const report = buildReport(state.plan, holdings, today);
  return { holdings, report, findings: topFindings(report, holdings), levers: buildLevers(report, holdings) };
}

const warmed = new Set<string>();

function idle(callback: () => void): void {
  if (typeof window.requestIdleCallback === "function") window.requestIdleCallback(callback);
  else window.setTimeout(callback, 50);
}

/**
 * Runs the simulations of these investments while the browser is idle. The
 * first simulation of a history is the only slow step of the report, so
 * afterwards choosing one recomputes as fast as typing a number.
 */
function warm(investments: readonly ResolvedInvestment[], withdrawalRate: number): void {
  const rates = [...WITHDRAWAL_CHOICES, withdrawalRate];
  const todo = investments.filter((investment) => !warmed.has(`${investment.key}|${withdrawalRate}`));
  if (todo.length === 0) return;
  const step = () => {
    const investment = todo.shift();
    if (!investment) return;
    warmed.add(`${investment.key}|${withdrawalRate}`);
    cachedSuccessRates(investment.key, investment.returns, rates);
    wealthPercentiles({ start: 0, monthly: 0, returns: investment.returns, years: 10, key: investment.key });
    idle(step);
  };
  idle(step);
}

/**
 * Before the first report, e.g. while the first number is being typed: the
 * plan's own investment, then one report on the current state, so the code
 * that works out the answer is already compiled when the number arrives.
 */
export function warmUp(state: AppState, today: Date): void {
  const holdings = priceHoldings(state.holdings, state.uploadedPrices);
  warm([resolveInvestment(state.plan.investment, holdings)], state.plan.withdrawalRate);
  // Not recorded as a measure, and not kept: only the compiled code is wanted.
  idle(() => compute(state, today));
}

/** After a report: the investments the user has not chosen. */
function warmOtherInvestments({ levers, holdings, report }: ReportBundle): void {
  const others = levers.investment.filter((option) => !option.selected).map((option) => resolveInvestment(option.value, holdings));
  warm(others, report.scenario.withdrawalRate);
}

export function useReport(): ReportBundle {
  return reportFor(useAppState(), useToday());
}
