"use client";

import { useI18n } from "@/components/i18n";
import { Changed } from "@/components/ui/changed";
import { Help } from "@/components/ui/help";
import { RadioGroup } from "@/components/ui/radio-group";
import type { CalculationBundle } from "@/hooks/use-calculation";
import type { I18n } from "@/i18n";
import { simulationsText } from "@/i18n/investment-text";
import { updatePlan } from "@/lib/app-store";
import { yearsLasting } from "@/lib/monte-carlo";

/** With no ups and downs the answer is certain: how long the withdrawals last at this growth. */
function sameEveryYearText(rate: number, realReturn: number, { m, f }: I18n): string {
  const years = yearsLasting(rate, realReturn);
  const pace = (realReturn < 0 ? m.result.shrinking : m.result.growing)(f.rate(Math.abs(realReturn)));
  if (!Number.isFinite(years)) return m.result.neverRunsOut(pace);
  return m.result.runsOut(pace, m.units.years(Math.floor(years)));
}

/**
 * "It could pay you €374/month", in its card: the share taken out each
 * year (3, 4 or 5 %) and how often that lasted 30 years in the
 * simulations, or, with no ups and downs, when it runs out.
 */
export function PayDetails({ bundle }: { bundle: CalculationBundle }) {
  const i18n = useI18n();
  const { m, f } = i18n;
  const { calc, rates, state } = bundle;
  const { result, investment } = calc;
  const rate = state.plan.withdrawalRate;
  return (
    <div className="space-y-2">
      <p className="text-sm text-muted">{m.help.income}</p>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm">
        <RadioGroup
          label={m.result.takenOut}
          options={rates.map((value) => ({ value, label: f.rate(value) }))}
          value={rate}
          onChange={(withdrawalRate) => updatePlan({ withdrawalRate })}
          className="inline-flex rounded-md border border-border p-0.5"
          optionClassName={(checked) => `min-h-11 min-w-11 rounded px-2 py-1 font-medium tabular-nums ${checked ? "bg-foreground text-background" : "text-muted hover:text-foreground"}`}
        />
        <span className="flex-1">
          {m.result.takenOutText}{" "}
          {investment.volatility > 0 ? (
            <Changed value={m.result.lasted(f.percent(result.lasted, { decimals: 0 }), simulationsText(investment, i18n))} />
          ) : (
            <Changed value={sameEveryYearText(rate, investment.realReturn, i18n)} />
          )}
        </span>
        {investment.volatility > 0 && <Help what={m.result.takenOut} text={m.help.lasted} align="end" />}
      </div>
    </div>
  );
}
