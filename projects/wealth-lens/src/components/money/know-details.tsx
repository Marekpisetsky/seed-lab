"use client";

import { useI18n } from "@/components/i18n";
import { Changed } from "@/components/ui/changed";
import { Help } from "@/components/ui/help";
import { mixFiguresFor } from "@/hooks/calculation-details";
import type { CalculationBundle } from "@/hooks/use-calculation";
import { assumptionsLine } from "@/lib/assumptions";
import { firstYearGrowth } from "@/lib/findings";
import { concentrationEffect, type Concentration, type WorstYear } from "@/lib/mix";
import { bandsFor, type MixFigures } from "@/lib/projections";
import { Findings } from "./findings-section";

/** What a percent is measured on: the money the user has now, or, with none yet, what it comes to at the end. */
interface Base {
  amount: number;
  atEnd: boolean;
}

function baseOf(bundle: CalculationBundle): Base {
  const { capital } = bundle.calc.scenario;
  return capital > 0 ? { amount: capital, atEnd: false } : { amount: bundle.calc.result.total, atEnd: true };
}

/**
 * For a mix: where 8 in 10 possible futures end and its worst year in the
 * data, with what that year would do to the user's money ("−37% (2008) =
 * −€407 of your €1,100"), so the effect of spreading the money shows; the
 * S&P 500 alone is beside them, small, over the same plan and years.
 */
function MixFiguresView({ figures, years, base }: { figures: MixFigures; years: number; base: Base }) {
  const { m, f } = useI18n();
  const t = m.result.mix;
  const range = ([low, high]: [number, number]) => `${f.eur(low)} – ${f.eur(high)}`;
  const worst = (year: WorstYear | null) =>
    year
      ? (base.atEnd ? t.worstOnEnd : t.worstOnYours)(f.percent(year.change, { decimals: 0 }), year.year, f.eur(year.change * base.amount, { signed: true }), f.eur(base.amount))
      : t.noData;
  const span = figures.worst ? `${figures.worst.from}–${figures.worst.to}` : "";
  return (
    <div className="space-y-3">
      <dl className="grid gap-3 rounded-lg border border-border bg-card p-3 tabular-nums sm:grid-cols-2">
        <div>
          <dt className="flex items-center gap-2 text-sm text-muted">
            {t.range(years)}
            <Help what={t.range(years)} text={m.help.range} />
          </dt>
          <dd className="text-base font-semibold">
            <Changed value={range(figures.range)} />
          </dd>
          <dd className="text-sm text-muted">
            <Changed value={t.alone(range(figures.reference.range))} />
          </dd>
        </div>
        <div>
          <dt className="flex items-center gap-2 text-sm text-muted">
            {span ? t.worstSpan(span) : t.worst}
            <Help what={t.worst} text={m.help.worst} />
          </dt>
          <dd className="text-base font-semibold">
            <Changed value={worst(figures.worst)} />
          </dd>
          <dd className="text-sm text-muted">
            <Changed value={t.aloneSameYears(worst(figures.reference.worst))} />
          </dd>
        </div>
      </dl>
      {figures.concentration && <ConcentrationView effect={figures.concentration} years={years} base={base} />}
    </div>
  );
}

/**
 * One stock over a fifth of a mix: what it does to the result, against the
 * same mix with its index in its place. Nothing is suggested.
 */
function ConcentrationView({ effect, years, base }: { effect: Concentration; years: number; base: Base }) {
  const { m, f } = useI18n();
  const t = m.result.mix;
  const said = concentrationEffect(effect);
  return (
    <div className="space-y-2 rounded-lg border border-warning-border bg-warning-bg p-3 text-warning-foreground">
      <p className="text-sm font-medium">
        <Changed value={t.concentration(f.percent(effect.weight, { decimals: 0 }), f.eur(effect.weight * base.amount), t.middleEffect[said.middle], t.badEffect[said.bad])} />
      </p>
      <table className="w-full text-left text-sm tabular-nums">
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
            <th scope="row" className="py-1 pr-2 text-sm font-normal">
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
            <th scope="row" className="py-1 pr-2 text-sm font-normal">
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

/** Where 8 in 10 possible futures end after the years, for anything with ups and downs that is not a mix. */
function RangeView({ bundle }: { bundle: CalculationBundle }) {
  const { m, f } = useI18n();
  const { calc } = bundle;
  const years = calc.result.years;
  if (calc.investment.volatility <= 0) return null;
  const bands = bandsFor(calc.investment, { start: calc.scenario.capital, monthly: calc.scenario.monthly, years });
  return (
    <div className="rounded-lg border border-border bg-card p-3 tabular-nums">
      <p className="flex items-center gap-2 text-sm text-muted">
        {m.result.mix.range(years)}
        <Help what={m.result.mix.range(years)} text={m.help.range} />
      </p>
      <p className="text-base font-semibold">
        <Changed value={`${f.eur(bands.p10[years])} – ${f.eur(bands.p90[years])}`} />
      </p>
    </div>
  );
}

/**
 * "Good to know", in its card: for a mix or the portfolio its
 * range, worst year and what one stock does to it; for anything else with
 * ups and downs, where 8 in 10 possible futures end; then two or three
 * findings about the plan. All worked out when the card is opened.
 */
export function KnowDetails({ bundle }: { bundle: CalculationBundle }) {
  const i18n = useI18n();
  const figures = mixFiguresFor(bundle);
  return (
    <div className="space-y-4">
      {/* What the result assumes, in one line: how it grows, how much it moves, where the figures come from. */}
      <p className="text-sm text-muted tabular-nums">
        <Changed value={assumptionsLine(bundle.calc.investment, i18n, { firstYear: firstYearGrowth(bundle.calc.scenario), base: baseOf(bundle).amount })} />
      </p>
      {figures ? <MixFiguresView figures={figures} years={bundle.calc.result.years} base={baseOf(bundle)} /> : <RangeView bundle={bundle} />}
      <Findings bundle={bundle} />
    </div>
  );
}
