"use client";

import { type AppState } from "@/lib/app-store";
import { priceHoldings } from "@/lib/auto-price";
import { toIsoDate } from "@/lib/dates";
import { topFindings, type Finding } from "@/lib/findings";
import { buildLevers, type Levers } from "@/lib/levers";
import { buildReport, type Report } from "@/lib/report";
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
  return bundle;
}

export function useReport(): ReportBundle {
  return reportFor(useAppState(), useToday());
}
