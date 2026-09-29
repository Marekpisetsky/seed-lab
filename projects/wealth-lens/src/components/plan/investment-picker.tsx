"use client";

import { useMemo } from "react";
import { PercentInput } from "@/components/ui/form";
import { useAppState } from "@/hooks/use-app";
import { usePricedHoldings } from "@/hooks/use-plan";
import { updatePlan } from "@/lib/app-store";
import { formatPercent, formatRate } from "@/lib/format";
import { INDEXES, INDEX_IDS } from "@/lib/indexes";
import { portfolioMix, resolveInvestment, type PortfolioMix } from "@/lib/investment";
import { instrumentById } from "@/lib/market-data";
import type { Investment } from "@/lib/types";

interface Option {
  key: string;
  label: string;
  detail: string;
  rate: number;
  investment: Investment;
}

const sameInvestment = (a: Investment, b: Investment) => JSON.stringify(a) === JSON.stringify(b);

/** "80% S&P 500 · 20% World". */
export function mixLabel(mix: PortfolioMix): string {
  return mix.weights.map(({ index, weight }) => `${formatPercent(weight, { decimals: 0 })} ${INDEXES[index].name}`).join(" · ");
}

/**
 * What the plan grows like: one of the three indexes, the user's own
 * portfolio (weighted by value), a stock chosen on Charts, or a typed rate.
 */
export function InvestmentPicker({ onChosen }: { onChosen?: () => void }) {
  const { plan } = useAppState();
  const holdings = usePricedHoldings();
  const mix = useMemo(() => portfolioMix(holdings), [holdings]);
  // What is really used: a portfolio with nothing priced in euros falls back to the default index.
  const current = useMemo(() => resolveInvestment(plan.investment, holdings).investment, [plan.investment, holdings]);

  const options: Option[] = INDEX_IDS.map((index) => ({
    key: index,
    label: INDEXES[index].name,
    detail: `${INDEXES[index].etf} · ${INDEXES[index].firstYear}–${INDEXES[index].lastYear}`,
    rate: INDEXES[index].averageReturn,
    investment: { kind: "index", index },
  }));
  if (mix.weights.length > 0) {
    options.push({
      key: "portfolio",
      label: "My portfolio",
      detail: mixLabel(mix),
      rate: resolveInvestment({ kind: "portfolio" }, holdings).realReturn,
      investment: { kind: "portfolio" },
    });
  }
  const stock = plan.investment.kind === "stock" ? instrumentById(plan.investment.id) : undefined;
  if (stock) {
    options.push({
      key: `stock-${stock.id}`,
      label: stock.name,
      detail: `projected with the ${INDEXES[stock.index].name}`,
      rate: INDEXES[stock.index].averageReturn,
      investment: { kind: "stock", id: stock.id },
    });
  }

  const choose = (investment: Investment) => {
    updatePlan({ investment });
    onChosen?.();
  };

  return (
    <div className="space-y-2 rounded-lg border border-border bg-background p-3">
      <p className="text-sm font-medium" id="investment-picker-label">
        What do you invest in?
      </p>
      <div role="radiogroup" aria-labelledby="investment-picker-label" className="space-y-1">
        {options.map((option) => {
          const selected = sameInvestment(option.investment, current);
          return (
            <button
              key={option.key}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => choose(option.investment)}
              className={`flex w-full items-center gap-3 rounded-md border px-3 py-2 text-left ${
                selected ? "border-accent bg-accent/10" : "border-border hover:bg-border/40"
              }`}
            >
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium">{option.label}</span>
                <span className="block truncate text-xs text-muted">{option.detail}</span>
              </span>
              <span className="text-sm font-semibold tabular-nums">{formatRate(option.rate)}</span>
            </button>
          );
        })}
        <div
          className={`flex items-center gap-3 rounded-md border px-3 py-2 ${
            plan.investment.kind === "custom" ? "border-accent bg-accent/10" : "border-border"
          }`}
        >
          <label htmlFor="own-rate" className="min-w-0 flex-1 text-sm font-medium">
            My own rate
            <span className="block text-xs font-normal text-muted">% a year after inflation</span>
          </label>
          <PercentInput
            id="own-rate"
            key={plan.investment.kind === "custom" ? plan.investment.realReturn : "none"}
            value={plan.investment.kind === "custom" ? plan.investment.realReturn : null}
            placeholder="5"
            min={-5}
            max={15}
            onCommit={(value) => value !== null && choose({ kind: "custom", realReturn: value })}
            className="w-20 text-right"
          />
        </div>
      </div>
      <p className="text-xs text-muted">
        Average yearly growth after inflation over each index&apos;s history. Past, not a promise.
      </p>
    </div>
  );
}
