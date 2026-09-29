"use client";

import { type AppState } from "@/lib/app-store";
import { priceHoldings } from "@/lib/auto-price";
import { toIsoDate } from "@/lib/dates";
import { topFindings, type Finding } from "@/lib/findings";
import { resolveInvestment } from "@/lib/investment";
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
  const holdings = priceHoldings(state.holdings, state.uploadedPrices);
  const report = buildReport(state.plan, holdings, today);
  const bundle = { holdings, report, findings: topFindings(report, holdings), levers: buildLevers(report, holdings) };
  try {
    performance.measure("wealth-lens:report", { start, end: performance.now() });
  } catch {
    // Measuring is optional.
  }
  last = { state, day, bundle };
  if (typeof window !== "undefined") warmOtherInvestments(bundle);
  return bundle;
}

const warmed = new Set<string>();

/**
 * Simulates the investments the user has not chosen while the browser is
 * idle, so choosing one recomputes as fast as typing a number: the first
 * simulation of a history is the only slow step.
 */
function warmOtherInvestments({ levers, holdings, report }: ReportBundle): void {
  const rates = [...WITHDRAWAL_CHOICES, report.scenario.withdrawalRate];
  const todo = levers.investment
    .filter((option) => !option.selected)
    .map((option) => resolveInvestment(option.value, holdings))
    .filter((investment) => !warmed.has(`${investment.key}|${report.scenario.withdrawalRate}`));
  if (todo.length === 0) return;
  const idle = window.requestIdleCallback ?? ((callback: () => void) => window.setTimeout(callback, 50));
  const step = () => {
    const investment = todo.shift();
    if (!investment) return;
    warmed.add(`${investment.key}|${report.scenario.withdrawalRate}`);
    cachedSuccessRates(investment.key, investment.returns, rates);
    wealthPercentiles({ start: 0, monthly: 0, returns: investment.returns, years: 10, key: investment.key });
    idle(step);
  };
  idle(step);
}

export function useReport(): ReportBundle {
  return reportFor(useAppState(), useToday());
}
