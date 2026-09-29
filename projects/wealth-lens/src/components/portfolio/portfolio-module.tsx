"use client";

import { useMemo } from "react";
import { useHydrated, usePersistentStore } from "@/hooks/use-persistent-store";
import { startOfUtcDay } from "@/lib/dates";
import { summarizeByCurrency } from "@/lib/finance";
import { projectGoal } from "@/lib/goal-projection";
import { assumptionsStore, goalStore, holdingsStore } from "@/lib/stores";
import { BASE_CURRENCY } from "@/lib/types";
import { GainsSummary } from "./gains-summary";
import { GoalCard } from "./goal-card";
import { HoldingsCard } from "./holdings-card";

export function PortfolioModule() {
  const hydrated = useHydrated();
  if (!hydrated) return <ModuleSkeleton />;
  return <PortfolioContent />;
}

function PortfolioContent() {
  const [holdings, setHoldings] = usePersistentStore(holdingsStore);
  const [goal, setGoal] = usePersistentStore(goalStore);
  const [assumptions, setAssumptions] = usePersistentStore(assumptionsStore);

  const summaries = useMemo(() => summarizeByCurrency(holdings), [holdings]);
  const base = summaries.find((summary) => summary.currency === BASE_CURRENCY);
  const startingCapital = base?.value ?? 0;
  const excludedCurrencies = summaries
    .filter((summary) => summary.currency !== BASE_CURRENCY)
    .map((summary) => summary.currency);

  const today = useMemo(() => startOfUtcDay(new Date()), []);
  const projection = useMemo(
    () => projectGoal({ startingCapital, goal, assumptions, today }),
    [startingCapital, goal, assumptions, today],
  );

  return (
    <div className="space-y-6">
      <GainsSummary summaries={summaries} />
      <HoldingsCard holdings={holdings} onChange={setHoldings} />
      <GoalCard
        goal={goal}
        assumptions={assumptions}
        startingCapital={startingCapital}
        projection={projection}
        excludedCurrencies={excludedCurrencies}
        unpricedCount={base ? base.holdingCount - base.pricedCount : 0}
        today={today}
        onGoalChange={(patch) => setGoal((previous) => ({ ...previous, ...patch }))}
        onAssumptionsChange={(patch) => setAssumptions((previous) => ({ ...previous, ...patch }))}
      />
    </div>
  );
}

/** Shown during the server render, before saved data is read from the browser. */
export function ModuleSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading your data">
      {[0, 1, 2].map((key) => (
        <div key={key} className="h-40 animate-pulse rounded-xl border border-border bg-card" />
      ))}
    </div>
  );
}
