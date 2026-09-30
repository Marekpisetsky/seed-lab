"use client";

import { useMemo } from "react";
import { Changed } from "@/components/ui/changed";
import { inputClass, SettledNumberInput } from "@/components/ui/form";
import { useAppState } from "@/hooks/use-app";
import { updatePlan } from "@/lib/app-store";
import { priceHoldings } from "@/lib/auto-price";
import { formatEur } from "@/lib/format";
import { INDEXES, INDEX_IDS } from "@/lib/indexes";
import { assumptionLines, portfolioMix, resolveInvestment } from "@/lib/investment";
import { startingCapital } from "@/lib/plan";
import type { Investment } from "@/lib/types";
import { MAX_AMOUNT, MAX_YEARS_AHEAD, MIN_YEARS } from "@/lib/validation";

const labelClass = "block text-xs font-medium text-muted";

/** A number field with a unit in front (€) or behind (years). */
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block min-w-0 space-y-1">
      <span className={labelClass}>{label}</span>
      {children}
    </label>
  );
}

function EuroInput({ label, value, onCommit }: { label: string; value: number; onCommit: (value: number) => void }) {
  return (
    <Field label={label}>
      <span className="relative block">
        <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted">
          €
        </span>
        <SettledNumberInput value={value} onCommit={onCommit} max={MAX_AMOUNT} placeholder="0" className="pl-7 text-base" />
      </span>
    </Field>
  );
}

/** A select value for each choice: "index:sp500", "portfolio", "current". */
const keyOf = (investment: Investment) =>
  investment.kind === "index" ? `index:${investment.index}` : investment.kind === "portfolio" ? "portfolio" : "current";

/**
 * The calculator, first and on its own: what you have, what you add each
 * month, what it is invested in, and for how many years. It starts with
 * real values (EUR 1,000, EUR 200, the S&P 500, 20 years) and changes the
 * result once the user has finished typing.
 */
export function CalculatorCard() {
  const { plan, holdings, uploadedPrices } = useAppState();
  const priced = useMemo(() => priceHoldings(holdings, uploadedPrices), [holdings, uploadedPrices]);
  const capital = startingCapital(priced, plan.invested);
  const hasPortfolio = portfolioMix(priced).weights.length > 0;
  const current = resolveInvestment(plan.investment, priced);
  const other = plan.investment.kind === "stock" || plan.investment.kind === "custom";

  return (
    <section aria-label="Calculator" className="grid grid-cols-2 gap-x-3 gap-y-4 rounded-xl border border-border bg-card p-4 sm:grid-cols-4">
      {capital.source === "holdings" ? (
        <div className="min-w-0 space-y-1">
          <p className={labelClass}>You have</p>
          <p className="py-1.5 text-base font-semibold">
            <Changed value={formatEur(capital.amount)} />
          </p>
          <p className="text-xs text-muted">Euro holdings, on My stocks</p>
        </div>
      ) : (
        <EuroInput label="You have" value={plan.invested} onCommit={(invested) => updatePlan({ invested })} />
      )}
      <EuroInput label="You add each month" value={plan.monthlyContribution} onCommit={(monthlyContribution) => updatePlan({ monthlyContribution })} />
      <Field label="Invested in">
        <select
          className={`${inputClass} text-base`}
          value={keyOf(plan.investment)}
          onChange={(event) => {
            const value = event.target.value;
            if (value === "portfolio") updatePlan({ investment: { kind: "portfolio" } });
            else if (value.startsWith("index:")) {
              const index = INDEX_IDS.find((id) => `index:${id}` === value);
              if (index) updatePlan({ investment: { kind: "index", index } });
            }
          }}
        >
          {INDEX_IDS.map((id) => (
            <option key={id} value={`index:${id}`}>
              {INDEXES[id].name}
            </option>
          ))}
          <option value="portfolio" disabled={!hasPortfolio}>
            {hasPortfolio ? "My portfolio" : "My portfolio (add holdings)"}
          </option>
          {other && <option value="current">{current.name}</option>}
        </select>
      </Field>
      <Field label="For">
        <span className="relative block">
          <SettledNumberInput
            value={plan.years}
            onCommit={(years) => updatePlan({ years: Math.min(MAX_YEARS_AHEAD, Math.max(MIN_YEARS, Math.round(years))) })}
            max={MAX_YEARS_AHEAD}
            placeholder="20"
            className="pr-14 text-base"
          />
          <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-muted">
            years
          </span>
        </span>
      </Field>
      <div className="col-span-2 space-y-0.5 text-xs text-muted sm:col-span-4">
        {assumptionLines(current).map((line, index) => (
          <p key={index}>
            <Changed value={line} />
          </p>
        ))}
      </div>
    </section>
  );
}
