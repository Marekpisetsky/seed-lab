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
import { resolveInvestment } from "@/lib/investment";
import { startingCapital } from "@/lib/plan";
import { warmUp } from "@/lib/warm";
import { MONTHLY_STEP, stepValue, YEARS_STEP } from "@/lib/step";
import { EXAMPLE_AMOUNTS, MAX_AMOUNT, MAX_YEARS_AHEAD, MIN_YEARS } from "@/lib/validation";
import { GrowthChips } from "./growth-chips";

/** Mixes, My portfolio, ups and downs and rising prices: loaded when "More options" is opened. */
const MoreOptions = dynamic(() => import("./more-options").then((module) => module.MoreOptions), {
  loading: () => <div aria-hidden="true" className="h-24" />,
});

const questionClass = "block text-base font-semibold";
/** An example in an empty field: grey and slanted, plainly not data. */
const exampleClass = "placeholder:italic placeholder:text-muted";

/** An amount in euros, with "€" where the page's language writes it: before ("€1,000") or after ("1000 €"). */
function EuroQuestion({ label, value, example, onCommit, onEmpty }: { label: string; value: number | null; example: number; onCommit: (value: number) => void; onEmpty: () => void }) {
  const { m, f } = useI18n();
  const id = useId();
  const before = f.eur(1).startsWith("€");
  return (
    <div className="min-w-0 space-y-1.5">
      <label htmlFor={id} className={questionClass}>
        {label}
      </label>
      <span className="relative block">
        <span aria-hidden="true" className={`pointer-events-none absolute inset-y-0 flex items-center text-muted ${before ? "left-3" : "right-3"}`}>
          €
        </span>
        <SettledNumberInput
          id={id}
          value={value}
          onCommit={onCommit}
          onEmpty={onEmpty}
          max={MAX_AMOUNT}
          placeholder={m.calculator.example(f.grouped(example))}
          className={`text-base ${exampleClass} ${before ? "pl-7" : "pr-7"}`}
        />
      </span>
    </div>
  );
}

const stepButton =
  "flex size-11 shrink-0 items-center justify-center rounded-md border border-border bg-background text-muted hover:text-foreground disabled:opacity-40";

/** A question with − and + beside its field: one step at once, no typing pause. */
function Stepped({
  label,
  less,
  more,
  onLess,
  onMore,
  atMin,
  atMax,
  children,
}: {
  label: string;
  less: string;
  more: string;
  onLess: () => void;
  onMore: () => void;
  atMin: boolean;
  atMax: boolean;
  children: (id: string) => React.ReactNode;
}) {
  const id = useId();
  return (
    <div className="min-w-0 space-y-1.5">
      <label htmlFor={id} className={questionClass}>
        {label}
      </label>
      <div className="flex max-w-72 items-center gap-1">
        <button type="button" aria-label={less} disabled={atMin} onClick={onLess} className={stepButton}>
          <Minus aria-hidden="true" className="size-4" />
        </button>
        <span className="relative block min-w-0 flex-1">{children(id)}</span>
        <button type="button" aria-label={more} disabled={atMax} onClick={onMore} className={stepButton}>
          <Plus aria-hidden="true" className="size-4" />
        </button>
      </div>
    </div>
  );
}

const monthlyStep = { ...MONTHLY_STEP, max: MAX_AMOUNT };

/**
 * The calculator, a few questions and nothing else: how much you have, how
 * much you add each month, how much it grows a year (chips, or "My %") and
 * for how many years. The amounts start empty, with an example in grey;
 * the years start at 20. Mixes, My portfolio, ups and downs and rising
 * prices wait in "More options", folded.
 */
export function CalculatorCard() {
  const i18n = useI18n();
  const { m, f } = i18n;
  const t = m.calculator;
  const { plan, holdings, uploadedPrices } = useAppState();
  const priced = useMemo(() => priceHoldings(holdings, uploadedPrices), [holdings, uploadedPrices]);
  const capital = startingCapital(priced, plan.invested);
  const current = resolveInvestment(plan.investment, priced, plan);
  const [more, setMore] = useState(false);
  const moreId = useId();
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

  return (
    <section aria-label={t.label} className="grid gap-x-6 gap-y-5 rounded-xl border border-border bg-card p-4 sm:grid-cols-2 sm:p-5">
      {/* The order the eye reads is the order Tab follows: have, add, grow, years. */}
      {capital.source === "holdings" ? (
        <div className="min-w-0 space-y-1.5">
          <p className={questionClass}>{t.haveQ}</p>
          <p className="py-1.5 text-base font-semibold">
            <Changed value={f.eur(capital.amount)} />
          </p>
          <p className="text-xs text-muted">{t.fromHoldings}</p>
        </div>
      ) : (
        <EuroQuestion
          label={t.haveQ}
          value={plan.invested}
          example={EXAMPLE_AMOUNTS.invested}
          onCommit={(invested) => updatePlan({ invested })}
          onEmpty={() => updatePlan({ invested: null })}
        />
      )}
      <Stepped
        label={t.monthlyQ}
        less={t.lessMonthly}
        more={t.moreMonthly}
        atMin={monthly === null || monthly <= 0}
        atMax={monthly !== null && monthly >= MAX_AMOUNT}
        onLess={() => updatePlan({ monthlyContribution: stepValue(monthly ?? 0, -1, monthlyStep) })}
        onMore={() => updatePlan({ monthlyContribution: stepValue(monthly ?? 0, 1, monthlyStep) })}
      >
        {(id) => (
          <SettledNumberInput
            id={id}
            value={monthly}
            onCommit={(monthlyContribution) => updatePlan({ monthlyContribution })}
            onEmpty={() => updatePlan({ monthlyContribution: null })}
            max={MAX_AMOUNT}
            placeholder={t.example(f.grouped(EXAMPLE_AMOUNTS.monthlyContribution))}
            className={`px-1 text-center text-base ${exampleClass}`}
          />
        )}
      </Stepped>
      <div className="min-w-0 space-y-2 sm:col-span-2">
        <p aria-hidden="true" className={questionClass}>
          {t.growthQ}
        </p>
        <GrowthChips current={current} label={t.growthQ} />
      </div>
      <Stepped
        label={t.yearsQ}
        less={t.lessYear}
        more={t.moreYear}
        atMin={plan.years <= MIN_YEARS}
        atMax={plan.years >= MAX_YEARS_AHEAD}
        onLess={() => updatePlan({ years: stepValue(plan.years, -1, YEARS_STEP) })}
        onMore={() => updatePlan({ years: stepValue(plan.years, 1, YEARS_STEP) })}
      >
        {(id) => (
          <SettledNumberInput
            id={id}
            value={plan.years}
            onCommit={(years) => updatePlan({ years: Math.min(MAX_YEARS_AHEAD, Math.max(MIN_YEARS, Math.round(years))) })}
            max={MAX_YEARS_AHEAD}
            placeholder="20"
            className="px-1 text-center text-base"
          />
        )}
      </Stepped>
      <div className="min-w-0 sm:col-span-2">
        <button
          type="button"
          aria-expanded={more}
          aria-controls={moreId}
          onClick={() => setMore(!more)}
          className="-ml-2 inline-flex min-h-11 items-center gap-1.5 rounded-md px-2 text-sm font-medium text-accent hover:bg-accent/10"
        >
          {m.more.title}
          {changed && <span className="rounded bg-accent/10 px-1.5 py-0.5 text-xs">{m.assumptions.custom}</span>}
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
