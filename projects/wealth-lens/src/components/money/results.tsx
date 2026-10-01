"use client";

import dynamic from "next/dynamic";
import { useI18n } from "@/components/i18n";
import { Changed } from "@/components/ui/changed";
import { Help } from "@/components/ui/help";
import type { CalculationBundle } from "@/hooks/use-calculation";
import { valueAt } from "@/lib/calculator";
import { formatShare, gainedShareOf, growsText } from "@/lib/growth";
import type { ResolvedInvestment } from "@/lib/investment";
import { CONCENTRATION_LIMIT } from "@/lib/mix";
import { GrowthChart } from "./growth-chart";
import { ResultCard } from "./result-card";
import { WhatIfIndicator, WhatIfRow } from "./what-if-row";

function Loading() {
  const { m } = useI18n();
  return <p className="text-sm text-muted">{m.cards.loading}</p>;
}

// Each card's details are their own code, loaded when the card is opened.
const PayDetails = dynamic(() => import("./pay-details").then((module) => module.PayDetails), { loading: Loading });
const WhereDetails = dynamic(() => import("./where-details").then((module) => module.WhereDetails), { loading: Loading });
const GoalsSection = dynamic(() => import("./goals-section").then((module) => module.GoalsSection), { loading: Loading });
const KnowDetails = dynamic(() => import("./know-details").then((module) => module.KnowDetails), { loading: Loading });

/** Level 1: what the money is worth after the years, big, and how it grows, in one line. */
function ResultTotal({ bundle }: { bundle: CalculationBundle }) {
  const i18n = useI18n();
  const { m, f } = i18n;
  const { calc } = bundle;
  const { result } = calc;
  const years = m.units.years(result.years);
  const grows = growsText(result.growthRate, i18n);
  const share = gainedShareOf(result);
  return (
    <section aria-label={m.result.label} className="space-y-1">
      {/* What a screen reader says after a change: one short sentence, not the whole section. */}
      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {m.result.announce(years, f.eur(result.total), grows) + (calc.whatIf ? m.result.announceWhatIf(m.whatIf.applied[calc.whatIf]) : "")}
      </p>
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <p className="text-base text-muted">
          <Changed value={m.result.inYears(years)} />
        </p>
        <WhatIfIndicator applied={calc.whatIf} />
      </div>
      <p className="flex items-center gap-2 text-4xl font-extrabold tracking-tight tabular-nums sm:text-5xl">
        <Changed value={f.eur(result.total)} />
        <Help what={m.result.inYears(years)} text={m.help.total} />
      </p>
      <p className="text-lg font-semibold tabular-nums">
        <Changed value={share === null ? grows : m.result.growthLine(grows, formatShare(share, i18n))} />
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
export function Results({ bundle }: { bundle: CalculationBundle }) {
  const i18n = useI18n();
  const { m, f } = i18n;
  const { calc, base, today } = bundle;
  const { result } = calc;
  const t = m.cards;
  // The card's sentence: what +€50 a month would add (the same figure its chip shows).
  const fifty = valueAt({ ...base.scenario, monthly: base.scenario.monthly + 50 }, base.result.years * 12) - base.result.total;
  const covered = calc.countries.filter((row) => row.withoutHousing.covered).length;
  const first = calc.goals[0];
  const share = concentratedShare(calc.investment);

  return (
    <div className="space-y-6">
      <ResultTotal bundle={bundle} />
      <GrowthChart bundle={bundle} />
      <div className="space-y-2">
        <ResultCard title={`${m.result.couldPay} ${m.result.perMonth(f.smallEur(result.income))}`}>
          <PayDetails bundle={bundle} />
        </ResultCard>
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
