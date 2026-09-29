"use client";

import dynamic from "next/dynamic";
import { useAppState } from "@/hooks/use-app";
import { hasStarted } from "@/lib/app-store";
import { StartOptions, Welcome } from "./welcome";
import { YourNumbers } from "./your-numbers";

/** The report (datasets, engine, charts) is its own chunk, so the first screen stays small. */
const loadReport = () => import("./report-view");

/** Starts loading the report, and its first simulations, as soon as the user reaches for a number. */
export function prefetchReport(): void {
  void loadReport().then((module) => module.warmUp());
}

function HeadlineLoading() {
  return <div className="h-24 animate-pulse rounded-xl bg-border/40" aria-busy="true" aria-label="Working out your answer" />;
}

const ReportHeadline = dynamic(() => loadReport().then((module) => module.ReportHeadline), {
  ssr: false,
  loading: HeadlineLoading,
});
const ReportBody = dynamic(() => loadReport().then((module) => module.ReportBody), { ssr: false });

/**
 * "My money": the answer first, then what matters, what changes it and what
 * it means in real life. The two numbers stay in the same place before and
 * after the report appears, so typing is never interrupted.
 */
export function MoneyModule() {
  const started = hasStarted(useAppState());
  return (
    <div className="space-y-8">
      {started ? <ReportHeadline /> : <Welcome />}
      <YourNumbers onReach={prefetchReport} />
      {started ? <ReportBody /> : <StartOptions />}
    </div>
  );
}
