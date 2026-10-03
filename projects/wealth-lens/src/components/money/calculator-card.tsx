"use client";

import { ArrowDown, ChevronDown, Minus, Plus } from "lucide-react";
import dynamic from "next/dynamic";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useI18n } from "@/components/i18n";
import { Changed } from "@/components/ui/changed";
import { SettledNumberInput } from "@/components/ui/form";
import { useAppState } from "@/hooks/use-app";
import { offeredRates } from "@/hooks/use-calculation";
import { appStore, updatePlan } from "@/lib/app-store";
import { optionsChanged } from "@/lib/assumptions";
import { priceHoldings } from "@/lib/auto-price";
import { resolveInvestment } from "@/lib/investment";
import { planReady, startingCapital } from "@/lib/plan";
import { MONTHLY_STEP, stepValue, YEARS_STEP } from "@/lib/step";
import { EXAMPLE_AMOUNTS, MAX_AMOUNT, MAX_YEARS_AHEAD, MIN_YEARS } from "@/lib/validation";
import { warmUp } from "@/lib/warm";
import { GrowthField } from "./growth-field";

/** Mixes, My portfolio, ups and downs and rising prices: loaded when "More options" is opened. */
const MoreOptions = dynamic(() => import("./more-options").then((module) => module.MoreOptions), {
  loading: () => <div aria-hidden="true" className="h-24" />,
});

/** An example in an empty field: grey and slanted, plainly not data. */
const exampleClass = "placeholder:italic placeholder:text-muted";

/**
 * One numbered step: its number, its short question, and its one field.
 * The columns have fixed widths, and the question has a box of fixed
 * height: two lines on a phone and beside a result, one line on a wide
 * screen. So the card is the same size in every language. On a phone (and
 * compact, beside or under a result) the field goes under the question; on
 * a wide screen, on its right.
 */
function Step({ number, question, fieldId, compact, children }: { number: number; question: string; fieldId?: string; compact: boolean; children: React.ReactNode }) {
  const line = compact ? "h-12" : "h-12 lg:h-7";
  const text = compact ? "line-clamp-2" : "line-clamp-2 lg:line-clamp-none lg:whitespace-nowrap";
  return (
    <li
      className={`grid grid-cols-[1.75rem_minmax(0,1fr)] items-start gap-x-3 gap-y-2 first:pt-0 last:pb-0 ${
        compact ? "py-3" : "py-4 lg:grid-cols-[1.75rem_minmax(0,1fr)_22rem] lg:gap-x-4"
      }`}
    >
      <span aria-hidden="true" className={`flex items-center ${line}`}>
        <span className="flex size-7 items-center justify-center rounded-full bg-foreground text-sm font-bold text-background tabular-nums">{number}</span>
      </span>
      {fieldId ? (
        <label htmlFor={fieldId} className={`flex items-center text-base font-semibold leading-6 ${line}`}>
          <span className={text}>{question}</span>
        </label>
      ) : (
        <p className={`flex items-center text-base font-semibold leading-6 ${line}`}>
          <span className={text}>{question}</span>
        </p>
      )}
      <div className={`col-span-2 min-w-0 ${compact ? "" : "lg:col-span-1"}`}>{children}</div>
    </li>
  );
}

const stepButton = "flex size-11 shrink-0 items-center justify-center rounded-md border border-border bg-background text-muted hover:text-foreground disabled:opacity-40";

/** A field with − and + beside it: one step at once, no typing pause. */
function Stepper({ less, more, onLess, onMore, atMin, atMax, children }: { less: string; more: string; onLess: () => void; onMore: () => void; atMin: boolean; atMax: boolean; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-1">
      <button type="button" aria-label={less} disabled={atMin} onClick={onLess} className={stepButton}>
        <Minus aria-hidden="true" className="size-4" />
      </button>
      <span className="relative block min-w-0 flex-1">{children}</span>
      <button type="button" aria-label={more} disabled={atMax} onClick={onMore} className={stepButton}>
        <Plus aria-hidden="true" className="size-4" />
      </button>
    </div>
  );
}

/** A word inside a field, at its side ("€", "%", "years"): part of the field's width, so nothing moves with the language. */
function Affix({ side, children }: { side: "left" | "right"; children: React.ReactNode }) {
  return (
    <span aria-hidden="true" className={`pointer-events-none absolute inset-y-0 flex items-center text-muted ${side === "left" ? "left-3" : "right-3"}`}>
      {children}
    </span>
  );
}

