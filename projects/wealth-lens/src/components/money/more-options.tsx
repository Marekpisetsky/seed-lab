"use client";

import { ChevronDown, RotateCcw } from "lucide-react";
import { useCallback, useId, useRef, useState } from "react";
import { useI18n } from "@/components/i18n";
import { Changed } from "@/components/ui/changed";
import { SettledNumberInput } from "@/components/ui/form";
import { useAppState } from "@/hooks/use-app";
import { byCountryName, countryName } from "@/i18n/countries";
import { investmentName } from "@/i18n/investment-text";
import { resetAssumptions, setAssumptions, setInvestment, setPricesOf } from "@/lib/app-store";
import { historicalRiskText, optionsChanged, upsAndDownsExample } from "@/lib/assumptions";
import { costOfLiving, referenceInflation } from "@/lib/cost-of-living";
import type { ResolvedInvestment } from "@/lib/investment";
import { mixPartKey, mixStock } from "@/lib/mix";
import { portfolioAllocation } from "@/lib/portfolio";
import type { Holding, Investment } from "@/lib/types";
import { MAX_VOLATILITY } from "@/lib/validation";
import { HowTheSimulationsWork } from "./explainers";
import { InvestmentPicker, type PickChoice } from "./investment-picker";
import { MixEditor } from "./mix-editor";
import { PortfolioEditor } from "./portfolio-editor";

const labelClass = "block text-sm font-medium";
/** Percent with at most two decimals, as a field shows it. */
const asPercent = (fraction: number) => Number((fraction * 100).toFixed(2));
/** A typed figure that is the standard one, to the hundredth of a percent, is not a change. */
const same = (a: number, b: number) => Math.abs(a - b) < 0.00005;

function PercentField({
  label,
  prefix,
  value,
  min,
  max,
  onCommit,
  hint,
}: {
  label: string;
  /** Shown before the figure, e.g. "±". */
  prefix?: string;
  value: number;
  min: number;
  max: number;
  onCommit: (fraction: number) => void;
  hint?: React.ReactNode;
}) {
  const id = useId();
  return (
    <div className="min-w-0 space-y-1">
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>
      <span className="relative block max-w-48">
        <SettledNumberInput
          id={id}
          value={asPercent(value)}
          min={min * 100}
          max={max * 100}
          onCommit={(percent) => onCommit(percent / 100)}
          aria-describedby={hint ? `${id}-hint` : undefined}
          className={`pr-7 text-base ${prefix ? "pl-7" : ""}`}
        />
        {prefix && (
          <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted">
            {prefix}
          </span>
        )}
        <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-muted">
          %
        </span>
      </span>
      {hint && (
        <div id={`${id}-hint`} className="space-y-1 text-sm text-muted">
          {hint}
        </div>
      )}
    </div>
  );
}

/** The picker's key for the plan's choice: "asset:sp500", "portfolio", "mix", "custom". */
function keyOf(investment: Investment): string {
  return investment.kind === "asset" ? `asset:${investment.asset}` : investment.kind;
}

/** A choice from the picker as the plan's investment; "A mix…" starts from what is chosen now. */
function investmentFor(choice: PickChoice, current: Investment): Investment {
  switch (choice.kind) {
    case "asset":
    case "portfolio":
    case "custom":
      return choice;
    // Offered only for a mix's parts.
    case "stock":
      return current;
    case "mix": {
      if (current.kind === "mix") return current;
      return { kind: "mix", parts: [{ asset: current.kind === "asset" ? current.asset : "sp500", weight: 100 }], rebalance: false };
    }
  }
}

const EMPTY: readonly string[] = [];

/**
 * "More options", folded under the calculator and loaded when opened:
 * any other investment (an index, gold, a mix of your own, My portfolio),
 * how much it can go up or down, and how fast prices rise. A changed
 * figure marks it "Custom"; "Reset to standard" brings the standard ones
 * back.
 */
