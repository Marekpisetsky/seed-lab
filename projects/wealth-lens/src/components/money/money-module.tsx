"use client";

import dynamic from "next/dynamic";
import { useAppState } from "@/hooks/use-app";
import { MissionPicker } from "./mission-picker";
import { StartOptions } from "./welcome";
import { YourNumbers } from "./your-numbers";

/** The report (datasets, engine, charts) is its own chunk, so the first screen stays small. */
const loadReport = () => import("./report-view");

/** Starts loading the report, and its first simulations, as soon as the user reaches for a mission. */
export function prefetchReport(): void {
  void loadReport().then((module) => module.warmUp());
}

function TopLoading() {
  return <div className="h-40 animate-pulse rounded-xl bg-border/40" aria-busy="true" aria-label="Working out your answer" />;
}

const ReportTop = dynamic(() => loadReport().then((module) => module.ReportTop), { ssr: false, loading: TopLoading });
const ReportBody = dynamic(() => loadReport().then((module) => module.ReportBody), { ssr: false });

/**
 * "My money": first the mission, which only the user chooses; then the
 * answer to it, the two numbers, and what matters for it. Nothing here
 * picks or changes the mission.
 */
export function MoneyModule() {
  const { plan } = useAppState();
  if (plan.mission === null) {
    return (
      <div className="space-y-10">
        <MissionPicker onReach={prefetchReport} />
        <StartOptions />
      </div>
    );
  }
  return (
    <div className="space-y-8">
      <ReportTop />
      <YourNumbers onReach={prefetchReport} />
      <ReportBody />
    </div>
  );
}
