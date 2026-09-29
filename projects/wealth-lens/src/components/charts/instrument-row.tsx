"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAppState } from "@/hooks/use-app";
import { useHistory } from "@/hooks/use-history";
import { updatePlan } from "@/lib/app-store";
import { formatDayMonth, formatMoney, formatPercent, formatRate } from "@/lib/format";
import { INDEXES } from "@/lib/indexes";
import { MARKET, type Instrument } from "@/lib/market-data";
import type { Investment } from "@/lib/types";
import { ChartRow } from "./chart-row";
import { PriceChart } from "./price-chart";

/** The investment a plan gets from an instrument: an ETF's index, or the stock itself. */
export function investmentFor(instrument: Instrument): Investment {
  return instrument.kind === "etf" ? { kind: "index", index: instrument.index } : { kind: "stock", id: instrument.id };
}

function isChosen(current: Investment, instrument: Instrument): boolean {
  return JSON.stringify(current) === JSON.stringify(investmentFor(instrument));
}

/** One ETF or stock of the curated list; opening it shows its chart and lets the plan use it. */
export function InstrumentRow({ instrument }: { instrument: Instrument }) {
  const prices = MARKET.prices[instrument.id];
  return (
    <ChartRow title={instrument.id} subtitle={instrument.name} closes={prices?.spark ?? []} change={prices?.change1y ?? null}>
      <InstrumentPanel instrument={instrument} />
    </ChartRow>
  );
}

function InstrumentPanel({ instrument }: { instrument: Instrument }) {
  const { plan } = useAppState();
  const prices = MARKET.prices[instrument.id];
  const history = useHistory(prices ? instrument.id : null);
  const index = INDEXES[instrument.index];
  const chosen = isChosen(plan.investment, instrument);

  return (
    <>
      {history.status === "ready" ? (
        <PriceChart points={history.points} averageCost={null} label={`Daily closing prices of ${instrument.name}`} />
      ) : history.status === "loading" ? (
        <div className="h-64 animate-pulse rounded-lg bg-border/40" aria-label="Loading prices" />
      ) : (
        <p className="rounded-lg border border-border bg-background px-3 py-2 text-sm">
          {prices ? "The price history could not be loaded. Reload the page to try again." : "No prices downloaded yet."}
        </p>
      )}

      {prices && (
        <p className="text-sm">
          Last close {formatMoney(prices.close, prices.currency)} on {formatDayMonth(prices.date)}.
          {prices.growth && (
            <>
              {" "}
              Grew <strong className="tabular-nums">{formatPercent(prices.growth.perYear, { signed: true })} a year</strong>{" "}
              since {prices.growth.from.slice(0, 4)} (price, before inflation):{" "}
              <em className="not-italic text-muted">past, not a forecast.</em>
            </>
          )}
        </p>
      )}

      <p className="text-sm text-muted">
        {instrument.kind === "etf"
          ? `Tracks the ${index.name}: ${formatRate(index.averageReturn)} a year after inflation on average, ${index.firstYear}–${index.lastYear}.`
          : `As your investment it is projected with the ${index.name}'s history (${formatRate(index.averageReturn)} a year after inflation), not with ${instrument.name}'s own past.`}
      </p>

      {chosen ? (
        <p className="text-sm font-medium text-positive" aria-live="polite">
          ✓ Your plan grows like {instrument.kind === "etf" ? `the ${index.name}` : instrument.name}.{" "}
          <Link href="/" className="text-accent underline-offset-2 hover:underline">
            See your plan →
          </Link>
        </p>
      ) : (
        <Button variant="primary" onClick={() => updatePlan({ investment: investmentFor(instrument) })}>
          Use as my investment
        </Button>
      )}
    </>
  );
}
