"use client";

import Link from "next/link";
import { useMemo } from "react";
import { HoldingChartRow } from "@/components/charts/holding-chart-card";
import { InstrumentRow } from "@/components/charts/instrument-row";
import { PricesUpdated } from "@/components/prices-updated";
import { HoldingsList } from "@/components/portfolio/holdings-list";
import { Card } from "@/components/ui/card";
import { Gain } from "@/components/ui/gain";
import { usePricedHoldings } from "@/hooks/use-plan";
import { setHoldings } from "@/lib/app-store";
import { summarizeByCurrency } from "@/lib/finance";
import { INSTRUMENTS } from "@/lib/market-data";
import { headlineGain } from "@/lib/plan";

const ETFS = INSTRUMENTS.filter((instrument) => instrument.kind === "etf");
const STOCKS = INSTRUMENTS.filter((instrument) => instrument.kind === "stock");

/** How much the holdings gained, in their own currencies (never converted). */
function GainHeadline({ gain }: { gain: ReturnType<typeof headlineGain> }) {
  if (!gain.main) return null;
  const { main, others } = gain;
  return (
    <section aria-label="Your gain" className="space-y-1">
      <p className="text-sm text-muted">{main.gain.absolute >= 0 ? "You've gained" : "You're down"}</p>
      <Gain gain={main.gain} currency={main.currency} decimals={0} className="block text-4xl font-semibold tracking-tight" />
      {others.map((summary) => (
        <p key={summary.currency} className="text-sm text-muted">
          Plus <Gain gain={summary.gain} currency={summary.currency} decimals={0} /> in {summary.currency}
        </p>
      ))}
      <p className="text-sm">
        <Link href="/" className="font-medium text-accent underline-offset-2 hover:underline">
          What it means for you
        </Link>
      </p>
    </section>
  );
}

/** "My stocks": what you hold and how it moved, plus the curated ETFs and stocks. */
export function StocksContent() {
  const holdings = usePricedHoldings();
  const gain = useMemo(() => headlineGain(summarizeByCurrency(holdings)), [holdings]);

  return (
    <div className="space-y-6">
      <GainHeadline gain={gain} />
      <HoldingsList holdings={holdings} onChange={setHoldings} />

      {holdings.length > 0 && (
        <Card title="How they moved">
          <p className="text-sm text-muted">Last 12 months. Tap one for its full chart.</p>
          <ul className="divide-y divide-border">
            {holdings.map((holding) => (
              <HoldingChartRow key={holding.id} holding={holding} />
            ))}
          </ul>
        </Card>
      )}

      <Card title="ETFs and big stocks">
        <p className="text-sm text-muted">Tap one for its chart, or to use it as your investment.</p>
        <h3 className="mt-3 text-xs font-medium uppercase tracking-wide text-muted">ETFs</h3>
        <ul className="divide-y divide-border">
          {ETFS.map((instrument) => (
            <InstrumentRow key={instrument.id} instrument={instrument} />
          ))}
        </ul>
        <h3 className="mt-3 text-xs font-medium uppercase tracking-wide text-muted">Stocks</h3>
        <ul className="divide-y divide-border">
          {STOCKS.map((instrument) => (
            <InstrumentRow key={instrument.id} instrument={instrument} />
          ))}
        </ul>
      </Card>

      <PricesUpdated />
    </div>
  );
}
