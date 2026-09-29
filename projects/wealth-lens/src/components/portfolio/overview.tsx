"use client";

import Link from "next/link";
import { useState } from "react";
import { PlanForm } from "@/components/onboarding/plan-form";
import { CountryGoalLine } from "@/components/plan/country-goal";
import { InvestmentSummary } from "@/components/plan/investment-summary";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Gain } from "@/components/ui/gain";
import { ProgressBar } from "@/components/ui/progress-bar";
import { updatePlan } from "@/lib/app-store";
import type { CurrencySummary } from "@/lib/finance";
import { formatApproxDuration, formatMoney, formatMonthYear, formatPercent, formatRate } from "@/lib/format";
import { goalProgress, type StartingCapital } from "@/lib/plan";
import type { PlanView } from "@/lib/plan-view";
import { BASE_CURRENCY, type Plan } from "@/lib/types";

interface OverviewProps {
  view: PlanView;
  plan: Plan;
  gain: { main: CurrencySummary | null; others: CurrencySummary[] };
  /** Currencies left out of the goal because the app does not convert them. */
  excludedCurrencies: string[];
  onPlanChange: (answers: { invested: number; monthly: number; goal: number }) => void;
}

const eur = (amount: number) => formatMoney(amount, BASE_CURRENCY, { decimals: 0 });
const perMonth = (amount: number) => `≈ ${eur(amount)}/month`;

/** The answers of this screen, big: how much I gained, when I reach my goal, and what it would pay. */
export function Overview({ view, plan, gain, excludedCurrencies, onPlanChange }: OverviewProps) {
  const [editing, setEditing] = useState(false);
  const { capital, goal, investment, income } = view;
  const progress = goalProgress(capital.amount, goal.amount);
  return (
    <Card>
      <div className="space-y-6">
        <GainHeadline capital={capital} gain={gain} />

        <section aria-label="Your goal" className="space-y-3 border-t border-border pt-5">
          <GoalHeadline view={view} euroGoal={plan.goal.amount} />
          <ProgressBar value={progress} label="Progress towards your goal" />
          <p className="text-sm text-muted tabular-nums">
            {eur(capital.amount)} of {eur(goal.amount)} ({formatPercent(progress, { decimals: 0 })})
          </p>
          <InvestmentSummary investment={investment} />
          <p className="text-sm text-muted">
            Plus {eur(plan.monthlyContribution)} a month. A rough guide, not a promise.
          </p>
          {excludedCurrencies.length > 0 && (
            <p className="text-xs text-muted">Not counted: holdings in {excludedCurrencies.join(", ")} (no currency conversion).</p>
          )}
        </section>

        <section aria-label="Monthly income" className="space-y-2 border-t border-border pt-5">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-muted">Today your portfolio would pay</p>
              <p className="text-xl font-semibold tracking-tight tabular-nums">{perMonth(income.today)}</p>
            </div>
            <div>
              <p className="text-xs text-muted">At your goal you could withdraw</p>
              <p className="text-xl font-semibold tracking-tight tabular-nums">{perMonth(income.atGoal)}</p>
            </div>
          </div>
          <p className="text-xs text-muted">
            Taking out {formatRate(plan.withdrawalRate)} a year, in today&apos;s euros.{" "}
            <Link href="/fire" className="font-medium text-accent underline-offset-2 hover:underline">
              See where this is enough to live →
            </Link>
          </p>
        </section>

        {editing ? (
          <PlanForm
            initial={{
              invested: String(capital.source === "answer" ? capital.amount : 0),
              monthly: String(plan.monthlyContribution),
              goal: String(plan.goal.amount),
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

function GainHeadline({ capital, gain }: Pick<OverviewProps, "gain"> & { capital: StartingCapital }) {
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

function GoalHeadline({ view, euroGoal }: { view: PlanView; euroGoal: number }) {
  const { goal, projection } = view;
  if (goal.kind === "country") {
    return (
      <div className="space-y-1">
        <p className="text-sm text-muted">Your goal</p>
        <p className="text-3xl font-semibold tracking-tight">Live in {goal.country.name}</p>
        <CountryGoalLine view={view} />
        <Button size="sm" variant="ghost" className="-ml-2" onClick={() => updatePlan({ goalCountry: null })}>
          ← Back to my {eur(euroGoal)} goal
        </Button>
      </div>
    );
  }
  const { months, reachDate } = projection;
  return (
    <div>
      <p className="text-sm text-muted">Your goal: {eur(goal.amount)}</p>
      {months === 0 ? (
        <p className="text-3xl font-semibold tracking-tight">Goal already reached</p>
      ) : !reachDate ? (
        <>
          <p className="text-3xl font-semibold tracking-tight">Not reachable yet</p>
          <p className="mt-1 text-sm text-muted">Add a monthly amount with “Edit plan”.</p>
        </>
      ) : (
        <p className="text-3xl font-semibold tracking-tight">
          Goal reached in {formatApproxDuration(months)}{" "}
          <span className="text-xl font-normal text-muted">({formatMonthYear(reachDate)})</span>
        </p>
      )}
    </div>
  );
}
