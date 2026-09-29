"use client";

import { useMemo } from "react";
import { InvestmentSummary } from "@/components/plan/investment-summary";
import { Card } from "@/components/ui/card";
import { Disclosure } from "@/components/ui/disclosure";
import { formatMoney, formatPercent, formatRate } from "@/lib/format";
import { INDEXES } from "@/lib/indexes";
import type { ResolvedInvestment } from "@/lib/investment";
import { DEFAULT_SIMULATIONS, DEFAULT_YEARS, successRate } from "@/lib/monte-carlo";
import { BASE_CURRENCY } from "@/lib/types";

export const WITHDRAWAL_CHOICES = [0.03, 0.04, 0.05, 0.07] as const;

interface SuccessCardProps {
  withdrawalRate: number;
  onWithdrawalRateChange: (rate: number) => void;
  investment: ResolvedInvestment;
  /** The active goal's capital and what it would pay per month at this rate. */
  goal: { amount: number; monthlyIncome: number };
}

const eur = (amount: number) => formatMoney(amount, BASE_CURRENCY, { decimals: 0 });

/** Where the simulated years come from, in one phrase. */
function historySource({ investment, name, period, proxyIndex }: ResolvedInvestment): string {
  const years = `${period[0]}–${period[1]}`;
  if (investment.kind === "custom") return `the S&P 500's real returns ${years}, scaled to your own rate`;
  if (investment.kind === "portfolio") return `your portfolio's mix of index real returns ${years}`;
  const index = INDEXES[proxyIndex ?? (investment.kind === "index" ? investment.index : "sp500")];
  const label = proxyIndex ? `the ${index.name}'s (the closest index to ${name})` : `the ${index.name}'s`;
  return `${label} real returns ${years} (${index.returnType}; ${index.sourceName})`;
}

/** One sentence: how often a withdrawal rate lasted 30 years, simulated with what the plan invests in. */
export function SuccessCard({ withdrawalRate, onWithdrawalRateChange, investment, goal }: SuccessCardProps) {
  const rate = useMemo(
    () => successRate({ withdrawalRate, returns: investment.returns }),
    [withdrawalRate, investment.returns],
  );
  return (
    <Card>
      <div className="space-y-4">
        <p className="text-2xl font-semibold leading-snug tracking-tight sm:text-3xl" aria-live="polite">
          At {formatRate(withdrawalRate)} per year, your money lasts {DEFAULT_YEARS} years in{" "}
          <span className="text-accent">{formatPercent(rate, { decimals: 0 })}</span> of historical scenarios.
        </p>
        <div role="radiogroup" aria-label="Yearly withdrawal" className="grid grid-cols-4 gap-2">
          {WITHDRAWAL_CHOICES.map((choice) => {
            const selected = Math.abs(choice - withdrawalRate) < 1e-9;
            return (
              <button
                key={choice}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => onWithdrawalRateChange(choice)}
                className={`rounded-full border py-2 text-sm font-medium tabular-nums ${
                  selected ? "border-accent bg-accent text-accent-foreground" : "border-border hover:bg-border/40"
                }`}
              >
                {formatRate(choice)}
              </button>
            );
          })}
        </div>
        <p className="text-sm tabular-nums">
          At your goal ({eur(goal.amount)}): <strong>≈ {eur(goal.monthlyIncome)}/month</strong> you could withdraw.
        </p>
        <div className="space-y-1 text-sm text-muted">
          <InvestmentSummary investment={investment} />
          <p>The future may be worse than the past.</p>
        </div>
        <Disclosure summary="Why can't I withdraw more?">
          <ul className="list-disc space-y-2 pl-5 text-sm">
            <li>The more you take out each year, the more often a bad run of markets empties the account.</li>
            <li>
              <strong>Bad years early hurt most.</strong> A crash just after you stop working does more damage than the
              same crash 20 years later.
            </li>
            <li>
              <strong>Currency:</strong> the histories are in US dollars; if you spend another currency, exchange rates
              change what your money buys.
            </li>
            <li>
              <strong>Local prices</strong> may rise faster than the inflation used here.
            </li>
          </ul>
          <p className="text-xs text-muted">
            How it&apos;s calculated: {DEFAULT_SIMULATIONS.toLocaleString("en-US")} simulated {DEFAULT_YEARS}-year
            periods, each year&apos;s return drawn at random from {historySource(investment)}. You take out the same
            amount each year, adjusted for inflation. All in stocks, no fees, no taxes.
          </p>
        </Disclosure>
      </div>
    </Card>
  );
}
