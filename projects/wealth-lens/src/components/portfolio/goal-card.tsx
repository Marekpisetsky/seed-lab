"use client";

import { ReturnSlider } from "@/components/assumptions/return-slider";
import { Card } from "@/components/ui/card";
import { Field, inputClass, NumberInput, PercentInput } from "@/components/ui/form";
import { Notice } from "@/components/ui/notice";
import { toIsoDate } from "@/lib/dates";
import { formatDuration, formatMoney, formatMonthYear, formatPercent } from "@/lib/format";
import type { GoalProjection } from "@/lib/goal-projection";
import { isIsoDate } from "@/lib/storage";
import { BASE_CURRENCY, type Assumptions, type Goal } from "@/lib/types";

interface GoalCardProps {
  goal: Goal;
  assumptions: Assumptions;
  startingCapital: number;
  projection: GoalProjection;
  /** Currencies whose holdings are left out of the starting capital. */
  excludedCurrencies: string[];
  /** Holdings in the base currency without a current price. */
  unpricedCount: number;
  today: Date;
  onGoalChange: (patch: Partial<Goal>) => void;
  onAssumptionsChange: (patch: Partial<Assumptions>) => void;
}

const eur = (amount: number, decimals = 0) => formatMoney(amount, BASE_CURRENCY, { decimals });

export function GoalCard({
  goal,
  assumptions,
  startingCapital,
  projection,
  excludedCurrencies,
  unpricedCount,
  today,
  onGoalChange,
  onAssumptionsChange,
}: GoalCardProps) {
  return (
    <Card
      title="Time to your goal"
      description="Compound growth on your EUR holdings plus a fixed monthly contribution. All amounts are in today's euros."
    >
      <div className="grid gap-6 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <div className="grid content-start gap-4 sm:grid-cols-2 md:grid-cols-1">
          <Field label={`Goal (${BASE_CURRENCY})`}>
            {(props) => (
              <NumberInput
                {...props}
                key={goal.amount}
                value={goal.amount}
                min={1}
                onCommit={(amount) => amount !== null && onGoalChange({ amount })}
              />
            )}
          </Field>
          <Field label="Target date (optional)" hint="Leave empty to just see when you get there.">
            {(props) => (
              <input
                {...props}
                type="date"
                min={toIsoDate(today)}
                value={goal.targetDate ?? ""}
                onChange={(event) => {
                  const value = event.target.value;
                  onGoalChange({ targetDate: isIsoDate(value) ? value : null });
                }}
                className={inputClass}
              />
            )}
          </Field>
          <Field label={`Monthly contribution (${BASE_CURRENCY})`} hint="Assumed to keep pace with inflation.">
            {(props) => (
              <NumberInput
                {...props}
                key={assumptions.monthlyContribution}
                value={assumptions.monthlyContribution}
                min={0}
                onCommit={(value) => value !== null && onAssumptionsChange({ monthlyContribution: value })}
              />
            )}
          </Field>
          <Field label="Expected inflation (%)" hint="Only used to show the nominal equivalent.">
            {(props) => (
              <PercentInput
                {...props}
                key={assumptions.inflation}
                value={assumptions.inflation}
                min={-5}
                max={50}
                onCommit={(value) => value !== null && onAssumptionsChange({ inflation: value })}
              />
            )}
          </Field>
        </div>

        <div className="space-y-4">
          <Result goal={goal} assumptions={assumptions} startingCapital={startingCapital} projection={projection} />
          <StartingCapitalNotes excludedCurrencies={excludedCurrencies} unpricedCount={unpricedCount} />
          <ReturnSlider
            value={assumptions.realReturn}
            onChange={(realReturn) => onAssumptionsChange({ realReturn })}
            inflation={assumptions.inflation}
            nominalEquivalent={projection.nominalReturn}
          />
          <Sensitivity projection={projection} current={assumptions.realReturn} />
          {projection.target && <TargetComparison goal={goal} assumptions={assumptions} projection={projection} />}
          <Notice tone="warning">
            This assumes the same return every single year. Real markets swing, sometimes for a decade, and past
            returns do not guarantee future ones. Treat the result as a rough range, not a date.
          </Notice>
        </div>
      </div>
    </Card>
  );
}

