"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { updatePlan } from "@/lib/app-store";
import { formatApproxDuration, formatMoney } from "@/lib/format";
import type { PlanView } from "@/lib/plan-view";
import { BASE_CURRENCY } from "@/lib/types";

const eur = (amount: number) => formatMoney(amount, BASE_CURRENCY, { decimals: 0 });

/** "~13 years (2040)", "already reached" or "not reachable yet". */
export function reachedIn({ months, reachDate }: PlanView["projection"]): string {
  if (months === 0) return "already reached";
  if (!reachDate) return "not reachable yet";
  return `${formatApproxDuration(months)} (${reachDate.getUTCFullYear()})`;
}

/** "€99,000 needed · ~13 years (2040) · ≈ €330/month", each part kept on one line. */
export function CountryGoalLine({ view }: { view: PlanView }) {
  const { goal, projection } = view;
  if (goal.kind !== "country") return null;
  return (
    <p className="text-sm tabular-nums">
      <span className="whitespace-nowrap">{eur(goal.amount)} needed</span> ·{" "}
      <span className="whitespace-nowrap">{reachedIn(projection)}</span> ·{" "}
      <span className="whitespace-nowrap">≈ {eur(goal.monthlyCost)}/month</span>
    </p>
  );
}

/** The active country goal in one line, with the way back to the euro goal. */
export function CountryGoalCard({ view, euroGoal }: { view: PlanView; euroGoal: number }) {
  const { goal } = view;
  if (goal.kind !== "country") return null;
  return (
    <Card className="border-accent">
      <div className="space-y-2" aria-live="polite">
        <p className="text-sm text-muted">Your goal</p>
        <p className="text-xl font-semibold tracking-tight">Live in {goal.country.name}</p>
        <CountryGoalLine view={view} />
        <div className="flex flex-wrap gap-2 pt-1">
          <Link
            href="/"
            className="inline-flex items-center rounded-md bg-accent px-3 py-2 text-sm font-medium text-accent-foreground hover:opacity-90"
          >
            See your progress →
          </Link>
          <Button variant="ghost" onClick={() => updatePlan({ goalCountry: null })}>
            ← Back to my {eur(euroGoal)} goal
          </Button>
        </div>
      </div>
    </Card>
  );
}
