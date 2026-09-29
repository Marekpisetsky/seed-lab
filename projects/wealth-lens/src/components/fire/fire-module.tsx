"use client";

import dynamic from "next/dynamic";
import { FirstSteps } from "@/components/onboarding/first-steps";
import { ResultsLoading } from "@/components/results-loading";
import { useAppState } from "@/hooks/use-app";
import { hasStarted } from "@/lib/app-store";

/** Success rate and countries. Loaded only once there is a plan, so the first screen stays small. */
const FireContent = dynamic(() => import("./fire-content").then((module) => module.FireContent), {
  ssr: false,
  loading: ResultsLoading,
});

export function FireModule() {
  const state = useAppState();
  if (!hasStarted(state)) return <FirstSteps />;
  return <FireContent />;
}
