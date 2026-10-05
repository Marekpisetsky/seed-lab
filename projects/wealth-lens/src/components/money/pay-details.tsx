"use client";

import { OctagonAlert, ShieldCheck, TriangleAlert } from "lucide-react";
import { useId } from "react";
import { useI18n } from "@/components/i18n";
import { Changed } from "@/components/ui/changed";
import { Help } from "@/components/ui/help";
import type { CalculationBundle } from "@/hooks/use-calculation";
import type { I18n } from "@/i18n";
import { updatePlan } from "@/lib/app-store";
import { yearsLasting } from "@/lib/monte-carlo";
import { snapWithdrawal, withdrawalZone, WITHDRAWAL_STEPS, type WithdrawalZone } from "@/lib/withdrawal";

/** With no ups and downs the answer is certain: whether the withdrawals last, and when they run out. */
function sameEveryYearText(rate: number, realReturn: number, { m }: I18n): string {
  const years = yearsLasting(rate, realReturn);
  return Number.isFinite(years) ? m.result.runsOut(m.units.years(Math.floor(years))) : m.result.neverRunsOut;
}

const ZONE_LOOK: Record<WithdrawalZone, { Icon: typeof ShieldCheck; tone: string }> = {
  prudent: { Icon: ShieldCheck, tone: "border-positive/40 text-positive" },
  risky: { Icon: TriangleAlert, tone: "border-warning-border text-warning-foreground" },
  "very-risky": { Icon: OctagonAlert, tone: "border-negative/40 text-negative" },
};

/** The zone in words, with its own icon: never by colour alone. */
function Zone({ zone }: { zone: WithdrawalZone }) {
  const { m } = useI18n();
  const { Icon, tone } = ZONE_LOOK[zone];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-sm font-semibold ${tone}`}>
      <Icon aria-hidden="true" className="size-4" />
      <Changed value={m.result.zone[zone]} />
    </span>
  );
}

/**
 * "It could pay you €374 a month", in its card: a slider for the share
 * taken out each year, 2 % to 7 % in steps of 0.5 %, and, as it moves,
 * what that pays a month, in how many of 100 possible futures it lasted 30
 * years, and its zone: prudent, risky or very risky, in words. With no ups
 * and downs: whether it runs out, and when. Every step's figures are worked
 * out ahead (lib/success-table.ts, hooks/use-calculation.ts).
 */
export function PayDetails({ bundle }: { bundle: CalculationBundle }) {
  const i18n = useI18n();
  const { m, f } = i18n;
  const id = useId();
  const { calc, state } = bundle;
  const { result, investment } = calc;
  const rate = snapWithdrawal(state.plan.withdrawalRate);
  const step = Math.max(0, WITHDRAWAL_STEPS.indexOf(rate));
  const steady = investment.volatility <= 0;
  const lasted = steady ? sameEveryYearText(rate, investment.realReturn, i18n) : m.result.lastedOf(Math.round(result.lasted * 100));
  const zone = withdrawalZone(result.lasted);
  const value = m.result.takenOutValue(f.rate(rate), f.smallEur(result.income));
  return (
    <div className="space-y-2">
      <p className="text-sm text-muted">{m.help.income}</p>
      <label htmlFor={id} className="flex flex-wrap items-baseline justify-between gap-x-3">
        <span className="text-sm font-medium">{m.result.takenOut}</span>
        <span className="text-lg font-bold tabular-nums">
          <Changed value={value} />
        </span>
      </label>
      <input
        id={id}
        type="range"
        min={0}
        max={WITHDRAWAL_STEPS.length - 1}
        step={1}
        value={step}
        onChange={(event) => updatePlan({ withdrawalRate: WITHDRAWAL_STEPS[Number(event.target.value)] })}
        aria-valuetext={m.result.takenOutAria(f.rate(rate), f.smallEur(result.income), lasted, m.result.zone[zone])}
        className="block h-11 w-full cursor-pointer accent-(--accent)"
      />
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
        <Zone zone={zone} />
        <span className="flex-1">
          <Changed value={lasted} />
        </span>
        {!steady && <Help what={m.result.takenOut} text={`${m.help.lasted} ${m.result.zoneHelp}`} align="end" />}
      </div>
    </div>
  );
}
