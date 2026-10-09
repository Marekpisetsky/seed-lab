"use client";

import { TrendIcon } from "@seed-kit/react/trend.tsx";
import { useMemo, useRef, useState } from "react";
import { SeeMore } from "@/components/money/result-section";
import { useI18n } from "@/components/i18n";
import { Help } from "@/components/ui/help";
import { IntentLink } from "@/components/ui/intent-link";
import { Marked } from "@/components/ui/marked";
import { useCalculation } from "@/hooks/use-calculation";
import { investmentName } from "@/i18n/investment-text";
import { localePath } from "@/i18n/locales";
import type { Scenario } from "@/lib/calculator";
import {
  averageResult,
  cardYears,
  CRISES,
  crisisResult,
  crisisResults,
  everyStartYear,
  fallAmount,
  historyPath,
  historySource,
  isSp500Alone,
  SP500_ALONE,
  type Amounts,
  type CrisisId,
  type CrisisResult,
  type HistorySource,
} from "@/lib/history-test";
import { sparklinePoints } from "@/lib/sparkline";
import { PathChart, StartYearsChart } from "./history-charts";

/** A crisis card's one figure, in the user's euros: "−€407 and 3 years to get it back". */
function cardFigure(result: CrisisResult, { m, f }: ReturnType<typeof useI18n>): string {
  const t = m.test.card;
  if (!result.fall) return t.noFall;
  const amount = f.cur(-fallAmount(result), { signed: true });
  return result.yearsToRecover !== null ? t.fall(amount, f.span(result.yearsToRecover * 12)) : t.notBack(amount, result.lastYear);
}

/**
 * The card's small line: what €1 did from the year before the crisis until
 * it was back at its top, with nothing added (the money added each year
 * would hide the fall). Decorative: the figure says it.
 */
