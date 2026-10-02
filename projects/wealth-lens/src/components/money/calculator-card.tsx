"use client";

import { ChevronDown, Minus, Plus } from "lucide-react";
import dynamic from "next/dynamic";
import { useEffect, useId, useMemo, useState } from "react";
import { useI18n } from "@/components/i18n";
import { Changed } from "@/components/ui/changed";
import { SettledNumberInput } from "@/components/ui/form";
import { useAppState } from "@/hooks/use-app";
import { offeredRates } from "@/hooks/use-calculation";
import { updatePlan } from "@/lib/app-store";
import { optionsChanged } from "@/lib/assumptions";
import { priceHoldings } from "@/lib/auto-price";
import { chipOf } from "@/lib/chips";
import { resolveInvestment } from "@/lib/investment";
import { startingCapital } from "@/lib/plan";
import { warmUp } from "@/lib/warm";
import { MONTHLY_STEP, stepValue, YEARS_STEP } from "@/lib/step";
import { DEFAULT_PLAN, EXAMPLE_AMOUNTS, MAX_AMOUNT, MAX_YEARS_AHEAD, MIN_YEARS } from "@/lib/validation";
import { GrowthChips } from "./growth-chips";

/** Mixes, My portfolio, ups and downs and rising prices: loaded when "More options" is opened. */
const MoreOptions = dynamic(() => import("./more-options").then((module) => module.MoreOptions), {
  loading: () => <div aria-hidden="true" className="h-24" />,
});

/** An example in an empty field: grey and slanted, plainly not data. */
const exampleClass = "placeholder:italic placeholder:text-muted";

/**
 * One numbered step: its number, its title and a short line on what it
 * asks, then its field. On a phone they stack, the field under the title;
 * on a wide screen the field sits on the right. The same in all four.
 */
function Step({
  number,
  title,
  hint,
  fieldId,
  hintId,
  children,
}: {
  number: number;
  title: string;
  hint: string;
  /** The field the title labels; a step whose field labels itself (the chips) has none. */
  fieldId?: string;
  hintId: string;
  children: React.ReactNode;
}) {
  return (
    <li className="grid gap-x-6 gap-y-2 py-4 first:pt-0 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
      <div className="flex gap-3">
        <span aria-hidden="true" className="flex size-7 shrink-0 items-center justify-center rounded-full bg-foreground text-sm font-bold text-background tabular-nums">
          {number}
        </span>
        <div className="min-w-0 space-y-0.5 pt-0.5">
          {fieldId ? (
            <label htmlFor={fieldId} className="block text-base font-semibold">
              {title}
            </label>
          ) : (
            <p className="text-base font-semibold">{title}</p>
          )}
          <p id={hintId} className="text-sm text-muted">
            <Changed value={hint} />
          </p>
        </div>
      </div>
      <div className="min-w-0 space-y-1.5 pl-10 md:pl-0">{children}</div>
    </li>
  );
}

/** An amount in euros, with "€" where the page's language writes it: before ("€1,000") or after ("1000 €"). */
function EuroField({ id, hintId, value, example, onCommit, onEmpty }: { id: string; hintId: string; value: number | null; example: number; onCommit: (value: number) => void; onEmpty: () => void }) {
  const { m, f } = useI18n();
  const before = f.eur(1).startsWith("€");
  return (
    <span className="relative block max-w-72">
      <span aria-hidden="true" className={`pointer-events-none absolute inset-y-0 flex items-center text-muted ${before ? "left-3" : "right-3"}`}>
        €
      </span>
      <SettledNumberInput
        id={id}
        aria-describedby={hintId}
        value={value}
        onCommit={onCommit}
        onEmpty={onEmpty}
        max={MAX_AMOUNT}
        placeholder={m.calculator.example(f.grouped(example))}
        className={`text-base ${exampleClass} ${before ? "pl-7" : "pr-7"}`}
      />
    </span>
  );
}

const stepButton =
  "flex size-11 shrink-0 items-center justify-center rounded-md border border-border bg-background text-muted hover:text-foreground disabled:opacity-40";

