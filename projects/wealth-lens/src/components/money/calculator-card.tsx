"use client";

import { ChevronDown, Minus, Plus } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { Changed } from "@/components/ui/changed";
import { SettledNumberInput } from "@/components/ui/form";
import { useAppState } from "@/hooks/use-app";
import { updatePlan } from "@/lib/app-store";
import { priceHoldings } from "@/lib/auto-price";
import { formatEur } from "@/lib/format";
import { assumptionLines, portfolioMix, resolveInvestment } from "@/lib/investment";
import { indexRef, stockRef } from "@/lib/mix";
import { startingCapital } from "@/lib/plan";
import { MONTHLY_STEP, stepValue, YEARS_STEP } from "@/lib/step";
import type { Investment } from "@/lib/types";
import { InvestmentPicker, type PickChoice } from "./investment-picker";
import { MixEditor } from "./mix-editor";
import { MAX_AMOUNT, MAX_YEARS_AHEAD, MIN_YEARS } from "@/lib/validation";

const labelClass = "block text-xs font-medium text-muted";

/** A number field with a unit in front (€) or behind (years). */
function Field({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={`block min-w-0 space-y-1 ${className}`}>
      <span className={labelClass}>{label}</span>
      {children}
    </label>
  );
}

function EuroInput({ label, value, onCommit, className }: { label: string; value: number; onCommit: (value: number) => void; className?: string }) {
  return (
    <Field label={label} className={className}>
      <span className="relative block">
        <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted">
          €
        </span>
        <SettledNumberInput value={value} onCommit={onCommit} max={MAX_AMOUNT} placeholder="0" className="pl-7 text-base" />
      </span>
    </Field>
  );
}

const stepButton =
  "flex size-8 shrink-0 items-center justify-center rounded-md border border-border bg-background text-muted hover:text-foreground disabled:opacity-40 sm:size-10";

/** A field with − and + on its sides: one step at once, no typing pause. */
function Stepped({
  label,
  less,
  more,
  onLess,
  onMore,
  atMin,
  atMax,
  className = "",
  children,
}: {
  label: string;
  less: string;
  more: string;
  onLess: () => void;
  onMore: () => void;
  atMin: boolean;
  atMax: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`min-w-0 space-y-1 ${className}`}>
      <span aria-hidden="true" className={labelClass}>
        {label}
      </span>
      <div className="flex items-center gap-0.5 sm:gap-1">
        <button type="button" aria-label={less} disabled={atMin} onClick={onLess} className={stepButton}>
          <Minus aria-hidden="true" className="size-4" />
        </button>
        <span className="relative block min-w-0 flex-1">{children}</span>
        <button type="button" aria-label={more} disabled={atMax} onClick={onMore} className={stepButton}>
          <Plus aria-hidden="true" className="size-4" />
        </button>
      </div>
    </div>
  );
}

/** The picker's key for the plan's choice: "index:sp500", "stock:NVDA", "portfolio", "mix". */
function keyOf(investment: Investment): string | null {
  switch (investment.kind) {
    case "index":
      return indexRef(investment.index);
    case "stock":
      return stockRef(investment.id);
    case "portfolio":
    case "mix":
      return investment.kind;
    case "custom":
      return null;
  }
}

/** A choice from the picker as the plan's investment; "A mix…" starts from what is chosen now. */
function investmentFor(choice: PickChoice, current: Investment): Investment {
  switch (choice.kind) {
    case "index":
    case "stock":
    case "portfolio":
      return choice;
    case "mix": {
      if (current.kind === "mix") return current;
      const start = current.kind === "index" || current.kind === "stock" ? keyOf(current) : null;
      return { kind: "mix", parts: [{ ref: start ?? indexRef("sp500"), weight: 100 }], rebalance: false };
    }
  }
}

const EMPTY: readonly string[] = [];
const monthlyStep = { ...MONTHLY_STEP, max: MAX_AMOUNT };

/**
 * The calculator, first and on its own: what you have, what you add each
 * month, what it is invested in, and for how many years. It starts with
 * real values (EUR 1,000, EUR 200, the S&P 500, 20 years) and changes the
 * result once the user has finished typing.
 */
