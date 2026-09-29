"use client";

import { useMemo } from "react";
import { SettledNumberInput } from "@/components/ui/form";
import { useAppState } from "@/hooks/use-app";
import { updatePlan } from "@/lib/app-store";
import { priceHoldings } from "@/lib/auto-price";
import { formatEur } from "@/lib/format";
import { startingCapital } from "@/lib/plan";
import { MAX_AMOUNT } from "@/lib/validation";

/** A money field with a euro sign in front; the report changes once the user has finished typing. */
function EuroField({
  label,
  value,
  onCommit,
  onFocus,
}: {
  label: string;
  value: number;
  onCommit: (value: number) => void;
  onFocus: () => void;
}) {
  return (
    <label className="block space-y-1">
      <span className="block text-xs font-medium text-muted">{label}</span>
      <span className="relative block">
        <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted">
          €
        </span>
        <SettledNumberInput value={value} onCommit={onCommit} max={MAX_AMOUNT} placeholder="0" onFocus={onFocus} className="pl-7 text-base" />
      </span>
    </label>
  );
}

/**
 * The two facts everything is worked out from: real values from the start
 * (EUR 1,000 and EUR 200 a month), the same the levers show. The report
 * changes once the user has finished typing, not with each key. With
 * holdings, the invested amount is their value.
 */
export function YourNumbers({ onReach }: { onReach: () => void }) {
  const { plan, holdings, uploadedPrices } = useAppState();
  const capital = useMemo(
    () => startingCapital(priceHoldings(holdings, uploadedPrices), plan.invested),
    [holdings, uploadedPrices, plan.invested],
  );
  return (
    <section aria-label="Your numbers" className="grid grid-cols-2 gap-3 rounded-xl border border-border bg-card p-4">
      {capital.source === "holdings" ? (
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted">In your stocks</p>
          <p className="py-1.5 text-lg font-semibold">{formatEur(capital.amount)}</p>
          <p className="text-xs text-muted">Euro holdings, on My stocks</p>
        </div>
      ) : (
        <EuroField
          label="You have invested"
          value={plan.invested}
          onCommit={(invested) => updatePlan({ invested })}
          onFocus={onReach}
        />
      )}
      <EuroField
        label="You add each month"
        value={plan.monthlyContribution}
        onCommit={(monthlyContribution) => updatePlan({ monthlyContribution })}
        onFocus={onReach}
      />
    </section>
  );
}
