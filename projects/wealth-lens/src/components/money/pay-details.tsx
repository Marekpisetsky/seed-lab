"use client";

import { OctagonAlert, ShieldCheck, TriangleAlert } from "lucide-react";
import { useId } from "react";
import { useI18n } from "@/components/i18n";
import { Changed } from "@/components/ui/changed";
import { Help } from "@/components/ui/help";
import type { CalculationBundle } from "@/hooks/use-calculation";
import type { I18n } from "@/i18n";
import { updatePlan } from "@/lib/app-store";
import { WITHDRAWAL_WHY } from "@seed-kit/words/withdrawal.ts";
import type { Calculation } from "@/lib/calculator";
import { yearsLasting } from "@/lib/monte-carlo";
import { assetSafeRate, earlyFall, RETIREMENT_YEARS } from "@/lib/safe-rate";
import { sliderSteps, withdrawalZone, type WithdrawalZone } from "@/lib/withdrawal";

export { sliderSteps };

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

/** Where the thumb sits: on the data's step while the plan follows the data, else on the user's. */
export function sliderIndex(steps: readonly number[], rate: number, followsData: boolean, dataRate: number): number {
  const target = followsData ? dataRate : rate;
  const exact = steps.findIndex((step) => Math.abs(step - target) < 1e-9);
  if (exact >= 0) return exact;
  // A rate off the steps (an old file): the nearest one.
  return steps.reduce((best, step, index) => (Math.abs(step - target) < Math.abs(steps[best] - target) ? index : best), 0);
}

/** A rate as the page writes it: tiny ones with two decimals, so 0.03 % never reads "0 %". */
function rateText(rate: number, { f }: I18n): string {
  return rate > 0 && rate < 0.01 ? f.percent(rate, { decimals: 2 }) : f.rate(rate);
}

/**
 * Under the slider: the most that lasted the years in this investment's
 * past (A4, lib/safe-rate.ts), from every start in its history, the worst
 * included, with the runs behind it, a rough guide first when they are few;
 * the same every year for savings; for growth of one's own, where the rate
 * starts and what a fall like the most similar asset's worst year would do
 * at the start. Every rate with what it pays; the past, never a promise.
 */
function DataRate({ calc, rate, chosen }: { calc: Calculation; rate: number; chosen: boolean }) {
  const i18n = useI18n();
  const { m, f, locale } = i18n;
  const t = m.safe;
  const { safe, result, investment } = calc;
  // What a rate pays a month on the same total as the slider's.
  const pays = (share: number) => f.smallCur(rate > 0 ? (result.income * share) / rate : 0);
  const name = (asset: keyof typeof m.assets.inSentence) => m.assets.inSentence[asset];
  const lines: string[] = [];
  if (safe.kind === "history") {
    const plan = investment.investment;
    const asset = plan.kind === "asset" ? name(plan.asset) : null;
    const shown = rateText(safe.rate, i18n);
    if (safe.few) lines.push(asset ? t.dataFew(asset, safe.periods, shown, pays(safe.rate)) : t.mixFew(safe.periods, shown, pays(safe.rate)));
    else lines.push(asset ? t.data(asset, safe.years, shown, pays(safe.rate)) : t.mix(safe.years, shown, pays(safe.rate)));
    lines.push(`${t.history(safe.from, safe.lastStart, safe.worstStart)} ${t.periods(safe.periods, safe.years)}`);
    if (safe.years < safe.askedYears) lines.push(t.shorter(safe.years, safe.askedYears));
    lines.push(t.past);
  } else if (safe.kind === "steady") {
    lines.push(t.steady(rateText(safe.rate, i18n), pays(safe.rate), safe.years));
  } else {
    lines.push(t.own);
    if (!chosen) {
      // Where the rate starts, and whose it is: few runs behind it come first.
      lines.push(
        safe.few
          ? t.dataFew(name(safe.start), assetSafeRate(safe.start).periods, rateText(safe.rate, i18n), pays(safe.rate))
          : t.ownStart(name(safe.start), rateText(safe.rate, i18n), pays(safe.rate)),
      );
    }
    const fall = earlyFall(safe, rate, investment.realReturn);
    const before = result.total;
    const outcome = fall.lastsAll
      ? t.lasts(rateText(rate, i18n), pays(rate), RETIREMENT_YEARS)
      : t.runsOut(rateText(rate, i18n), pays(rate), m.units.years(Math.max(1, fall.lasted)));
    lines.push(
      `${t.fall(name(safe.fall.asset), f.percent(safe.fall.change, { decimals: 0 }), safe.fall.year)} ${t.becomes(f.cur(before), f.cur(before * (1 + safe.fall.change)))} ${outcome}`,
    );
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
          <span>{t.yours(rateText(rate, i18n))}</span>
          <button type="button" onClick={() => updatePlan({ withdrawalRate: null })} className="inline-flex min-h-11 items-center font-medium text-accent underline-offset-2 hover:underline">
            {t.useData}
          </button>
        </p>
      )}
      {/* Why the rate does not follow the growth: only where there are falls. */}
      {safe.kind !== "steady" && <p className="text-muted">{WITHDRAWAL_WHY[locale]}</p>}
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
  const followsData = state.plan.withdrawalRate === null;
  const steps = sliderSteps(calc.safe.rate);
  const step = sliderIndex(steps, rate, followsData, calc.safe.rate);
  const steady = investment.volatility <= 0;
  const lasted = steady ? sameEveryYearText(rate, investment.realReturn, i18n) : m.result.lastedOf(Math.round(result.lasted * 100));
  const zone = withdrawalZone(result.lasted);
  const value = m.result.takenOutValue(rateText(rate, i18n), f.smallCur(result.income));
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
          updatePlan({ withdrawalRate: picked === calc.safe.rate ? null : picked });
        }}
        aria-valuetext={m.result.takenOutAria(rateText(rate, i18n), f.smallCur(result.income), lasted, m.result.zone[zone])}
        className="block h-11 w-full cursor-pointer accent-(--accent)"
      />
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
        <Zone zone={zone} />
        <span className="flex-1">
          <Changed value={lasted} />
        </span>
        {!steady && <Help what={m.result.takenOut} text={`${m.help.lasted} ${m.result.zoneHelp}`} align="end" />}
      </div>
      <DataRate calc={calc} rate={rate} chosen={!followsData} />
    </div>
  );
}
