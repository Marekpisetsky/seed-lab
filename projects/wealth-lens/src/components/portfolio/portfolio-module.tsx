"use client";

import dynamic from "next/dynamic";
import { FirstSteps } from "@/components/onboarding/first-steps";
import { ResultsLoading } from "@/components/results-loading";
import { useAppState } from "@/hooks/use-app";
import { hasStarted } from "@/lib/app-store";

/** Gain, goal, income and holdings. Loaded only once there is a plan, so the first screen stays small. */
const PortfolioContent = dynamic(() => import("./portfolio-content").then((module) => module.PortfolioContent), {
  ssr: false,
  loading: ResultsLoading,
});

export function PortfolioModule() {
  const state = useAppState();
  if (!hasStarted(state)) return <FirstSteps />;
  return <PortfolioContent />;
}