export function MoreOptions({ current, priced }: { current: ResolvedInvestment; priced: readonly Holding[] }) {
  const i18n = useI18n();
  const { m, f } = i18n;
  const t = m.assumptions;
  const { plan } = useAppState();
  const [picker, setPicker] = useState<{ mode: "choose" | "add"; top: number } | null>(null);
  const frame = useRef<HTMLDivElement>(null);
  // What opened the list gets the focus back when it closes by a choice or Escape.
  const opener = useRef<HTMLElement | null>(null);
  const close = useCallback((refocus = false) => {
    setPicker(null);
    const element = opener.current;
    if (refocus && element) requestAnimationFrame(() => element.isConnected && element.focus());
  }, []);
  const open = (mode: "choose" | "add", anchor: HTMLElement) => {
    opener.current = anchor;
    const box = frame.current?.getBoundingClientRect();
    const target = anchor.getBoundingClientRect();
    setPicker({ mode, top: target.bottom - (box?.top ?? 0) + 4 });
  };
  const mix = plan.investment.kind === "mix" ? plan.investment : null;
  const holdingsCount = portfolioAllocation(priced).entries.length;
  const { standard, inflation } = current;
  const reference = referenceInflation(current.pricesOf);
  const isCustomGrowth = current.investment.kind === "custom";
  const changed = optionsChanged(plan);
  const historically = historicalRiskText(current, i18n);

  return (
    <div ref={frame} className="relative space-y-5 rounded-lg bg-background p-3">
      <div className="space-y-2">
        <p className={labelClass}>{m.more.other}</p>
        <button
          type="button"
          aria-haspopup="listbox"
          aria-expanded={picker?.mode === "choose"}
          // The list closes on a press outside it; this button toggles it instead.
          onPointerDown={(event) => event.nativeEvent.stopPropagation()}
          onClick={(event) => (picker ? close() : open("choose", event.currentTarget))}
          className="flex min-h-11 w-full max-w-sm items-center justify-between gap-1 rounded-md border border-border bg-card px-3 py-2 text-left text-base"
        >
          <span className="min-w-0 truncate">
            <Changed value={investmentName(current, i18n)} />
          </span>
          <ChevronDown aria-hidden="true" className="size-4 shrink-0 text-muted" />
        </button>
      </div>
      {mix && <MixEditor mix={mix} onAddPart={(anchor) => open("add", anchor)} />}
      {current.investment.kind === "portfolio" && current.allocation && <PortfolioEditor allocation={current.allocation} model={current.model} />}

      <div className="space-y-2">
        <h3 className="text-sm font-semibold">{m.more.upsTitle}</h3>
        <PercentField
          label={t.upsAndDowns}
          prefix="±"
          value={current.volatility}
          min={0}
          max={MAX_VOLATILITY}
          onCommit={(volatility) => setAssumptions({ volatility: same(volatility, standard.volatility) && !isCustomGrowth ? null : volatility })}
          hint={
            <>
              <p>
                <Changed value={upsAndDownsExample(current.volatility, i18n)} />{" "}
                {isCustomGrowth
                  ? t.hintVolCustom(f.percent(standard.volatility, { decimals: 0 }))
                  : standard.volatility > 0
                    ? t.hintVol(f.percent(standard.volatility, { decimals: 1 }))
                    : t.hintVolNone}
              </p>
              {historically && (
                <p>
                  <Changed value={historically} />
                </p>
              )}
            </>
          }
        />
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold">{m.more.pricesTitle}</h3>
        <label className="block max-w-sm min-w-0 space-y-1">
          <span className={labelClass}>{t.risingIn}</span>
          <select
            value={current.pricesOf}
            onChange={(event) => setPricesOf(event.target.value)}
            className="min-h-11 w-full rounded-md border border-border bg-card px-3 py-2 text-base outline-none focus:border-accent focus:ring-2 focus:ring-accent/30"
          >
            {byCountryName(costOfLiving.countries, i18n).map((country) => (
              <option key={country.code} value={country.code}>
                {countryName(country.code, i18n)}
              </option>
            ))}
          </select>
        </label>
        <PercentField
          label={t.pricesRise}
          value={inflation}
          min={-0.1}
          max={0.5}
          onCommit={(rate) => setAssumptions({ inflation: same(rate, reference.rate) ? null : rate })}
          hint={<p>{(/average/i.test(reference.basis) ? t.hintAverage : t.hintTarget)(f.rate(reference.rate), reference.asOf)}</p>}
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <HowTheSimulationsWork />
        {changed && (
          <button
            type="button"
            onClick={resetAssumptions}
            className="inline-flex min-h-11 items-center gap-1 rounded-md px-3 py-1 text-sm font-medium text-accent hover:bg-accent/10"
          >
            <RotateCcw aria-hidden="true" className="size-4" /> {t.reset}
          </button>
        )}
      </div>

      {picker && (
        <InvestmentPicker
          top={picker.top}
          label={picker.mode === "add" ? m.calculator.addToMix : m.more.other}
          selected={picker.mode === "add" ? null : keyOf(plan.investment)}
          hasPortfolio={picker.mode === "choose" && holdingsCount > 0}
          holdingsCount={holdingsCount}
          onlyAssets={picker.mode === "add"}
          exclude={picker.mode === "add" && mix ? mix.parts.map(mixPartKey) : EMPTY}
          onClose={close}
          onPick={(choice) => {
            if (picker.mode === "add" && mix) {
              const stock = choice.kind === "stock" ? mixStock(choice.stock) : null;
              if (choice.kind === "asset") setInvestment({ ...mix, parts: [...mix.parts, { asset: choice.asset, weight: 0 }] });
              if (stock) setInvestment({ ...mix, parts: [...mix.parts, { asset: stock.index, weight: 0, stock: stock.id }] });
            } else {
              setInvestment(investmentFor(choice, plan.investment));
            }
            close(true);
          }}
        />
      )}
    </div>
  );
}
