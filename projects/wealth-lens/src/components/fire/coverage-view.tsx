import type { CoverageResult } from "@/lib/fire";
import { formatMoney, formatPercent } from "@/lib/format";
import { BASE_CURRENCY } from "@/lib/types";
import { DatasetNote, DatasetSources, FireRiskNotes } from "./fire-risk-notes";

interface CoverageViewProps {
  capital: number;
  withdrawalRate: number;
  housingLabel: string;
  result: CoverageResult;
}

const eur = (amount: number) => formatMoney(amount, BASE_CURRENCY, { decimals: 0 });

/** "With my current capital": the income it supports and which countries that covers. */
export function CoverageView({ capital, withdrawalRate, housingLabel, result }: CoverageViewProps) {
  const { annualIncome, monthlyIncome, rows, coveredCount } = result;
  const cheapest = rows[0];
  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border bg-background p-4" aria-live="polite">
        <p className="text-sm text-muted">
          {eur(capital)} × {formatPercent(withdrawalRate)} withdrawal rate
        </p>
        <p className="mt-1 text-3xl font-semibold tracking-tight tabular-nums">
          {eur(monthlyIncome)}
          <span className="text-base font-normal text-muted">/month</span>
        </p>
        <p className="text-sm">
          {eur(annualIncome)} a year of sustainable income, in today&apos;s euros.
        </p>
        <p className="mt-3 text-sm font-medium">
          {coveredCount > 0
            ? `Covers ${coveredCount} of ${rows.length} countries (${housingLabel}).`
            : `Not enough for any country in the list yet (${housingLabel}): the cheapest, ${cheapest.country.name}, costs about ${eur(cheapest.monthlyCost)}/month.`}
        </p>
      </div>

      <FireRiskNotes withdrawalRate={withdrawalRate} />
      <DatasetNote />

      <div className="-mx-4 overflow-x-auto sm:mx-0">
        <table className="w-full min-w-[20rem] text-sm">
          <caption className="sr-only">
            Monthly cost per country compared with your sustainable income of {eur(monthlyIncome)} a month
          </caption>
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
              <th scope="col" className="px-4 py-2 font-medium sm:px-2">
                Country
              </th>
              <th scope="col" className="hidden px-2 py-2 text-right font-medium sm:table-cell">
                Cost / month
              </th>
              <th scope="col" className="px-4 py-2 font-medium sm:px-2">
                Your income covers
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
                <td className="px-4 py-2 sm:px-2">
                  <CoverageBar coverage={row.coverage} />
                  <span className={`text-xs tabular-nums ${row.covered ? "text-positive" : "text-muted"}`}>
                    {formatPercent(row.coverage, { decimals: 0 })} ·{" "}
                    {row.covered
                      ? `covered, ${eur(row.monthlyMargin)} spare`
                      : `${eur(-row.monthlyMargin)}/mo short`}
                  </span>
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

function CoverageBar({ coverage }: { coverage: number }) {
  const width = Math.min(1, Math.max(0, coverage)) * 100;
  return (
    <div className="mb-1 h-2 w-full max-w-48 overflow-hidden rounded-full bg-border" aria-hidden="true">
      <div
        className={`h-full rounded-full ${coverage >= 1 ? "bg-positive" : "bg-muted"}`}
        style={{ width: `${width}%` }}
      />
    </div>
  );
}
