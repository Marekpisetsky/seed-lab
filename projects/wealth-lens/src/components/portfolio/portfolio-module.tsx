"use client";

import { useMemo } from "react";
import { ModuleSkeleton } from "@/components/module-skeleton";
import { FirstSteps } from "@/components/onboarding/first-steps";
import { useAutoPrices } from "@/hooks/use-auto-prices";
import { useHydrated, usePersistentStore } from "@/hooks/use-persistent-store";
import { startOfUtcDay } from "@/lib/dates";
import { summarizeByCurrency } from "@/lib/finance";
import { projectGoal } from "@/lib/goal-projection";
import { hasStarted, headlineGain, startingCapital } from "@/lib/plan";
import { assumptionsStore, chartSymbolsStore, goalStore, holdingsStore, investedStore } from "@/lib/stores";
import { BASE_CURRENCY } from "@/lib/types";
import { HoldingsList } from "./holdings-list";
import { Overview } from "./overview";
import { PlanAdvanced } from "./plan-advanced";

export function PortfolioModule() {
  const hydrated = useHydrated();
  const [holdings] = usePersistentStore(holdingsStore);
  const [invested] = usePersistentStore(investedStore);
  if (!hydrated) return <ModuleSkeleton />;
  if (!hasStarted(holdings, invested)) return <FirstSteps />;
  return <PortfolioContent />;
}

function PortfolioContent() {
  const [holdings, setHoldings] = usePersistentStore(holdingsStore);
  const [invested, setInvested] = usePersistentStore(investedStore);
  const [goal, setGoal] = usePersistentStore(goalStore);
  const [assumptions, setAssumptions] = usePersistentStore(assumptionsStore);
  const [symbolOverrides] = usePersistentStore(chartSymbolsStore);
  useAutoPrices(holdings, setHoldings, symbolOverrides);

  const summaries = useMemo(() => summarizeByCurrency(holdings), [holdings]);
  const capital = startingCapital(holdings, invested);
  const excludedCurrencies = summaries
    .filter((summary) => summary.currency !== BASE_CURRENCY)
    .map((summary) => summary.currency);

  const today = useMemo(() => startOfUtcDay(new Date()), []);
  const projection = useMemo(
    () => projectGoal({ startingCapital: capital.amount, goal, assumptions, today }),
    [capital.amount, goal, assumptions, today],
  );

  return (
    <div className="space-y-6">
      <Overview
        capital={capital}
        gain={headlineGain(summaries)}
        goal={goal}
        assumptions={assumptions}
        projection={projection}
        excludedCurrencies={excludedCurrencies}
        onPlanChange={({ invested: amount, monthly, goal: goalAmount }) => {
          if (capital.source !== "holdings") setInvested(amount);
          setAssumptions((previous) => ({ ...previous, monthlyContribution: monthly }));
          setGoal((previous) => ({ ...previous, amount: goalAmount }));
        }}
      />
      <HoldingsList holdings={holdings} onChange={setHoldings} />
      <PlanAdvanced
        goal={goal}
        assumptions={assumptions}
        projection={projection}
        today={today}
        onGoalChange={(patch) => setGoal((previous) => ({ ...previous, ...patch }))}
        onAssumptionsChange={(patch) => setAssumptions((previous) => ({ ...previous, ...patch }))}
      />
    </div>
  );
}
