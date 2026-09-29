"use client";

import { useMemo } from "react";
import { FirstSteps } from "@/components/onboarding/first-steps";
import { useAppState, usePlanView, usePricedHoldings, useToday } from "@/hooks/use-app";
import { hasStarted, setHoldings, updatePlan } from "@/lib/app-store";
import { summarizeByCurrency } from "@/lib/finance";
import { headlineGain } from "@/lib/plan";
import { BASE_CURRENCY } from "@/lib/types";
import { HoldingsList } from "./holdings-list";
import { Overview } from "./overview";
import { PlanAdvanced } from "./plan-advanced";

export function PortfolioModule() {
  const state = useAppState();
  if (!hasStarted(state)) return <FirstSteps />;
  return <PortfolioContent />;
}

function PortfolioContent() {
  const { plan } = useAppState();
  const holdings = usePricedHoldings();
  const view = usePlanView();
  const today = useToday();

  const summaries = useMemo(() => summarizeByCurrency(holdings), [holdings]);
  const excludedCurrencies = summaries
    .filter((summary) => summary.currency !== BASE_CURRENCY)
    .map((summary) => summary.currency);

  return (
    <div className="space-y-6">
      <Overview
        view={view}
        plan={plan}
        gain={headlineGain(summaries)}
        excludedCurrencies={excludedCurrencies}
        onPlanChange={({ invested, monthly, goal: amount }) =>
          updatePlan((previous) => ({
            ...(view.capital.source !== "holdings" && { invested }),
            monthlyContribution: monthly,
            goal: { ...previous.goal, amount },
            // A new goal amount makes the euro goal the active one again.
            ...(amount !== previous.goal.amount && { goalCountry: null }),
          }))
        }
      />
      <HoldingsList holdings={holdings} onChange={setHoldings} />
      <PlanAdvanced
        plan={plan}
        view={view}
        today={today}
        onGoalChange={(patch) => updatePlan((previous) => ({ goal: { ...previous.goal, ...patch } }))}
        onPlanChange={updatePlan}
      />
    </div>
  );
}
