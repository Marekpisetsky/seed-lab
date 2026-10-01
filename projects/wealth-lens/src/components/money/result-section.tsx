"use client";

import { useI18n } from "@/components/i18n";
import { Changed } from "@/components/ui/changed";
import { Help } from "@/components/ui/help";
import { RadioGroup } from "@/components/ui/radio-group";
import type { CalculationBundle } from "@/hooks/use-calculation";
import type { I18n } from "@/i18n";
import { simulationsText } from "@/i18n/investment-text";
import { concentrationEffect, type Concentration } from "@/lib/mix";
import { updatePlan } from "@/lib/app-store";
import type { Result } from "@/lib/calculator";
import { beforeInflationText, formatShare, gainedShareOf, growsText, moneyLine } from "@/lib/growth";
import { toNominal } from "@/lib/investment";
import type { WorstYear } from "@/lib/mix";
import { yearsLasting } from "@/lib/monte-carlo";
import type { MixFigures } from "@/lib/projections";
import { WhatIfIndicator, WhatIfRow } from "./what-if-row";

/**
 * For a mix: where 8 in 10 simulations ended and its worst year in the
 * data, so the effect of spreading the money shows; the S&P 500 alone is
 * beside them, small, over the same plan and years.
 */
function MixFiguresView({ figures, years }: { figures: MixFigures; years: number }) {
  const { m, f } = useI18n();
  const t = m.result.mix;
  const range = ([low, high]: [number, number]) => `${f.eur(low)} – ${f.eur(high)}`;
  const worst = (year: WorstYear | null) => (year ? `${f.percent(year.change, { decimals: 0 })} (${year.year})` : t.noData);
  const span = figures.worst ? `${figures.worst.from}–${figures.worst.to}` : "";
  return (
    <div className="space-y-3">
      <dl className="grid gap-3 rounded-lg border border-border bg-card p-3 tabular-nums sm:grid-cols-2">
        <div>
          <dt className="flex items-center gap-2 text-xs text-muted">
            {t.range(years)}
            <Help what={t.range(years)} text={m.help.range} />
          </dt>
          <dd className="text-base font-semibold">
            <Changed value={range(figures.range)} />
          </dd>
          <dd className="text-xs text-muted">
            <Changed value={t.alone(range(figures.reference.range))} />
          </dd>
        </div>
        <div>
          <dt className="flex items-center gap-2 text-xs text-muted">
            {span ? t.worstSpan(span) : t.worst}
            <Help what={t.worst} text={m.help.worst} />
          </dt>
          <dd className="text-base font-semibold">
            <Changed value={worst(figures.worst)} />
          </dd>
          <dd className="text-xs text-muted">
            <Changed value={t.aloneSameYears(worst(figures.reference.worst))} />
          </dd>
        </div>
      </dl>
      {figures.concentration && <ConcentrationView effect={figures.concentration} years={years} />}
    </div>
  );
}

/**
 * One stock over a fifth of a mix: what it does to the result, against the
 * same mix with its index in its place. Nothing is suggested.
 */
