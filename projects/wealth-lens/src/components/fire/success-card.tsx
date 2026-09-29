"use client";

import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Disclosure } from "@/components/ui/disclosure";
import { formatPercent, formatRate } from "@/lib/format";
import { DEFAULT_SIMULATIONS, DEFAULT_YEARS, sp500RealReturns, successRate } from "@/lib/monte-carlo";

export const WITHDRAWAL_CHOICES = [0.03, 0.04, 0.05, 0.07] as const;

interface SuccessCardProps {
  withdrawalRate: number;
  onWithdrawalRateChange: (rate: number) => void;
}

const firstYear = sp500RealReturns.years[0].year;
const lastYear = sp500RealReturns.years.at(-1)?.year;

/** One sentence: how often a withdrawal rate lasted 30 years in history-based simulations. */
export function SuccessCard({ withdrawalRate, onWithdrawalRateChange }: SuccessCardProps) {
  const rate = useMemo(() => successRate({ withdrawalRate }), [withdrawalRate]);
  return (
    <Card>
      <div className="space-y-4">
        <p className="text-2xl font-semibold leading-snug tracking-tight sm:text-3xl" aria-live="polite">
          At {formatRate(withdrawalRate)}{" "}
          per year, your money lasts {DEFAULT_YEARS} years in{" "}
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
        <p className="text-sm text-muted">Based on past US stock returns. The future may be worse.</p>
        <Disclosure summary="Why can't I withdraw more?">
          <ul className="list-disc space-y-2 pl-5 text-sm">
            <li>The more you take out each year, the more often a bad run of markets empties the account.</li>
            <li>
              <strong>Bad years early hurt most.</strong> A crash just after you stop working does more damage than the
              same crash 20 years later.
            </li>
            <li>
              <strong>Currency:</strong> if you live in a country with another currency, exchange rates change what your
              money buys.
            </li>
            <li>
              <strong>Local prices</strong> may rise faster than the inflation used here.
            </li>
          </ul>
          <p className="text-xs text-muted">
            How it&apos;s calculated: {DEFAULT_SIMULATIONS.toLocaleString("en-US")} simulated {DEFAULT_YEARS}-year
            periods, each year&apos;s return drawn at random from the S&amp;P 500&apos;s real returns {firstYear}–
            {lastYear} (Robert Shiller, Yale). You take out the same amount each year, adjusted for inflation. All in
            stocks, no fees, no taxes.
          </p>
        </Disclosure>
      </div>
    </Card>
  );
}