export function CalculatorCard() {
  const { plan, holdings, uploadedPrices } = useAppState();
  const priced = useMemo(() => priceHoldings(holdings, uploadedPrices), [holdings, uploadedPrices]);
  const capital = startingCapital(priced, plan.invested);
  const hasPortfolio = portfolioMix(priced).weights.length > 0;
  const current = resolveInvestment(plan.investment, priced);
  const [picker, setPicker] = useState<{ mode: "choose" | "add"; top: number } | null>(null);
  const close = useCallback(() => setPicker(null), []);
  const open = (mode: "choose" | "add", anchor: HTMLElement) => setPicker({ mode, top: anchor.offsetTop + anchor.offsetHeight + 4 });
  const mix = plan.investment.kind === "mix" ? plan.investment : null;
  const shownName = mix ? `Mix of ${mix.parts.length}` : plan.investment.kind === "stock" ? `${current.name} (${plan.investment.id})` : current.name;

  return (
    <section aria-label="Calculator" className="relative grid grid-cols-2 gap-x-3 gap-y-4 rounded-xl border border-border bg-card p-4 sm:grid-cols-4">
      {/* On a phone: "You have" and "Invested in" side by side, then the two steppers in a row of their
          own (they need the width); on a wider screen the four fields in one row, in reading order. */}
      {capital.source === "holdings" ? (
        <div className="order-1 min-w-0 space-y-1">
          <p className={labelClass}>You have</p>
          <p className="py-1.5 text-base font-semibold">
            <Changed value={formatEur(capital.amount)} />
          </p>
          <p className="text-xs text-muted">Euro holdings, on My stocks</p>
        </div>
      ) : (
        <EuroInput label="You have" value={plan.invested} onCommit={(invested) => updatePlan({ invested })} className="order-1" />
      )}
      <div className="order-3 col-span-2 grid grid-cols-2 gap-x-2 sm:contents">
      <Stepped
        className="sm:order-2"
        label="You add each month (€)"
        less="€50 less a month"
        more="€50 more a month"
        atMin={plan.monthlyContribution <= 0}
        atMax={plan.monthlyContribution >= MAX_AMOUNT}
        onLess={() => updatePlan({ monthlyContribution: stepValue(plan.monthlyContribution, -1, monthlyStep) })}
        onMore={() => updatePlan({ monthlyContribution: stepValue(plan.monthlyContribution, 1, monthlyStep) })}
      >
        <SettledNumberInput
          aria-label="You add each month, in euros"
          value={plan.monthlyContribution}
          onCommit={(monthlyContribution) => updatePlan({ monthlyContribution })}
          max={MAX_AMOUNT}
          placeholder="0"
          className="px-1 text-center text-base"
        />
      </Stepped>
      <Stepped
        className="sm:order-4"
        label="For (years)"
        less="One year less"
        more="One year more"
        atMin={plan.years <= MIN_YEARS}
        atMax={plan.years >= MAX_YEARS_AHEAD}
        onLess={() => updatePlan({ years: stepValue(plan.years, -1, YEARS_STEP) })}
        onMore={() => updatePlan({ years: stepValue(plan.years, 1, YEARS_STEP) })}
      >
        <SettledNumberInput
          aria-label="For how many years"
          value={plan.years}
          onCommit={(years) => updatePlan({ years: Math.min(MAX_YEARS_AHEAD, Math.max(MIN_YEARS, Math.round(years))) })}
          max={MAX_YEARS_AHEAD}
          placeholder="20"
          className="px-1 text-center text-base"
        />
      </Stepped>
      </div>
      <div className="order-2 min-w-0 space-y-1 sm:order-3">
        <span id="invested-in-label" className={labelClass}>
          Invested in
        </span>
        <button
          type="button"
          aria-haspopup="listbox"
          aria-expanded={picker?.mode === "choose"}
          aria-labelledby="invested-in-label invested-in-value"
          // The list closes on a press outside it; this button toggles it instead.
          onPointerDown={(event) => event.nativeEvent.stopPropagation()}
          onClick={(event) => (picker ? close() : open("choose", event.currentTarget))}
          className="flex w-full items-center justify-between gap-2 rounded-md border border-border bg-background px-3 py-2 text-left text-base outline-none focus:border-accent focus:ring-2 focus:ring-accent/30"
        >
          <span id="invested-in-value" className="min-w-0 truncate">
            <Changed value={shownName} />
          </span>
          <ChevronDown aria-hidden="true" className="size-4 shrink-0 text-muted" />
        </button>
      </div>
      {mix && <MixEditor mix={mix} onAddPart={(anchor) => open("add", anchor)} />}
      {picker && (
        <InvestmentPicker
          top={picker.top}
          label={picker.mode === "add" ? "Add to the mix" : "Invested in"}
          withdrawalRate={plan.withdrawalRate}
          selected={picker.mode === "add" ? null : keyOf(plan.investment)}
          hasPortfolio={picker.mode === "choose" && hasPortfolio}
          holdingsCount={priced.length}
          withMix={picker.mode === "choose"}
          exclude={picker.mode === "add" && mix ? mix.parts.map((part) => part.ref) : EMPTY}
          onClose={close}
          onPick={(choice) => {
            if (picker.mode === "add" && mix) {
              const ref = choice.kind === "index" ? indexRef(choice.index) : choice.kind === "stock" ? stockRef(choice.id) : null;
              if (ref) updatePlan({ investment: { ...mix, parts: [...mix.parts, { ref, weight: 0 }] } });
            } else {
              updatePlan({ investment: investmentFor(choice, plan.investment) });
            }
            close();
          }}
        />
      )}
      <div className="order-5 col-span-2 space-y-0.5 text-xs text-muted sm:order-6 sm:col-span-4">
        {assumptionLines(current).map((line, index) => (
          <p key={index}>
            <Changed value={line} />
          </p>
        ))}
      </div>
    </section>
  );
}
