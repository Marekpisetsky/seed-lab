"use client";

import { Disclosure } from "@/components/ui/disclosure";
import { Field, inputClass, PercentInput } from "@/components/ui/form";
import { toIsoDate } from "@/lib/dates";
import { formatApproxDuration, formatDuration, formatMoney, formatMonthYear, formatPercent } from "@/lib/format";
import type { TargetDateProjection } from "@/lib/goal-projection";
import type { PlanView } from "@/lib/plan-view";
import { BASE_CURRENCY, type Assumptions, type Goal, type Plan } from "@/lib/types";
import { isIsoDate } from "@/lib/validation";

interface PlanAdvancedProps {
  plan: Plan;
  view: PlanView;
  today: Date;
  onGoalChange: (patch: Partial<Goal>) => void;
  onPlanChange: (patch: Partial<Plan>) => void;
}

const eur = (amount: number) => formatMoney(amount, BASE_CURRENCY, { decimals: 0 });

/** Assumptions and extras, folded away from the first read. */
export function PlanAdvanced({ plan, view, today, onGoalChange, onPlanChange }: PlanAdvancedProps) {
  const { assumptions, projection } = view;
  const goal = plan.goal;
  return (
    <Disclosure summary="Advanced">
      <div>
        <p className="text-sm font-medium">Time to your goal at other growth rates</p>
        <ul className="mt-2 grid grid-cols-4 gap-2">
          {projection.sensitivity.map(({ rate, months }) => {
            const current = Math.abs(rate - assumptions.realReturn) < 1e-9;
            return (
              <li
                key={rate}
                className={`rounded-md border px-1 py-1.5 text-center text-sm ${current ? "border-accent bg-accent/10" : "border-border"}`}
              >
                <span className="block text-xs text-muted">{formatPercent(rate, { decimals: 0 })}</span>
                <span className="tabular-nums">{months === 0 ? "done" : formatApproxDuration(months)}</span>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Inflation per year (%)">
          {(props) => (
            <PercentInput
              {...props}
              key={plan.inflation}
              value={plan.inflation}
              min={-5}
              max={50}
              onCommit={(value) => value !== null && onPlanChange({ inflation: value })}
            />
          )}
        </Field>
        <Field label="Target date (optional)">
          {(props) => (
            <input
              {...props}
              type="date"
              min={toIsoDate(today)}
              value={goal.targetDate ?? ""}
              onChange={(event) => onGoalChange({ targetDate: isIsoDate(event.target.value) ? event.target.value : null })}
              className={inputClass}
            />
          )}
        </Field>
      </div>
      {projection.target && <TargetComparison assumptions={assumptions} target={projection.target} />}

      <p className="text-xs text-muted">
        Amounts are in today&apos;s euros: growth is counted after inflation ({formatPercent(assumptions.realReturn)}{" "}
        is about {formatPercent(projection.nominalReturn)} before {formatPercent(plan.inflation)} inflation), and your
        monthly amount is assumed to rise with prices. Real markets don&apos;t grow evenly; some decades are flat.
      </p>
    </Disclosure>
  );
}

function TargetComparison({ assumptions, target }: { assumptions: Assumptions; target: TargetDateProjection }) {
  if (target.months <= 0) {
    return <p className="text-sm text-negative">That date ({formatMonthYear(target.date)}) has already passed.</p>;
  }
  const ahead = target.gap >= 0;
  return (
    <p className="text-sm">
      By {formatMonthYear(target.date)} ({formatDuration(target.months)}) you&apos;d have about{" "}
      <strong className="tabular-nums">{eur(target.projectedValue)}</strong>,{" "}
      <span className={ahead ? "text-positive" : "text-negative"}>
        {eur(Math.abs(target.gap))} {ahead ? "more than" : "short of"}
      </span>{" "}
      your goal.
      {!ahead && (
        <>
          {" "}
          To make it, add about <strong className="tabular-nums">{eur(target.requiredContribution)}/month</strong>{" "}
          (now {eur(assumptions.monthlyContribution)}).
        </>
      )}
    </p>
  );
}