interface ResultProps {
  goal: Goal;
  assumptions: Assumptions;
  startingCapital: number;
  projection: GoalProjection;
}

function Result({ goal, assumptions, startingCapital, projection }: ResultProps) {
  const { months, reachDate } = projection;
  const headline =
    months === 0 ? "Goal reached" : Number.isFinite(months) ? formatDuration(months) : "Not reachable";
  const detail =
    months === 0
      ? `Your EUR holdings are already worth ${eur(startingCapital)}.`
      : reachDate
        ? `to reach ${eur(goal.amount)} · around ${formatMonthYear(reachDate)}`
        : "Add EUR holdings with a current price or a monthly contribution.";

  return (
    <div className="rounded-lg border border-border bg-background p-4" aria-live="polite">
      <p className="text-sm text-muted">
        Starting from {eur(startingCapital)} + {eur(assumptions.monthlyContribution)}/month
      </p>
      <p className="mt-1 text-3xl font-semibold tracking-tight">{headline}</p>
      <p className="text-sm">{detail}</p>
      <p className="mt-3 inline-flex rounded-full bg-accent/10 px-3 py-1 text-sm font-medium text-accent">
        Assuming {formatPercent(assumptions.realReturn)} real return per year
      </p>
    </div>
  );
}

interface StartingCapitalNotesProps {
  excludedCurrencies: string[];
  unpricedCount: number;
}

function StartingCapitalNotes({ excludedCurrencies, unpricedCount }: StartingCapitalNotesProps) {
  if (excludedCurrencies.length === 0 && unpricedCount === 0) return null;
  return (
    <ul className="list-disc space-y-1 pl-5 text-xs text-muted">
      {excludedCurrencies.length > 0 && (
        <li>
          Holdings in {excludedCurrencies.join(", ")} are not counted: the app does not convert currencies. Enter
          them in {BASE_CURRENCY} to include them.
        </li>
      )}
      {unpricedCount > 0 && (
        <li>
          {unpricedCount} {BASE_CURRENCY} holding{unpricedCount === 1 ? " has" : "s have"} no current price and{" "}
          {unpricedCount === 1 ? "is" : "are"} not counted.
        </li>
      )}
    </ul>
  );
}

function Sensitivity({ projection, current }: { projection: GoalProjection; current: number }) {
  return (
    <div>
      <p className="text-sm font-medium">Same inputs at other returns</p>
      <ul className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {projection.sensitivity.map(({ rate, months }) => {
          const isCurrent = Math.abs(rate - current) < 1e-9;
          return (
            <li
              key={rate}
              className={`rounded-md border px-2 py-1.5 text-center text-sm ${
                isCurrent ? "border-accent bg-accent/10" : "border-border"
              }`}
            >
              <span className="block text-xs text-muted">{formatPercent(rate, { decimals: 0 })} real</span>
              <span className="tabular-nums">{months === 0 ? "reached" : formatDuration(months)}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function TargetComparison({ goal, assumptions, projection }: Omit<ResultProps, "startingCapital">) {
  const target = projection.target!;
  if (target.months <= 0) {
    return <Notice tone="warning">Your target date ({formatMonthYear(target.date)}) has already passed.</Notice>;
  }
  const ahead = target.gap >= 0;
  return (
    <div className="rounded-lg border border-border p-3 text-sm">
      <p>
        By <strong>{formatMonthYear(target.date)}</strong> ({formatDuration(target.months)} from now) you would have
        about <strong className="tabular-nums">{eur(target.projectedValue)}</strong>:{" "}
        <span className={ahead ? "text-positive" : "text-negative"}>
          {eur(Math.abs(target.gap))} {ahead ? "ahead of" : "short of"}
        </span>{" "}
        your goal of {eur(goal.amount)}.
      </p>
      {!ahead && (
        <p className="mt-1">
          To get there by then you would need about{" "}
          <strong className="tabular-nums">{eur(target.requiredContribution)}/month</strong> (you contribute{" "}
          {eur(assumptions.monthlyContribution)}).
        </p>
      )}
    </div>
  );
}
