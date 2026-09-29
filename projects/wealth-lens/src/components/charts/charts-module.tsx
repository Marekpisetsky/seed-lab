"use client";

import dynamic from "next/dynamic";
import { FirstSteps } from "@/components/onboarding/first-steps";
import { ResultsLoading } from "@/components/results-loading";
import { useAppState } from "@/hooks/use-app";
import { hasStarted } from "@/lib/app-store";

/** Holdings and curated instruments. Loaded only once there is a plan, so the first screen stays small. */
const ChartsContent = dynamic(() => import("./charts-content").then((module) => module.ChartsContent), {
  ssr: false,
  loading: ResultsLoading,
});

export function ChartsModule() {
  const state = useAppState();
  if (!hasStarted(state)) return <FirstSteps />;
  return <ChartsContent />;
}