function ConcentrationView({ effect, years }: { effect: Concentration; years: number }) {
  const { m, f } = useI18n();
  const t = m.result.mix;
  const said = concentrationEffect(effect);
  return (
    <div className="space-y-2 rounded-lg border border-warning-border bg-warning-bg p-3 text-warning-foreground">
      <p className="text-sm font-medium">
        <Changed value={t.concentration(f.percent(effect.weight, { decimals: 0 }), t.middleEffect[said.middle], t.badEffect[said.bad])} />
      </p>
      <table className="w-full text-left text-xs tabular-nums">
        <thead>
          <tr>
            <th scope="col" className="pb-1 pr-2 font-normal">
              {t.afterYears(years)}
            </th>
            <th scope="col" className="pb-1 pr-2 text-right font-medium">
              {t.withStock(effect.stock.name)}
            </th>
            <th scope="col" className="pb-1 text-right font-medium">
              {t.withIndex(m.assets.inSentence[effect.index])}
            </th>
          </tr>
        </thead>
        <tbody className="text-sm">
          <tr className="border-t border-warning-border">
            <th scope="row" className="py-1 pr-2 text-xs font-normal">
              {t.badCases}
            </th>
            <td className="py-1 pr-2 text-right font-semibold">
              <Changed value={f.eur(effect.with.p10)} />
            </td>
            <td className="py-1 text-right">
              <Changed value={f.eur(effect.without.p10)} />
            </td>
          </tr>
          <tr className="border-t border-warning-border">
            <th scope="row" className="py-1 pr-2 text-xs font-normal">
              {t.middle}
            </th>
            <td className="py-1 pr-2 text-right font-semibold">
              <Changed value={f.eur(effect.with.p50)} />
            </td>
            <td className="py-1 text-right">
              <Changed value={f.eur(effect.without.p50)} />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

/** With no ups and downs the answer is certain: how long the withdrawals last at this growth. */
function sameEveryYearText(rate: number, realReturn: number, { m, f }: I18n): string {
  const years = yearsLasting(rate, realReturn);
  const pace = (realReturn < 0 ? m.result.shrinking : m.result.growing)(f.rate(Math.abs(realReturn)));
  if (!Number.isFinite(years)) return m.result.neverRunsOut(pace);
  return m.result.runsOut(pace, m.units.years(Math.floor(years)));
}

/** "+129%" over "7.5% a year": read in a second, quieter than the total. Nothing when nothing was put in. */
function GrowthBadge({ result }: { result: Result }) {
  const i18n = useI18n();
  const { m, f } = i18n;
  const share = gainedShareOf(result);
  if (share === null) return null;
  const tone = share >= 0 ? "bg-positive/10 text-positive" : "bg-negative/10 text-negative";
  return (
    <span className="inline-flex items-center gap-2">
      <span className={`inline-flex flex-col items-start rounded-lg px-2.5 py-1 leading-tight tabular-nums ${tone}`}>
        <span className="sr-only">{m.result.badge} </span>
        <span className="text-lg font-semibold">
          <Changed value={formatShare(share, i18n)} />
        </span>
        <span className="text-xs font-medium">
          <Changed value={m.result.perYear(f.rate(result.growthRate))} />
        </span>
      </span>
      <Help what={m.result.badge} text={m.help.badge} align="end" />
    </span>
  );
}

/**
 * The result, in places that never move: what the money is worth after the
 * chosen years and how much it grows, in plain words; what it could pay a
 * month (at a withdrawal rate the user picks, with how often it lasted in
 * history); and "What if…?", quick scenarios applied to the whole screen.
 */
export function ResultSection({ bundle }: { bundle: CalculationBundle }) {
  const i18n = useI18n();
  const { m, f } = i18n;
  const { calc, rates, state } = bundle;
  const { result, investment } = calc;
  const selected = rates.find((entry) => Math.abs(entry.rate - state.plan.withdrawalRate) < 1e-9) ?? rates[0];
  const years = m.units.years(result.years);
  const money = moneyLine(result, investment.volatility > 0, i18n);
  const grows = growsText(result.growthRate, i18n);
  return (
    <section aria-label={m.result.label} className="space-y-3">
      {/* What a screen reader says after a change: one short sentence, not the whole section. */}
      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {m.result.announce(years, f.eur(result.total), grows) + (calc.whatIf ? m.result.announceWhatIf(m.whatIf.applied[calc.whatIf]) : "")}
      </p>
      <div>
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
          <p className="text-base text-muted">
            <Changed value={m.result.inYears(years)} />
          </p>
          <WhatIfIndicator applied={calc.whatIf} />
        </div>
        {/* The total, and beside it (below it when there is no room) what growth added in all and a year. */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <p className="flex items-center gap-2 text-4xl font-bold tracking-tight tabular-nums sm:text-5xl">
            <Changed value={f.eur(result.total)} />
            <Help what={m.result.inYears(years)} text={m.help.total} />
          </p>
          <GrowthBadge result={result} />
        </div>
        <p className="mt-1 text-xl font-semibold tabular-nums sm:text-2xl">
          <Changed value={grows} />{" "}
          <span className="whitespace-nowrap text-sm font-normal text-muted">
            <Changed value={beforeInflationText(toNominal(result.growthRate, investment.inflation), i18n)} />
          </span>
        </p>
        {money && (
          <p className="mt-1 text-sm tabular-nums">
            <Changed value={money} />
            <span className="text-muted">
              {" · "}
              <Changed value={m.result.putIn(f.eur(result.putIn))} />
            </span>
          </p>
        )}
      </div>
      <div className="space-y-2">
        <p className="flex flex-wrap items-center gap-x-2 text-lg">
          <span>
            {m.result.couldPay}{" "}
            <strong className="font-semibold tabular-nums">
              <Changed value={m.result.perMonth(f.smallEur(result.income))} />
            </strong>
          </span>
          <Help what={m.result.couldPay} text={m.help.income} />
        </p>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-muted">
          <RadioGroup
            label={m.result.takenOut}
            options={rates.map(({ rate }) => ({ value: rate, label: f.rate(rate) }))}
            value={selected.rate}
            onChange={(withdrawalRate) => updatePlan({ withdrawalRate })}
            className="inline-flex rounded-md border border-border p-0.5"
            optionClassName={(checked) => `min-h-11 min-w-11 rounded px-2 py-1 font-medium tabular-nums ${checked ? "bg-foreground text-background" : "text-muted hover:text-foreground"}`}
          />
          <span className="flex-1">
            {m.result.takenOutText}{" "}
            {investment.volatility > 0 ? (
              <Changed value={m.result.lasted(f.percent(selected.lasted, { decimals: 0 }), simulationsText(investment, i18n))} />
            ) : (
              <Changed value={sameEveryYearText(selected.rate, investment.realReturn, i18n)} />
            )}
          </span>
          {investment.volatility > 0 && <Help what={m.result.takenOut} text={m.help.lasted} align="end" />}
        </div>
      </div>
      <WhatIfRow effects={bundle.whatIfs} applied={calc.whatIf} />
      {bundle.mix && <MixFiguresView figures={bundle.mix} years={result.years} />}
    </section>
  );
}