const monthlyStep = { ...MONTHLY_STEP, max: MAX_AMOUNT };

/**
 * The calculator, four numbered steps and nothing else: how much you have,
 * how much you add a month, how much it grows a year (5 % to start, with
 * examples) and for how many years. The amounts start empty, with an
 * example in grey. Enter goes to the next step. With `onSee`, "See my
 * result" ends the card, the one thing in it that stands out; it works once
 * both amounts are in. `compact`: beside or under a result, the field under
 * each question.
 */
export function CalculatorCard({ onSee, compact = false }: { onSee?: () => void; compact?: boolean }) {
  const i18n = useI18n();
  const { m, f } = i18n;
  const t = m.calculator;
  const { plan, holdings, uploadedPrices } = useAppState();
  const priced = useMemo(() => priceHoldings(holdings, uploadedPrices), [holdings, uploadedPrices]);
  const capital = startingCapital(priced, plan.invested);
  const current = resolveInvestment(plan.investment, priced, plan);
  const ids = { have: useId(), monthly: useId(), growth: useId(), years: useId(), see: useId() };
  const seeButton = useRef<HTMLButtonElement>(null);
  const ready = planReady(plan, priced);
  // Once the user starts using the page, idle moments work out ahead what the next choice will need
  // (not before: a page only looked at does no extra work).
  useEffect(() => {
    const start = () => warmUp(offeredRates(plan.withdrawalRate));
    const events = ["pointerdown", "keydown", "focusin"] as const;
    events.forEach((name) => window.addEventListener(name, start, { once: true, passive: true }));
    return () => events.forEach((name) => window.removeEventListener(name, start));
  }, [plan.withdrawalRate]);
  const monthly = plan.monthlyContribution;
  const before = f.eur(1).startsWith("€");
  // Enter in a field goes on to the next step, and from the last to the button.
  const order = [capital.source === "holdings" ? null : ids.have, ids.monthly, ids.growth, ids.years].filter((id): id is string => id !== null);
  const next = (from: string) => () => {
    const after = order[order.indexOf(from) + 1];
    if (after) document.getElementById(after)?.focus();
    else seeButton.current?.focus();
  };
  // The key stops here: else the same press would also press the button it lands on.
  const enter = (from: string) => (event: React.KeyboardEvent) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    next(from)();
  };
  // Read from the store at the press, not from this render: leaving a field for the button saves its number just before.
  const see = () => {
    const now = appStore.get();
    if (planReady(now.plan, now.holdings)) {
      onSee?.();
      return;
    }
    const empty = now.holdings.length === 0 && now.plan.invested === null ? ids.have : ids.monthly;
    document.getElementById(empty)?.focus();
  };

  return (
    <section aria-label={t.label} className={`rounded-xl border border-border bg-card ${compact ? "p-4" : "p-4 sm:p-6"}`}>
      {/* The order the eye reads is the order Tab follows: have, add, grow, years. */}
      <ol className="divide-y divide-border">
        <Step number={1} question={t.steps.have} fieldId={capital.source === "holdings" ? undefined : ids.have} compact={compact}>
          {capital.source === "holdings" ? (
            <p className="flex min-h-11 items-center justify-between gap-2 rounded-md border border-border px-3 text-base font-semibold tabular-nums">
              <Changed value={f.eur(capital.amount)} />
              <span className="truncate text-sm font-normal text-muted">{t.fromHoldings}</span>
            </p>
          ) : (
            <span className="relative block">
              <Affix side={before ? "left" : "right"}>€</Affix>
              <SettledNumberInput
                id={ids.have}
                enterKeyHint="next"
                value={plan.invested}
                onCommit={(invested) => updatePlan({ invested })}
                onEmpty={() => updatePlan({ invested: null })}
                onKeyDown={enter(ids.have)}
                max={MAX_AMOUNT}
                placeholder={t.example(f.grouped(EXAMPLE_AMOUNTS.invested))}
                className={`${exampleClass} ${before ? "pl-8" : "pr-8"}`}
              />
            </span>
          )}
        </Step>
        <Step number={2} question={t.steps.monthly} fieldId={ids.monthly} compact={compact}>
          <Stepper
            less={t.lessMonthly}
            more={t.moreMonthly}
            atMin={monthly === null || monthly <= 0}
            atMax={monthly !== null && monthly >= MAX_AMOUNT}
            onLess={() => updatePlan({ monthlyContribution: stepValue(monthly ?? 0, -1, monthlyStep) })}
            onMore={() => updatePlan({ monthlyContribution: stepValue(monthly ?? 0, 1, monthlyStep) })}
          >
            <Affix side={before ? "left" : "right"}>€</Affix>
            <SettledNumberInput
              id={ids.monthly}
              enterKeyHint="next"
              value={monthly}
              onCommit={(monthlyContribution) => updatePlan({ monthlyContribution })}
              onEmpty={() => updatePlan({ monthlyContribution: null })}
              onKeyDown={enter(ids.monthly)}
              max={MAX_AMOUNT}
              placeholder={t.example(f.grouped(EXAMPLE_AMOUNTS.monthlyContribution))}
              className={`${exampleClass} ${before ? "pl-8" : "pr-8"}`}
            />
          </Stepper>
        </Step>
        <Step number={3} question={t.steps.growth} fieldId={ids.growth} compact={compact}>
          <GrowthField id={ids.growth} current={current} compact={compact} onEnter={next(ids.growth)} />
        </Step>
        <Step number={4} question={t.steps.years} fieldId={ids.years} compact={compact}>
          <Stepper
            less={t.lessYear}
            more={t.moreYear}
            atMin={plan.years <= MIN_YEARS}
            atMax={plan.years >= MAX_YEARS_AHEAD}
            onLess={() => updatePlan({ years: stepValue(plan.years, -1, YEARS_STEP) })}
            onMore={() => updatePlan({ years: stepValue(plan.years, 1, YEARS_STEP) })}
          >
            <SettledNumberInput
              id={ids.years}
              enterKeyHint={onSee ? "next" : "done"}
              value={plan.years}
              onCommit={(years) => updatePlan({ years: Math.min(MAX_YEARS_AHEAD, Math.max(MIN_YEARS, Math.round(years))) })}
              onKeyDown={enter(ids.years)}
              max={MAX_YEARS_AHEAD}
              placeholder="20"
              className="pr-16"
            />
            <Affix side="right">{t.yearsUnit(plan.years)}</Affix>
          </Stepper>
        </Step>
      </ol>
      {onSee && (
        <div className={`mt-2 border-t border-border pt-4 ${compact ? "" : "lg:grid lg:grid-cols-[1.75rem_minmax(0,1fr)_22rem] lg:gap-x-4"}`}>
          {/* Not "disabled": a press before both amounts are in takes you to the empty one. */}
          <button
            ref={seeButton}
            type="button"
            aria-disabled={!ready}
            aria-describedby={ready ? undefined : ids.see}
            onClick={see}
            className={`inline-flex min-h-12 w-full items-center justify-center gap-1.5 rounded-md bg-accent px-5 text-base font-semibold text-accent-foreground hover:opacity-90 aria-disabled:opacity-50 aria-disabled:hover:opacity-50 ${compact ? "" : "lg:col-start-3"}`}
          >
            {t.see}
            <ArrowDown aria-hidden="true" className="size-4" />
          </button>
          {!ready && (
            <span id={ids.see} className="sr-only">
              {t.calm}
            </span>
          )}
        </div>
      )}
    </section>
  );
}

/**
 * "More options", out of the card: a quiet link under it that opens its
 * own panel (mixes, My portfolio, ups and downs, rising prices), loaded
 * then. The card keeps its size, open or closed.
 */
export function MoreOptionsLink() {
  const { m } = useI18n();
  const { plan, holdings, uploadedPrices } = useAppState();
  const priced = useMemo(() => priceHoldings(holdings, uploadedPrices), [holdings, uploadedPrices]);
  const [open, setOpen] = useState(false);
  const panel = useId();
  const changed = optionsChanged(plan);
  return (
    <div data-more-options>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panel}
        onClick={() => setOpen(!open)}
        className="-ml-2 inline-flex min-h-11 items-center gap-1.5 rounded-md px-2 text-base text-muted underline underline-offset-2 hover:text-foreground"
      >
        {m.more.title}
        {changed && <span className="rounded bg-accent/10 px-1.5 py-0.5 text-sm text-accent no-underline">{m.assumptions.custom}</span>}
        <ChevronDown aria-hidden="true" className={`size-4 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div id={panel} className="mt-2 rounded-xl border border-border bg-card p-4">
          <MoreOptions current={resolveInvestment(plan.investment, priced, plan)} priced={priced} />
        </div>
      )}
    </div>
  );
}
