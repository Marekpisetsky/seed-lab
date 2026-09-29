"use client";

import { useMemo } from "react";
import { LiveNumberInput } from "@/components/ui/form";
import { useAppState } from "@/hooks/use-app";
import { updatePlan } from "@/lib/app-store";
import { priceHoldings } from "@/lib/auto-price";
import { formatEur } from "@/lib/format";
import { startingCapital } from "@/lib/plan";

/** A money field with a euro sign in front. */
function EuroField({
  label,
  value,
  onValue,
  placeholder,
  onFocus,
}: {
  label: string;
  value: number | null;
  onValue: (value: number | null) => void;
  placeholder: string;
  onFocus: () => void;
}) {
  return (
    <label className="block space-y-1">
      <span className="block text-xs font-medium text-muted">{label}</span>
      <span className="relative block">
        <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted">
          €
        </span>
        <LiveNumberInput value={value} onValue={onValue} placeholder={placeholder} onFocus={onFocus} className="pl-7 text-base" />
      </span>
    </label>
  );
}

/**
 * The two facts everything is worked out from. They update the whole report
 * as they are typed. With holdings, the invested amount is their value.
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
          onValue={(invested) => updatePlan({ invested })}
          placeholder="1,000"
          onFocus={onReach}
        />
      )}
      <EuroField
        label="You add each month"
        value={plan.monthlyContribution > 0 ? plan.monthlyContribution : null}
        onValue={(monthly) => updatePlan({ monthlyContribution: monthly ?? 0 })}
        placeholder="200"
        onFocus={onReach}
      />
    </section>
  );
}
