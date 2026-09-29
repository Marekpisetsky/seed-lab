"use client";

import { useState } from "react";
import { PlanForm } from "@/components/onboarding/plan-form";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Gain } from "@/components/ui/gain";
import { ProgressBar } from "@/components/ui/progress-bar";
import type { CurrencySummary } from "@/lib/finance";
import { formatApproxDuration, formatMoney, formatMonthYear, formatPercent } from "@/lib/format";
import type { GoalProjection } from "@/lib/goal-projection";
import { goalProgress, type StartingCapital } from "@/lib/plan";
import { BASE_CURRENCY, type Assumptions, type Goal } from "@/lib/types";

interface OverviewProps {
  capital: StartingCapital;
  gain: { main: CurrencySummary | null; others: CurrencySummary[] };
  goal: Goal;
  assumptions: Assumptions;
  projection: GoalProjection;
  /** Currencies left out of the goal because the app does not convert them. */
  excludedCurrencies: string[];
  onPlanChange: (answers: { invested: number; monthly: number; goal: number }) => void;
}

const eur = (amount: number) => formatMoney(amount, BASE_CURRENCY, { decimals: 0 });

/** The two answers of this screen, big: how much I gained, and when I reach my goal. */
export function Overview({ capital, gain, goal, assumptions, projection, excludedCurrencies, onPlanChange }: OverviewProps) {
  const [editing, setEditing] = useState(false);
  return (
    <Card>
      <div className="space-y-6">
        <GainHeadline capital={capital} gain={gain} />
        <div className="space-y-3 border-t border-border pt-5">
          <GoalHeadline goal={goal} projection={projection} />
          <ProgressBar value={goalProgress(capital.amount, goal.amount)} label="Progress towards your goal" />
          <p className="text-sm text-muted tabular-nums">
            {eur(capital.amount)} of {eur(goal.amount)} ({formatPercent(goalProgress(capital.amount, goal.amount), { decimals: 0 })})
          </p>
          <p className="text-sm">
            Assumes <strong>{formatPercent(assumptions.realReturn)} growth after inflation</strong> and{" "}
            {eur(assumptions.monthlyContribution)} a month. A rough guide, not a promise.
          </p>
          {excludedCurrencies.length > 0 && (
            <p className="text-xs text-muted">Not counted: holdings in {excludedCurrencies.join(", ")} (no currency conversion).</p>
          )}
        </div>
        {editing ? (
          <PlanForm
            initial={{
              invested: String(capital.source === "answer" ? capital.amount : 0),
              monthly: String(assumptions.monthlyContribution),
              goal: String(goal.amount),
            }}
            submitLabel="Save plan"
            holdingsValue={capital.source === "holdings" ? capital.amount : null}
            onSubmit={(answers) => {
              onPlanChange(answers);
              setEditing(false);
            }}
            onCancel={() => setEditing(false)}
          />
        ) : (
          <Button variant="secondary" onClick={() => setEditing(true)}>
            Edit plan
          </Button>
        )}
      </div>
    </Card>
  );
}

function GainHeadline({ capital, gain }: Pick<OverviewProps, "capital" | "gain">) {
  if (capital.source !== "holdings") {
    return (
      <div>
        <p className="text-sm text-muted">You have invested</p>
        <p className="text-4xl font-semibold tracking-tight tabular-nums">{eur(capital.amount)}</p>
        <p className="mt-1 text-sm text-muted">Add your holdings below to see how much you gained.</p>
      </div>
    );
  }
  if (!gain.main) {
    return (
      <div>
        <p className="text-sm text-muted">Your gain</p>
        <p className="text-2xl font-semibold">Waiting for prices</p>
        <p className="mt-1 text-sm text-muted">Add a price to a holding to see your gain.</p>
      </div>
    );
  }
  const { main, others } = gain;
  return (
    <div>
      <p className="text-sm text-muted">{main.gain.absolute >= 0 ? "You've gained" : "You're down"}</p>
      <Gain gain={main.gain} currency={main.currency} decimals={0} className="block text-4xl font-semibold tracking-tight" />
      {others.map((summary) => (
        <p key={summary.currency} className="mt-1 text-sm text-muted">
          Plus <Gain gain={summary.gain} currency={summary.currency} decimals={0} /> in {summary.currency}
        </p>
      ))}
    </div>
  );
}

function GoalHeadline({ goal, projection }: { goal: Goal; projection: GoalProjection }) {
  const { months, reachDate } = projection;
  if (months === 0) {
    return (
      <div>
        <p className="text-sm text-muted">Your goal: {eur(goal.amount)}</p>
        <p className="text-3xl font-semibold tracking-tight">Goal already reached</p>
      </div>
    );
  }
  if (!reachDate) {
    return (
      <div>
        <p className="text-sm text-muted">Your goal: {eur(goal.amount)}</p>
        <p className="text-3xl font-semibold tracking-tight">Not reachable yet</p>
        <p className="mt-1 text-sm text-muted">Add a monthly amount with “Edit plan”.</p>
      </div>
    );
  }
  return (
    <div>
      <p className="text-sm text-muted">Your goal: {eur(goal.amount)}</p>
      <p className="text-3xl font-semibold tracking-tight">
        Goal reached in {formatApproxDuration(months)}{" "}
        <span className="text-xl font-normal text-muted">({formatMonthYear(reachDate)})</span>
      </p>
    </div>
  );
}
