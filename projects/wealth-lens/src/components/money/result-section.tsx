"use client";

import { Changed } from "@/components/ui/changed";
import type { CalculationBundle } from "@/hooks/use-calculation";
import { updatePlan } from "@/lib/app-store";
import { formatSmallEur } from "@/lib/calculator";
import { yearsLasting } from "@/lib/monte-carlo";
import { formatEur, formatPercent, formatRate } from "@/lib/format";
import { beforeInflationText, growsText, moneyLine } from "@/lib/growth";
import { toNominal } from "@/lib/investment";
import type { MixFigures } from "@/lib/projections";
import type { WorstYear } from "@/lib/mix";
import { WhatIfIndicator, WhatIfRow } from "./what-if-row";

const range = ([low, high]: [number, number]) => `${formatEur(low)} – ${formatEur(high)}`;
const worst = (year: WorstYear | null) => (year ? `${formatPercent(year.change, { decimals: 0 })} (${year.year})` : "no shared data");

/**
 * For a mix: where 8 in 10 simulations ended and its worst year in the
 * data, so the effect of spreading the money shows; the S&P 500 alone is
 * beside them, small, over the same plan and years.
 */
function MixFiguresView({ figures, years }: { figures: MixFigures; years: number }) {
  const span = figures.worst ? `${figures.worst.from}–${figures.worst.to}` : "";
  return (
    <dl className="grid gap-3 rounded-lg border border-border bg-card p-3 tabular-nums sm:grid-cols-2">
      <div>
        <dt className="text-xs text-muted">Range (8 in 10) after {years} years</dt>
        <dd className="text-base font-semibold">
          <Changed value={range(figures.range)} />
        </dd>
        <dd className="text-xs text-muted">
          S&amp;P 500 alone: <Changed value={range(figures.reference.range)} />
        </dd>
      </div>
      <div>
        <dt className="text-xs text-muted">Worst year in the data{span && ` (${span}, after inflation)`}</dt>
        <dd className="text-base font-semibold">
          <Changed value={worst(figures.worst)} />
        </dd>
        <dd className="text-xs text-muted">
          S&amp;P 500 alone, same years: <Changed value={worst(figures.reference.worst)} />
        </dd>
      </div>
    </dl>
  );
}

/** With no swings the answer is certain: how long the withdrawals last at this growth. */
function noSwingsText(rate: number, realReturn: number): string {
  const years = yearsLasting(rate, realReturn);
  if (!Number.isFinite(years)) return `with no swings and ${formatRate(realReturn)} a year after inflation, it never runs out`;
  const whole = Math.floor(years);
  return `with no swings and ${formatRate(realReturn)} a year after inflation, it runs out after ${whole} year${whole === 1 ? "" : "s"}`;
}

/**
 * The result, in places that never move: what the money is worth after the
 * chosen years and how much it grows, in plain words; what it could pay a
 * month (at a withdrawal rate the user picks, with how often it lasted in
 * history); and "What if…?", quick scenarios applied to the whole screen.
 */
export function ResultSection({ bundle }: { bundle: CalculationBundle }) {
  const { calc, rates, state } = bundle;
  const { result, investment } = calc;
  const selected = rates.find((entry) => Math.abs(entry.rate - state.plan.withdrawalRate) < 1e-9) ?? rates[0];
  const years = `${result.years} year${result.years === 1 ? "" : "s"}`;
  const money = moneyLine(result, investment.volatility > 0);
  return (
    <section aria-label="Result" className="space-y-3" aria-live="polite">
      <div>
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
          <p className="text-base text-muted">
            In <Changed value={years} /> you&apos;ll have
          </p>
          <WhatIfIndicator applied={calc.whatIf} />
        </div>
        <p className="text-4xl font-bold tracking-tight tabular-nums sm:text-5xl">
          <Changed value={formatEur(result.total)} />
        </p>
        <p className="mt-1 text-xl font-semibold tabular-nums sm:text-2xl">
          <Changed value={growsText(investment.realReturn)} />{" "}
          <span className="text-sm font-normal text-muted">
            <Changed value={beforeInflationText(toNominal(investment.realReturn, investment.inflation))} />
          </span>
        </p>
        {money && (
          <p className="mt-1 text-sm tabular-nums">
            <Changed value={money} />
            <span className="text-muted">
              {" "}
              · put in <Changed value={formatEur(result.putIn)} />
            </span>
          </p>
        )}
      </div>
      <div className="space-y-2">
        <p className="text-lg">
          It could pay you{" "}
          <strong className="font-semibold tabular-nums">
            <Changed value={`${formatSmallEur(result.income)}/month`} />
          </strong>
        </p>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-muted">
          <div role="radiogroup" aria-label="Taken out each year" className="inline-flex rounded-md border border-border p-0.5">
            {rates.map(({ rate }) => {
              const checked = rate === selected.rate;
              return (
                <button
                  key={rate}
                  type="button"
                  role="radio"
                  aria-checked={checked}
                  onClick={() => updatePlan({ withdrawalRate: rate })}
                  className={`rounded px-2 py-1 font-medium tabular-nums ${checked ? "bg-foreground text-background" : "text-muted hover:text-foreground"}`}
                >
                  {formatRate(rate)}
                </button>
              );
            })}
          </div>
          <span>
            taken out a year:{" "}
            {investment.volatility > 0 ? (
              <>
                lasted 30 years in <Changed value={formatPercent(selected.lasted, { decimals: 0 })} /> of <Changed value={investment.modelText} />
              </>
            ) : (
              <Changed value={noSwingsText(selected.rate, investment.realReturn)} />
            )}
          </span>
        </div>
      </div>
      <WhatIfRow effects={bundle.whatIfs} applied={calc.whatIf} />
      {bundle.mix && <MixFiguresView figures={bundle.mix} years={result.years} />}
    </section>
  );
}
