"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { useI18n } from "@/components/i18n";
import { Help } from "@/components/ui/help";
import { Marked } from "@/components/ui/marked";
import { useCalculation } from "@/hooks/use-calculation";
import { investmentName } from "@/i18n/investment-text";
import { localePath } from "@/i18n/locales";
import type { Scenario } from "@/lib/calculator";
import {
  averageResult,
  CRISES,
  crisisResult,
  crisisResults,
  everyStartYear,
  historySource,
  isSp500Alone,
  SP500_ALONE,
  type Amounts,
  type CrisisId,
  type CrisisResult,
  type HistorySource,
} from "@/lib/history-test";
import { PathChart, StartYearsChart } from "./history-charts";

/** The chosen crash: what the plan would have done through it, in words and in a chart. */
function CrisisPanel({
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
  const { m, f } = useI18n();
  const t = m.test;
  const pct = (drop: number) => f.percent(drop, { decimals: 0 });
  const { fall } = result;
  const alone = isSp500Alone(source) ? null : crisisResult(SP500_ALONE, amounts, planYears, result.id);
  const shown = result.path.slice(0, result.years + 1);
  const average = shown.map((_, index) => averageResult(scenario, index));
  const lastShown = result.startYear + result.years - 1;
  return (
    <section aria-labelledby="crisis-title" className="space-y-3 rounded-xl border border-border bg-card p-4">
      <h2 id="crisis-title" className="text-lg font-semibold">
        {t.crises[result.id]} ({result.year})
      </h2>
      <div aria-live="polite" className="space-y-1.5 text-base">
        <p>
          {t.started(result.startYear)}{" "}
          {fall ? <Marked text={t.dropped(f.eur(fall.from), f.eur(fall.to), pct(fall.drop))} strongClassName="font-semibold tabular-nums" /> : t.noDrop}
          {fall && <Help what={t.crash} text={m.help.fall} />}
        </p>
        {!fall && <p>{t.withinYear}</p>}
        {fall && <p>{result.yearsToRecover !== null ? t.tookYears(f.span(result.yearsToRecover * 12)) : t.notBack(result.lastYear)}</p>}
        <p>
          <Marked
            text={result.years === planYears ? t.after(result.years, f.eur(result.final)) : t.dataEnds(result.years, lastShown, f.eur(result.final))}
            strongClassName="font-semibold tabular-nums"
          />
        </p>
      </div>
      <p className="text-sm text-muted">{t.average(f.eur(averageResult(scenario, result.years)))}</p>
      {alone && (
        <div className="space-y-1 rounded-lg bg-background p-3 text-sm">
          {(fall || alone.fall) && <p>{fall ? t.mixFell(pct(fall.drop), pct(alone.fall?.drop ?? 0)) : t.mixNoFall(pct(alone.fall?.drop ?? 0))}</p>}
          {alone.years === result.years && <p>{t.mixAfter(result.years, f.eur(result.final), f.eur(alone.final))}</p>}
        </div>
      )}
      <PathChart
        path={shown}
        average={average}
        startYear={result.startYear}
        fall={fall}
        label={t.pathAria(name, result.startYear, lastShown, f.eur(result.final))}
      />
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
      <h2 id="every-title" className="flex items-center gap-2 text-lg font-semibold">
        {t.title}
        <Help what={t.title} text={m.help.every} />
      </h2>
      <p className="text-sm">{t.text(every.window, first, last)}</p>
      {every.window < planYears && <p className="text-sm text-muted">{t.shorter(planYears, every.window)}</p>}
      <StartYearsChart
        every={every}
        average={averageResult(scenario, every.window)}
        label={t.aria(every.starts.length, t.mark(every.worst.year, f.eur(every.worst.final)), t.mark(every.best.year, f.eur(every.best.final)))}
      />
      {alone && (
        <p className="rounded-lg bg-background p-3 text-sm">
          {t.vsSp500(t.amountIn(every.worst.year, f.eur(every.worst.final)), t.amountIn(alone.worst.year, f.eur(alone.worst.final)))}
        </p>
      )}
    </section>
  );
}

/**
 * "Test my plan": the plan as it is in My money run through the real
 * crashes of the data, then from every start year. Real history, not a
 * forecast; no simulation.
 */
export function TestModule() {
  const i18n = useI18n();
  const { locale, m, f } = i18n;
  const t = m.test;
  const { base } = useCalculation();
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

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <p className="text-sm">{t.plan(f.eur(scenario.capital), f.eur(scenario.monthly), investmentName(base.investment, i18n), planYears)}</p>
        <Link href={localePath("/", locale)} className="-ml-1 inline-flex min-h-11 items-center px-1 text-sm font-medium text-accent underline-offset-2 hover:underline">
          {t.change}
        </Link>
        <p className="text-sm font-medium">{t.realHistory}</p>
      </div>

      {!source && (
        <p className="rounded-lg border border-warning-border bg-warning-bg p-3 text-sm text-warning-foreground">
          {t.noHistory} {t.noHistoryHint}
        </p>
      )}

      <section aria-labelledby="crises-title" className="space-y-2">
        <h2 id="crises-title" className="text-lg font-semibold">
          {t.cardsTitle}
        </h2>
        {source && <p className="text-sm text-muted">{t.tapHint}</p>}
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {CRISES.map((crisis) => {
            const available = results[crisis.id] !== null;
            const active = selected === crisis.id;
            return (
              <li key={crisis.id}>
                <button
                  type="button"
                  aria-pressed={active}
                  disabled={!available}
                  onClick={() => choose(crisis.id)}
                  className={`flex min-h-24 w-full flex-col items-start justify-center rounded-xl border p-3 text-left transition-colors ${
                    active
                      ? "border-foreground bg-foreground text-background"
                      : available
                        ? "border-border bg-card hover:border-accent"
                        : "cursor-not-allowed border-dashed border-border bg-background text-muted"
                  }`}
                >
                  <span className="text-base font-semibold leading-tight">{t.crises[crisis.id]}</span>
                  <span className={`text-sm tabular-nums ${active ? "" : "text-muted"}`}>{crisis.year}</span>
                  {!available && <span className="mt-1 text-xs">{t.noData}</span>}
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

      <p className="text-xs text-muted">
        {t.yearEnds} {t.realHistory}
      </p>
    </div>
  );
}
