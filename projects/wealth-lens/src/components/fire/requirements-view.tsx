"use client";

import { ReturnSlider } from "@/components/assumptions/return-slider";
import { Field, NumberInput } from "@/components/ui/form";
import { addMonths } from "@/lib/dates";
import { nominalReturn } from "@/lib/finance";
import type { RequirementRow } from "@/lib/fire";
import { formatDuration, formatMoney, formatMonthYear, formatNumber, formatPercent } from "@/lib/format";
import { BASE_CURRENCY, type Assumptions } from "@/lib/types";
import { DatasetNote, DatasetSources, FireRiskNotes } from "./fire-risk-notes";

interface RequirementsViewProps {
  capital: number;
  assumptions: Assumptions;
  rows: RequirementRow[];
  housingLabel: string;
  today: Date;
  onAssumptionsChange: (patch: Partial<Assumptions>) => void;
}

const eur = (amount: number) => formatMoney(amount, BASE_CURRENCY, { decimals: 0 });

/** "How much I need": capital per country and how long it takes to get there. */
export function RequirementsView({
  capital,
  assumptions,
  rows,
  housingLabel,
  today,
  onAssumptionsChange,
}: RequirementsViewProps) {
  const { withdrawalRate, realReturn, monthlyContribution, inflation } = assumptions;
  const reachable = rows.filter((row) => Number.isFinite(row.monthsToReach));
  const first = rows[0];

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border bg-background p-4" aria-live="polite">
        <p className="text-sm text-muted">Capital needed = yearly cost ÷ withdrawal rate</p>
        <p className="mt-1 text-3xl font-semibold tracking-tight">
          {formatNumber(1 / withdrawalRate, 1)}× your yearly costs
        </p>
        <p className="text-sm">
          At {formatPercent(withdrawalRate)}, the cheapest country here ({first.country.name}, {housingLabel}) needs{" "}
          {eur(first.requiredCapital)}.
        </p>
        <p className="mt-3 inline-flex rounded-full bg-accent/10 px-3 py-1 text-sm font-medium text-accent">
          Time to reach it: from {eur(capital)} + {eur(monthlyContribution)}/month at {formatPercent(realReturn)} real
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <Field label={`Monthly contribution (${BASE_CURRENCY})`} hint="Shared with the Portfolio page.">
          {(props) => (
            <NumberInput
              {...props}
              key={monthlyContribution}
              value={monthlyContribution}
              min={0}
              onCommit={(value) => value !== null && onAssumptionsChange({ monthlyContribution: value })}
            />
          )}
        </Field>
        <ReturnSlider
          value={realReturn}
          onChange={(value) => onAssumptionsChange({ realReturn: value })}
          inflation={inflation}
          nominalEquivalent={nominalReturn(realReturn, inflation)}
        />
      </div>

      <FireRiskNotes withdrawalRate={withdrawalRate} />
      <DatasetNote />

      {reachable.length === 0 && (
        <p className="text-sm text-muted">
          With no capital and no monthly contribution, no country is reachable. Add a contribution above.
        </p>
      )}

      <div className="-mx-4 overflow-x-auto sm:mx-0">
        <table className="w-full min-w-[20rem] text-sm">
          <caption className="sr-only">Capital needed per country and time to reach it</caption>
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
              <th scope="col" className="px-4 py-2 font-medium sm:px-2">
                Country
              </th>
              <th scope="col" className="hidden px-2 py-2 text-right font-medium sm:table-cell">
                Cost / month
              </th>
              <th scope="col" className="px-2 py-2 text-right font-medium">
                Capital<span className="hidden sm:inline"> needed</span>
              </th>
              <th scope="col" className="px-4 py-2 text-right font-medium sm:px-2">
                Time<span className="hidden sm:inline"> to reach</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.country.code} className="border-b border-border last:border-0">
                <td className="px-4 py-2 sm:px-2">
                  <span className="block font-medium">{row.country.name}</span>
                  <span className="block text-xs text-muted">
                    <span className="hidden sm:inline">{row.country.region}</span>
                    <span className="tabular-nums sm:hidden">{eur(row.monthlyCost)}/mo</span>
                  </span>
                </td>
                <td className="hidden px-2 py-2 text-right tabular-nums sm:table-cell">{eur(row.monthlyCost)}</td>
                <td className="px-2 py-2 text-right font-medium tabular-nums">{eur(row.requiredCapital)}</td>
                <td className="px-4 py-2 text-right sm:px-2">
                  <TimeToReach months={row.monthsToReach} today={today} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <DatasetSources />
    </div>
  );
}

function TimeToReach({ months, today }: { months: number; today: Date }) {
  if (months === 0) return <span className="text-positive">Reached</span>;
  if (!Number.isFinite(months)) return <span className="text-muted">Not reachable</span>;
  return (
    <>
      <span className="block tabular-nums">{formatDuration(months)}</span>
      <span className="block text-xs text-muted">~{formatMonthYear(addMonths(today, Math.ceil(months - 1e-9)))}</span>
    </>
  );
}
