"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef } from "react";
import { useI18n } from "@/components/i18n";
import { Changed } from "@/components/ui/changed";
import { Help } from "@/components/ui/help";
import type { CalculationBundle } from "@/hooks/use-calculation";
import type { I18n } from "@/i18n";
import { investedInText } from "@/i18n/investment-text";
import { valueAt } from "@/lib/calculator";
import { growsText } from "@/lib/growth";
import type { ResolvedInvestment } from "@/lib/investment";
import { CONCENTRATION_LIMIT } from "@/lib/mix";
import { GrowthChart } from "./growth-chart";
import { KeyFacts } from "./key-facts";
import { ResultCard } from "./result-card";
import { WhatIfIndicator, WhatIfRow } from "./what-if-row";

function Loading() {
  const { m } = useI18n();
  return <p className="text-sm text-muted">{m.cards.loading}</p>;
}

// Each card's details are their own code, loaded when the card is opened.
const WhereDetails = dynamic(() => import("./where-details").then((module) => module.WhereDetails), { loading: Loading });
const GoalsSection = dynamic(() => import("./goals-section").then((module) => module.GoalsSection), { loading: Loading });
const KnowDetails = dynamic(() => import("./know-details").then((module) => module.KnowDetails), { loading: Loading });

/** What the user said, in one sentence: "With €1,100 today and €100 a month in the S&P 500, in 20 years you could have…" */
function summaryText({ scenario, investment, result }: CalculationBundle["calc"], i18n: I18n): string {
  const { m, f } = i18n;
  const t = m.result;
  const where = investedInText(investment, i18n);
  const years = m.units.years(result.years);
  const have = f.eur(scenario.capital);
  const monthly = f.eur(scenario.monthly);
  if (scenario.monthly === 0 && scenario.capital > 0) return t.summaryToday(have, where, years);
  if (scenario.capital === 0 && scenario.monthly > 0) return t.summaryMonthly(monthly, where, years);
  return t.summary(have, monthly, where, years);
}

/** Level 1: what the user said, then what the money is worth after the years, big. */
function ResultTotal({ bundle, ref }: { bundle: CalculationBundle; ref: React.Ref<HTMLElement> }) {
  const i18n = useI18n();
  const { m, f } = i18n;
  const { calc } = bundle;
  const { result } = calc;
  const years = m.units.years(result.years);
  const grows = growsText(result.growthRate, i18n);
  return (
    // Focused (not tabbable) when the result arrives, so a screen reader starts here.
    <section ref={ref} tabIndex={-1} aria-label={m.result.label} className="scroll-mt-4 space-y-1 outline-none">
      {/* What a screen reader says after a change: one short sentence, not the whole section. */}
      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {m.result.announce(years, f.eur(result.total), grows) + (calc.whatIf ? m.result.announceWhatIf(m.whatIf.applied[calc.whatIf]) : "")}
      </p>
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <p className="text-base text-muted sm:text-lg">
          <Changed value={summaryText(calc, i18n)} />
        </p>
        <WhatIfIndicator applied={calc.whatIf} />
      </div>
      <p className="flex items-center gap-2 text-4xl font-extrabold tracking-tight tabular-nums sm:text-5xl">
        <Changed value={f.eur(result.total)} />
        <Help what={m.result.inYears(years)} text={m.help.total} />
      </p>
    </section>
  );
}

/** The share of a mix in its biggest stock when it is over the concentration line; `null` otherwise. */
function concentratedShare(investment: ResolvedInvestment): number | null {
  const { model } = investment;
  if (investment.investment.kind !== "mix" || investment.simulation !== "joint" || !model) return null;
  const biggest = Math.max(0, ...model.parts.filter((part) => part.kind === "stock").map((part) => part.weight));
  return biggest > CONCENTRATION_LIMIT ? biggest : null;
}

/**
 * The result in levels: the total and its growth (always), a small chart
 * (always), then folded cards of one line each, every one with what it
 * says in a sentence: what it could pay, "What if…?", where it reaches, my
 * goals and what you should know. Nothing else shows until asked for.
 */
export function Results({ bundle, arrive = false, onArrived }: { bundle: CalculationBundle; arrive?: boolean; onArrived?: () => void }) {
  const i18n = useI18n();
  const top = useRef<HTMLElement>(null);
  // Asked for with "See my result": the page glides to it (or jumps, for those who asked for less motion).
  useEffect(() => {
    const element = top.current;
    if (!arrive || !element) return;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    element.focus({ preventScroll: true });
    element.scrollIntoView({ behavior: still ? "auto" : "smooth", block: "start" });
    onArrived?.();
  }, [arrive, onArrived]);
  const { m, f } = i18n;
  const { calc, base, today } = bundle;
  const t = m.cards;
  // The card's sentence: what +€50 a month would add (the same figure its chip shows).
  const fifty = valueAt({ ...base.scenario, monthly: base.scenario.monthly + 50 }, base.result.years * 12) - base.result.total;
  const covered = calc.countries.filter((row) => row.withoutHousing.covered).length;
  const first = calc.goals[0];
  const share = concentratedShare(calc.investment);

  return (
    <div className="space-y-6 motion-safe:animate-reveal">
      <div className="space-y-4">
        <ResultTotal bundle={bundle} ref={top} />
        <KeyFacts bundle={bundle} />
      </div>
      <GrowthChart bundle={bundle} />
      <div className="space-y-2">
        <ResultCard
          title={m.whatIf.title}
          summary={calc.whatIf ? t.applied(m.whatIf.applied[calc.whatIf]) : t.whatIf(m.whatIf.chips["monthly-50"], f.eurRounded(fifty, { signed: true }))}
        >
          <WhatIfRow bundle={bundle} />
        </ResultCard>
        <ResultCard title={t.where} summary={t.whereSummary(covered, calc.countries.length)}>
          <WhereDetails bundle={bundle} />
        </ResultCard>
        <ResultCard
          title={m.goals.title}
          summary={first ? t.goalsSome(calc.goals.length, first.known ? f.when(first.months, today) : m.goals.unknown) : t.goalsNone}
        >
          <GoalsSection calc={calc} today={today} inCard />
        </ResultCard>
        <ResultCard title={m.findings.title} summary={share === null ? t.knowSummary : t.concentration(f.percent(share, { decimals: 0 }))} tone={share === null ? "plain" : "warning"}>
          <KnowDetails bundle={bundle} />
        </ResultCard>
      </div>
    </div>
  );
}
