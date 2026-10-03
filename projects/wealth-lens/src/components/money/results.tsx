"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/components/i18n";
import { Changed } from "@/components/ui/changed";
import { Help } from "@/components/ui/help";
import type { CalculationBundle } from "@/hooks/use-calculation";
import type { I18n } from "@/i18n";
import { investedInText } from "@/i18n/investment-text";
import { growsText } from "@/lib/growth";
import type { ResolvedInvestment } from "@/lib/investment";
import { CONCENTRATION_LIMIT } from "@/lib/mix";
import { StocksSummary } from "./stocks-summary";
import { GrowthChart } from "./growth-chart";
import { TOTAL_ID } from "./first-result";
import { KeyFacts } from "./key-facts";
import { ResultSection, SeeMore } from "./result-section";
import { WhatIfIndicator, whatIfApplied, WhatIfRow } from "./what-if-row";

function Loading() {
  const { m } = useI18n();
  return <p className="text-sm text-muted">{m.cards.loading}</p>;
}

// Each section's code is its own: loaded once the result shows; what you should know, once asked for.
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
        {m.result.announce(years, f.eur(result.total), grows) +
          (calc.whatIf ? m.result.announceWhatIf(whatIfApplied(calc.whatIf, bundle.base.investment, bundle.base.result.years, i18n)) : "")}
      </p>
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <p className="text-base text-muted sm:text-lg">
          <Changed value={summaryText(calc, i18n)} />
        </p>
        <WhatIfIndicator bundle={bundle} />
      </div>
      <p id={TOTAL_ID} className="flex items-center gap-2 text-5xl font-extrabold tracking-tight tabular-nums sm:text-6xl">
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
 * The result in levels: what the user said and the total, the six key
 * figures under it, the chart with its tabs (the main picture), then, with
 * their titles always in sight: "What if…?", my stocks today (only with
 * holdings), my goals, where it reaches and what you should know. Only each
 * one's long detail waits behind "See more".
 */
export function Results({ bundle, arrive = false, onArrived }: { bundle: CalculationBundle; arrive?: boolean; onArrived?: () => void }) {
  const i18n = useI18n();
  const top = useRef<HTMLElement>(null);
  // Asked for with "See my result", it comes in by parts (kept for its whole first showing, so the animation is never cut).
  const [stagger] = useState(arrive);
  // The page goes to it only when it is out of sight (on a phone, where the button was further down): it glides, or jumps for those who asked for less motion.
  useEffect(() => {
    const element = top.current;
    if (!arrive || !element) return;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    element.focus({ preventScroll: true });
    const box = element.getBoundingClientRect();
    if (box.top < 0 || box.top > window.innerHeight * 0.5) element.scrollIntoView({ behavior: still ? "auto" : "smooth", block: "start" });
    onArrived?.();
  }, [arrive, onArrived]);
  /** Number, grid, chart: one after the other, 60 ms apart, each 220 ms (340 ms in all). */
  const part = (delay: number, className = "") => (stagger ? { className: `${className} motion-safe:animate-arrive`, style: { animationDelay: `${delay}ms` } } : { className });
  const { m, f } = i18n;
  const { calc, today } = bundle;
  const { result } = calc;
  const share = concentratedShare(calc.investment);

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div {...part(0)}>
          <ResultTotal bundle={bundle} ref={top} />
        </div>
        <div {...part(60)}>
          <KeyFacts bundle={bundle} />
        </div>
      </div>
      <div {...part(120)}>
        <GrowthChart bundle={bundle} />
      </div>
      <div {...part(120, "space-y-6")}>
        {/* On a phone, under the chart; from 1024 px it sits beside the result instead (money-module.tsx). */}
        <ResultSection title={m.whatIf.title} className="lg:hidden">
          <WhatIfRow bundle={bundle} />
        </ResultSection>
        <StocksSummary holdings={bundle.holdings} />
        <ResultSection title={m.goals.title}>
          <GoalsSection calc={calc} today={today} inCard />
        </ResultSection>
        <ResultSection title={m.cards.where}>
          <WhereDetails bundle={bundle} />
        </ResultSection>
        <ResultSection title={m.findings.title} tone={share === null ? "plain" : "warning"}>
          <p className={`text-sm ${share === null ? "text-muted" : "text-warning-foreground"}`}>
            {share === null
              ? m.cards.knowSummary
              : m.cards.concentration(f.percent(share, { decimals: 0 }), f.eur(share * (calc.scenario.capital > 0 ? calc.scenario.capital : result.total)))}
          </p>
          <SeeMore what={m.findings.title}>
            <KnowDetails bundle={bundle} />
          </SeeMore>
        </ResultSection>
      </div>
    </div>
  );
}