/** A field with − and + beside it: one step at once, no typing pause. */
function Stepper({
  less,
  more,
  onLess,
  onMore,
  atMin,
  atMax,
  unit,
  children,
}: {
  less: string;
  more: string;
  onLess: () => void;
  onMore: () => void;
  atMin: boolean;
  atMax: boolean;
  /** A word after the + ("years"), for the eye: the step's title and line already say it. */
  unit?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex max-w-72 items-center gap-1">
      <button type="button" aria-label={less} disabled={atMin} onClick={onLess} className={stepButton}>
        <Minus aria-hidden="true" className="size-4" />
      </button>
      <span className="relative block min-w-0 flex-1">{children}</span>
      <button type="button" aria-label={more} disabled={atMax} onClick={onMore} className={stepButton}>
        <Plus aria-hidden="true" className="size-4" />
      </button>
      {unit && (
        <span aria-hidden="true" className="ml-1 text-base text-muted">
          {unit}
        </span>
      )}
    </div>
  );
}

const monthlyStep = { ...MONTHLY_STEP, max: MAX_AMOUNT };

/**
 * The calculator, four numbered steps and nothing else: your money today,
 * what you add each month, how it grows (chips, or "My %") and for how many
 * years. The amounts start empty, with an example in grey; the growth and
 * the years start filled in, and say so ("You can change it"). Under the
 * steps, the page's own button (`action`); last, "More options", folded:
 * mixes, My portfolio, ups and downs and rising prices. Once there is a
 * result, `hints` puts a line under the monthly amount and the years.
 */
