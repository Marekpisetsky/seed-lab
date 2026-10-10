"use client";

import { OctagonAlert, ShieldCheck, TriangleAlert } from "lucide-react";
import { useId } from "react";
import { useI18n } from "@/components/i18n";
import { Changed } from "@/components/ui/changed";
import { Help } from "@/components/ui/help";
import type { CalculationBundle } from "@/hooks/use-calculation";
import type { I18n } from "@/i18n";
import { updatePlan } from "@/lib/app-store";
import { KIT_WORDS } from "@seed-kit/words/index.ts";
import type { Calculation } from "@/lib/calculator";
import { yearsLasting } from "@/lib/monte-carlo";
import { earlyFall, RETIREMENT_YEARS } from "@/lib/safe-rate";
import { withdrawalZone, WITHDRAWAL_STEPS, type WithdrawalZone } from "@/lib/withdrawal";

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

/** The slider's steps: 2 % to 7 % every 0.5 %, and the data's rate, wherever it falls. */
export function sliderSteps(dataRate: number): number[] {
  const rounded = Math.round(dataRate * 10_000) / 10_000;
  return [...new Set([...WITHDRAWAL_STEPS, rounded])].sort((a, b) => a - b);
}

/**
 * Under the slider: the rate the data back for this investment and why
 * (A4, lib/safe-rate.ts): from every start in its history, the worst
 * included, with how many runs are behind it; the same every year for
 * savings; for growth of one's own, what a fall like the most similar
 * asset's worst year would do at the start. Every rate with what it pays.
 */
function DataRate({ calc, rate, chosen }: { calc: Calculation; rate: number; chosen: boolean }) {
  const i18n = useI18n();
  const { m, f, locale } = i18n;
  const t = m.safe;
  const { safe, result, investment } = calc;
  // What a rate pays a month on the same total as the slider's.
  const pays = (share: number) => f.smallCur(rate > 0 ? (result.income * share) / rate : 0);
  const lines: string[] = [];
  if (safe.kind === "history") {
    const plan = investment.investment;
    lines.push(plan.kind === "asset" ? t.data(m.assets.inSentence[plan.asset], f.rate(safe.rate), pays(safe.rate)) : t.mix(f.rate(safe.rate), pays(safe.rate)));
    lines.push(`${t.history(safe.years, safe.from, safe.worstStart)} ${t.periods(safe.periods, safe.years)}`);
    if (safe.years < safe.askedYears) lines.push(t.shorter(safe.years, safe.askedYears));
    if (safe.few) lines.push(t.few);
  } else if (safe.kind === "steady") {
    lines.push(t.steady(f.rate(safe.rate), pays(safe.rate), safe.years));
  } else {
    const fall = earlyFall(safe, rate, investment.realReturn);
    const outcome = fall.lastsAll
      ? t.lasts(f.rate(rate), pays(rate), RETIREMENT_YEARS)
      : t.runsOut(f.rate(rate), pays(rate), m.units.years(Math.max(1, fall.lasted)));
    lines.push(t.own);
    lines.push(`${t.fall(m.assets.inSentence[safe.fall.asset], f.percent(safe.fall.change, { decimals: 0 }), safe.fall.year)} ${outcome}`);
  }
  return (
    <div className="space-y-1 text-sm">
      {lines.map((line) => (
        <p key={line} className="text-muted">
          <Changed value={line} />
        </p>
      ))}
      {chosen && safe.kind !== "own" && (
        <p className="flex flex-wrap items-center gap-x-2">
          <span>{t.yours(f.rate(rate))}</span>
          <button type="button" onClick={() => updatePlan({ withdrawalRate: null })} className="inline-flex min-h-11 items-center font-medium text-accent underline-offset-2 hover:underline">
            {t.useData}
          </button>
        </p>
      )}
      <p className="text-muted">{KIT_WORDS[locale].withdrawal.why}</p>
    </div>
  );
}

/**
 * "It could pay you €374 a month", in its card: a slider for the share
 * taken out each year, 2 % to 7 % in steps of 0.5 % and the data's rate
 * (where it starts), and, as it moves,
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
  const rate = calc.scenario.withdrawalRate;
  const steps = sliderSteps(calc.safe.rate);
  const step = Math.max(0, steps.findIndex((value) => Math.abs(value - rate) < 1e-4));
  const steady = investment.volatility <= 0;
  const lasted = steady ? sameEveryYearText(rate, investment.realReturn, i18n) : m.result.lastedOf(Math.round(result.lasted * 100));
  const zone = withdrawalZone(result.lasted);
  const value = m.result.takenOutValue(f.rate(rate), f.smallCur(result.income));
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
        max={steps.length - 1}
        step={1}
        value={step}
        onChange={(event) => {
          const picked = steps[Number(event.target.value)];
          // The data's own step follows the investment; any other is the user's.
          updatePlan({ withdrawalRate: Math.abs(picked - calc.safe.rate) < 1e-4 ? null : picked });
        }}
        aria-valuetext={m.result.takenOutAria(f.rate(rate), f.smallCur(result.income), lasted, m.result.zone[zone])}
        className="block h-11 w-full cursor-pointer accent-(--accent)"
      />
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
        <Zone zone={zone} />
        <span className="flex-1">
          <Changed value={lasted} />
        </span>
        {!steady && <Help what={m.result.takenOut} text={`${m.help.lasted} ${m.result.zoneHelp}`} align="end" />}
      </div>
      <DataRate calc={calc} rate={rate} chosen={state.plan.withdrawalRate !== null} />
    </div>
  );
}
