"use client";

import { ChevronDown } from "lucide-react";
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
import type { Investment } from "@/lib/types";
import { InvestmentPicker, type PickChoice } from "./investment-picker";
import { MixEditor } from "./mix-editor";
import { MAX_AMOUNT, MAX_YEARS_AHEAD, MIN_YEARS } from "@/lib/validation";

const labelClass = "block text-xs font-medium text-muted";

/** A number field with a unit in front (€) or behind (years). */
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block min-w-0 space-y-1">
      <span className={labelClass}>{label}</span>
      {children}
    </label>
  );
}

function EuroInput({ label, value, onCommit }: { label: string; value: number; onCommit: (value: number) => void }) {
  return (
    <Field label={label}>
      <span className="relative block">
        <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted">
          €
        </span>
        <SettledNumberInput value={value} onCommit={onCommit} max={MAX_AMOUNT} placeholder="0" className="pl-7 text-base" />
      </span>
    </Field>
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
  const shownName = mix ? `Mix (${mix.parts.length} part${mix.parts.length === 1 ? "" : "s"})` : plan.investment.kind === "stock" ? `${current.name} (${plan.investment.id})` : current.name;

  return (
    <section aria-label="Calculator" className="relative grid grid-cols-2 gap-x-3 gap-y-4 rounded-xl border border-border bg-card p-4 sm:grid-cols-4">
      {capital.source === "holdings" ? (
        <div className="min-w-0 space-y-1">
          <p className={labelClass}>You have</p>
          <p className="py-1.5 text-base font-semibold">
            <Changed value={formatEur(capital.amount)} />
          </p>
          <p className="text-xs text-muted">Euro holdings, on My stocks</p>
        </div>
      ) : (
        <EuroInput label="You have" value={plan.invested} onCommit={(invested) => updatePlan({ invested })} />
      )}
      <EuroInput label="You add each month" value={plan.monthlyContribution} onCommit={(monthlyContribution) => updatePlan({ monthlyContribution })} />
      <div className="min-w-0 space-y-1">
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
      <Field label="For">
        <span className="relative block">
          <SettledNumberInput
            value={plan.years}
            onCommit={(years) => updatePlan({ years: Math.min(MAX_YEARS_AHEAD, Math.max(MIN_YEARS, Math.round(years))) })}
            max={MAX_YEARS_AHEAD}
            placeholder="20"
            className="pr-14 text-base"
          />
          <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-muted">
            years
          </span>
        </span>
      </Field>
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
      <div className="col-span-2 space-y-0.5 text-xs text-muted sm:col-span-4">
        {assumptionLines(current).map((line, index) => (
          <p key={index}>
            <Changed value={line} />
          </p>
        ))}
      </div>
    </section>
  );
}