export function CalculatorCard({ action, hints }: { action?: React.ReactNode; hints?: { monthly?: React.ReactNode; years?: React.ReactNode } }) {
  const i18n = useI18n();
  const { m, f } = i18n;
  const t = m.calculator;
  const { plan, holdings, uploadedPrices } = useAppState();
  const priced = useMemo(() => priceHoldings(holdings, uploadedPrices), [holdings, uploadedPrices]);
  const capital = startingCapital(priced, plan.invested);
  const current = resolveInvestment(plan.investment, priced, plan);
  const [more, setMore] = useState(false);
  const moreId = useId();
  const ids = { have: useId(), monthly: useId(), years: useId() };
  const hintIds = { have: useId(), monthly: useId(), growth: useId(), years: useId() };
  // Once the user starts using the page, idle moments work out ahead what the next choice will need
  // (not before: a page only looked at does no extra work).
  useEffect(() => {
    const start = () => warmUp(offeredRates(plan.withdrawalRate));
    const events = ["pointerdown", "keydown", "focusin"] as const;
    events.forEach((name) => window.addEventListener(name, start, { once: true, passive: true }));
    return () => events.forEach((name) => window.removeEventListener(name, start));
  }, [plan.withdrawalRate]);
  const changed = optionsChanged(plan);
  const monthly = plan.monthlyContribution;
  // The growth and the years start filled in: while they are as they came, their step says it is a choice to change.
  const presetChip = chipOf(DEFAULT_PLAN.investment);
  const growthPreset = presetChip !== null && chipOf(plan.investment) === presetChip && !current.custom && !current.customInflation;
  const presetAsset = DEFAULT_PLAN.investment.kind === "asset" ? DEFAULT_PLAN.investment.asset : null;

  return (
    <section aria-label={t.label} className="rounded-xl border border-border bg-card p-4 sm:p-5">
      {/* The order the eye reads is the order Tab follows: have, add, grow, years. */}
      <ol className="divide-y divide-border">
        <Step number={1} title={t.steps.have.title} hint={capital.source === "holdings" ? t.fromHoldings : t.steps.have.hint} hintId={hintIds.have} fieldId={capital.source === "holdings" ? undefined : ids.have}>
          {capital.source === "holdings" ? (
            <p className="py-1.5 text-base font-semibold tabular-nums">
              <Changed value={f.eur(capital.amount)} />
            </p>
          ) : (
            <EuroField
              id={ids.have}
              hintId={hintIds.have}
              value={plan.invested}
              example={EXAMPLE_AMOUNTS.invested}
              onCommit={(invested) => updatePlan({ invested })}
              onEmpty={() => updatePlan({ invested: null })}
            />
          )}
        </Step>
        <Step number={2} title={t.steps.monthly.title} hint={t.steps.monthly.hint} hintId={hintIds.monthly} fieldId={ids.monthly}>
          <Stepper
            less={t.lessMonthly}
            more={t.moreMonthly}
            atMin={monthly === null || monthly <= 0}
            atMax={monthly !== null && monthly >= MAX_AMOUNT}
            onLess={() => updatePlan({ monthlyContribution: stepValue(monthly ?? 0, -1, monthlyStep) })}
            onMore={() => updatePlan({ monthlyContribution: stepValue(monthly ?? 0, 1, monthlyStep) })}
          >
            <SettledNumberInput
              id={ids.monthly}
              aria-describedby={hintIds.monthly}
              value={monthly}
              onCommit={(monthlyContribution) => updatePlan({ monthlyContribution })}
              onEmpty={() => updatePlan({ monthlyContribution: null })}
              max={MAX_AMOUNT}
              placeholder={t.example(f.grouped(EXAMPLE_AMOUNTS.monthlyContribution))}
              className={`px-1 text-center text-base ${exampleClass}`}
            />
          </Stepper>
          {hints?.monthly}
        </Step>
        <Step
          number={3}
          title={t.steps.growth.title}
          hint={growthPreset && presetAsset ? t.presetGrowth(m.assets.inSentence[presetAsset]) : t.steps.growth.hint}
          hintId={hintIds.growth}
        >
          <GrowthChips current={current} label={t.steps.growth.title} describedBy={hintIds.growth} />
        </Step>
        <Step
          number={4}
          title={t.steps.years.title}
          hint={plan.years === DEFAULT_PLAN.years ? t.presetYears(m.units.years(plan.years)) : t.steps.years.hint}
          hintId={hintIds.years}
          fieldId={ids.years}
        >
          <Stepper
            less={t.lessYear}
            more={t.moreYear}
            atMin={plan.years <= MIN_YEARS}
            atMax={plan.years >= MAX_YEARS_AHEAD}
            unit={t.yearsUnit(plan.years)}
            onLess={() => updatePlan({ years: stepValue(plan.years, -1, YEARS_STEP) })}
            onMore={() => updatePlan({ years: stepValue(plan.years, 1, YEARS_STEP) })}
          >
            <SettledNumberInput
              id={ids.years}
              aria-describedby={hintIds.years}
              value={plan.years}
              onCommit={(years) => updatePlan({ years: Math.min(MAX_YEARS_AHEAD, Math.max(MIN_YEARS, Math.round(years))) })}
              max={MAX_YEARS_AHEAD}
              placeholder="20"
              className="px-1 text-center text-base"
            />
          </Stepper>
          {hints?.years}
        </Step>
      </ol>
      {action && <div className="mt-2 border-t border-border pt-4 md:grid md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] md:gap-x-6">{action}</div>}
      <div className="mt-3">
        <button
          type="button"
          aria-expanded={more}
          aria-controls={moreId}
          onClick={() => setMore(!more)}
          className="-ml-2 inline-flex min-h-11 items-center gap-1.5 rounded-md px-2 text-sm text-muted hover:bg-border/40 hover:text-foreground"
        >
          {m.more.title}
          {changed && <span className="rounded bg-accent/10 px-1.5 py-0.5 text-xs text-accent">{m.assumptions.custom}</span>}
          <ChevronDown aria-hidden="true" className={`size-4 transition-transform ${more ? "rotate-180" : ""}`} />
        </button>
        {more && (
          <div id={moreId} className="mt-2">
            <MoreOptions current={current} priced={priced} />
          </div>
        )}
      </div>
    </section>
  );
}