function MiniPath({ path, falling, active }: { path: readonly number[]; falling: boolean; active: boolean }) {
  return (
    <svg viewBox="-1 -1 102 42" preserveAspectRatio="none" aria-hidden="true" className={`h-12 w-full ${active ? "" : falling ? "text-negative" : "text-positive"}`}>
      <polyline points={sparklinePoints(path, 100, 40)} fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

/**
 * The chosen crisis: what happened in the world, in one sentence; the
 * plan through it, big; how long it took to get back, in the user's euros.
 * The rest (the fall in detail, the end of the plan, the average, a mix
 * against the S&P 500) waits behind "See more".
 */
export function CrisisPanel({
  result,
  source,
  amounts,
  scenario,
  planYears,
  name,
}: {
  result: CrisisResult;
  source: HistorySource;
  amounts: Amounts;
  scenario: Scenario;
  planYears: number;
  /** The investment's name, for the chart's description. */
  name: string;
}) {
  const i18n = useI18n();
  const { m, f } = i18n;
  const t = m.test;
  const pct = (drop: number) => f.percent(drop, { decimals: 0 });
  const { fall } = result;
  const alone = isSp500Alone(source) ? null : crisisResult(SP500_ALONE, amounts, planYears, result.id);
  const shown = result.path.slice(0, result.years + 1);
  const average = shown.map((_, index) => averageResult(scenario, index));
  const lastShown = result.startYear + result.years - 1;
  // Both falls on the same money: what the plan had at its top (or, with no fall of its own, what the S&P 500 had at its).
  const top = fall?.from ?? alone?.fall?.from ?? 0;
  const lost = (drop: number) => f.cur(-drop * top, { signed: true });
  return (
    <section aria-labelledby="crisis-title" className="space-y-3 rounded-xl border border-border bg-card p-4 sm:p-6">
      <h2 id="crisis-title" className="text-xl font-bold">
        {t.crises[result.id]} ({result.year})
      </h2>
      <p className="text-base">{t.happened[result.id]}</p>
      <p aria-live="polite" className="flex flex-wrap items-center gap-x-2 text-lg font-semibold tabular-nums">
        <span>
          <TrendIcon change={fall ? -1 : null} />
          {cardFigure(result, i18n)}
        </span>
        {fall && <Help what={t.crash} text={m.help.fall} />}
      </p>
      <PathChart
        path={shown}
        average={average}
        startYear={result.startYear}
        fall={fall}
        label={t.pathAria(name, result.startYear, lastShown, f.cur(result.final))}
      />
      <SeeMore what={t.detailsTitle}>
        <div className="space-y-1.5 text-base">
          <p>
            {t.started(result.startYear)}{" "}
            {fall ? <Marked text={t.dropped(f.cur(fall.from), f.cur(fall.to), pct(fall.drop))} strongClassName="font-semibold tabular-nums" /> : t.noDrop}
          </p>
          {!fall && <p>{t.withinYear}</p>}
          {fall && <p>{result.yearsToRecover !== null ? t.tookYears(f.span(result.yearsToRecover * 12)) : t.notBack(result.lastYear)}</p>}
          <p>
            <Marked
              text={result.years === planYears ? t.after(result.years, f.cur(result.final)) : t.dataEnds(result.years, lastShown, f.cur(result.final))}
              strongClassName="font-semibold tabular-nums"
            />
          </p>
          <p className="text-sm text-muted">{t.average(f.cur(averageResult(scenario, result.years)))}</p>
          {alone && (
            <div className="space-y-1 rounded-lg bg-background p-3 text-sm">
              {(fall || alone.fall) && (
                <p>
                  {fall
                    ? t.mixFell(pct(fall.drop), lost(fall.drop), pct(alone.fall?.drop ?? 0), lost(alone.fall?.drop ?? 0))
                    : t.mixNoFall(pct(alone.fall?.drop ?? 0), lost(alone.fall?.drop ?? 0))}
                </p>
              )}
              {alone.years === result.years && <p>{t.mixAfter(result.years, f.cur(result.final), f.cur(alone.final))}</p>}
            </div>
          )}
        </div>
      </SeeMore>
    </section>
  );
}

/** "Every start year": the plan's years from each year of the data, the worst, middle and best marked. */
function StartYearsSection({ source, amounts, scenario, planYears }: { source: HistorySource; amounts: Amounts; scenario: Scenario; planYears: number }) {
  const { m, f } = useI18n();
  const t = m.test.every;
  const every = useMemo(() => everyStartYear(source, amounts, planYears), [source, amounts, planYears]);
  const alone = useMemo(
    () => (every && !isSp500Alone(source) ? everyStartYear(SP500_ALONE, amounts, every.window, every.starts.map((start) => start.year)) : null),
    [every, source, amounts],
  );
  if (!every) return null;
  const first = every.starts[0].year;
  const last = every.starts[every.starts.length - 1].year;
  return (
    <section aria-labelledby="every-title" className="space-y-3">
      <h2 id="every-title" className="flex items-center gap-2 text-lg font-bold">
        {t.title}
        <Help what={t.title} text={m.help.every} />
      </h2>
      <p className="text-sm">{t.text(every.window, first, last)}</p>
      {every.window < planYears && <p className="text-sm text-muted">{t.shorter(planYears, every.window)}</p>}
      <StartYearsChart
        every={every}
        average={averageResult(scenario, every.window)}
        label={t.aria(every.starts.length, t.mark(every.worst.year, f.cur(every.worst.final)), t.mark(every.best.year, f.cur(every.best.final)))}
      />
      {alone && (
        <p className="rounded-lg bg-background p-3 text-sm">
          {t.vsSp500(t.amountIn(every.worst.year, f.cur(every.worst.final)), t.amountIn(alone.worst.year, f.cur(alone.worst.final)))}
        </p>
      )}
    </section>
  );
}

/**
 * "Test my plan", built like My money: the plan as it is there, run
 * through the real crises of the data, each a big card with its year, a
 * small line and one figure in the user's euros ("−€407 and 3 years to get
 * it back"); tapped, its detail. Then every start year. Real history, not
 * a forecast; no simulation.
 */
export function TestModule() {
  const i18n = useI18n();
  const { locale, m, f } = i18n;
  const t = m.test;
  const { base, ready } = useCalculation();
  const { scenario } = base;
  const planYears = base.result.years;
  const source = useMemo(() => historySource(base.investment), [base.investment]);
  const amounts = useMemo(() => ({ start: scenario.capital, monthly: scenario.monthly }), [scenario.capital, scenario.monthly]);
  const results = useMemo(() => crisisResults(source, amounts, planYears), [source, amounts, planYears]);
  const [selected, setSelected] = useState<CrisisId | null>(null);
  const panel = useRef<HTMLDivElement>(null);
  const result = selected ? results[selected] : null;

  const choose = (id: CrisisId) => {
    setSelected(id === selected ? null : id);
    if (id !== selected) {
      // Once drawn, bring the answer into view: on a phone it is below the cards.
      requestAnimationFrame(() => panel.current?.scrollIntoView({ block: "nearest", behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" }));
    }
  };

  if (!ready) {
    return (
      <div className="space-y-1">
        <p className="text-base">{t.notReady}</p>
        <IntentLink href={localePath("/", locale)} className="-ml-1 inline-flex min-h-11 items-center px-1 text-sm font-medium text-accent underline-offset-2 hover:underline">
          {t.goWrite}
        </IntentLink>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <p className="text-sm">{t.plan(f.cur(scenario.capital), f.cur(scenario.monthly), investmentName(base.investment, i18n), planYears)}</p>
        {base.investment.investment.kind === "custom" && source && <p className="text-sm text-muted">{t.customHistory}</p>}
        <IntentLink href={localePath("/", locale)} className="-ml-1 inline-flex min-h-11 items-center px-1 text-sm font-medium text-accent underline-offset-2 hover:underline">
          {t.change}
        </IntentLink>
      </div>

      {!source && (
        <p className="rounded-lg border border-warning-border bg-warning-bg p-3 text-sm text-warning-foreground">
          {t.noHistory} {t.noHistoryHint}
        </p>
      )}

      <section aria-labelledby="crises-title" className="space-y-2">
        <h2 id="crises-title" className="text-lg font-bold">
          {t.cardsTitle}
        </h2>
        {source && <p className="text-sm text-muted">{t.tapHint}</p>}
        {/* Big cards: one across on a phone, two on a tablet, three on a computer. Each with its year, its small line and one figure in euros. */}
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {CRISES.map((crisis) => {
            const result = results[crisis.id];
            const active = selected === crisis.id;
            return (
              <li key={crisis.id}>
                <button
                  type="button"
                  aria-pressed={active}
                  disabled={!result}
                  onClick={() => choose(crisis.id)}
                  className={`flex w-full flex-col gap-2 rounded-xl border p-4 text-left transition-colors ${result ? "min-h-36" : ""} ${
                    active
                      ? "border-foreground bg-foreground text-background"
                      : result
                        ? "border-border bg-card hover:border-accent"
                        : "cursor-not-allowed border-dashed border-border bg-background text-muted"
                  }`}
                >
                  <span className="flex w-full items-baseline justify-between gap-2">
                    <span className="text-lg font-semibold leading-tight">{t.crises[crisis.id]}</span>
                    <span className={`text-base tabular-nums ${active ? "" : "text-muted"}`}>{crisis.year}</span>
                  </span>
                  {result ? (
                    <>
                      <MiniPath path={source ? historyPath(source, { start: 1, monthly: 0 }, result.startYear, cardYears(result)) : []} falling={result.fall !== null} active={active} />
                      <span className="text-base font-semibold tabular-nums">
                        <TrendIcon change={result.fall ? -1 : null} />
                        {cardFigure(result, i18n)}
                      </span>
                    </>
                  ) : (
                    <span className="text-sm">{t.noData}</span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <div ref={panel} className="scroll-mt-4">
        {result && source && <CrisisPanel result={result} source={source} amounts={amounts} scenario={scenario} planYears={planYears} name={investmentName(base.investment, i18n)} />}
      </div>

      {source && <StartYearsSection source={source} amounts={amounts} scenario={scenario} planYears={planYears} />}

      <p className="text-sm text-muted">{t.yearEnds}</p>
    </div>
  );
}
