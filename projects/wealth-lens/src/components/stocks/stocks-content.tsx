"use client";

import Link from "next/link";
import { useMemo } from "react";
import { HoldingChartRow } from "@/components/charts/holding-chart-card";
import { InstrumentRow } from "@/components/charts/instrument-row";
import { useI18n } from "@/components/i18n";
import { PricesUpdated } from "@/components/prices-updated";
import { HoldingsList } from "@/components/portfolio/holdings-list";
import { Card } from "@/components/ui/card";
import { Gain } from "@/components/ui/gain";
import { usePricedHoldings } from "@/hooks/use-plan";
import { localePath } from "@/i18n/locales";
import { setHoldings } from "@/lib/app-store";
import { summarizeByCurrency } from "@/lib/finance";
import { INSTRUMENTS } from "@/lib/market-data";
import { headlineGain } from "@/lib/plan";

const ETFS = INSTRUMENTS.filter((instrument) => instrument.kind === "etf");
const STOCKS = INSTRUMENTS.filter((instrument) => instrument.kind === "stock");

/** How much the holdings gained, in their own currencies (never converted). */
function GainHeadline({ gain }: { gain: ReturnType<typeof headlineGain> }) {
  const { locale, m } = useI18n();
  if (!gain.main) return null;
  const { main, others } = gain;
  return (
    <section aria-label={m.stocks.gainLabel} className="space-y-1">
      <p className="text-sm text-muted">{main.gain.absolute >= 0 ? m.stocks.gained : m.stocks.down}</p>
      <Gain gain={main.gain} currency={main.currency} decimals={0} className="block text-4xl font-extrabold tracking-tight" />
      {others.map((summary) => {
        const [before, after] = m.stocks.plusIn(summary.currency);
        return (
          <p key={summary.currency} className="text-sm text-muted">
            {before} <Gain gain={summary.gain} currency={summary.currency} decimals={0} /> {after}
          </p>
        );
      })}
      <p className="text-sm">
        <Link href={localePath("/", locale)} className="font-medium text-accent underline-offset-2 hover:underline">
          {m.stocks.whatItMeans}
        </Link>
      </p>
    </section>
  );
}

/** "My stocks": what you hold and how it moved, plus the curated ETFs and stocks. */
export function StocksContent() {
  const { m } = useI18n();
  const t = m.stocks;
  const holdings = usePricedHoldings();
  const gain = useMemo(() => headlineGain(summarizeByCurrency(holdings)), [holdings]);

  return (
    <div className="space-y-6">
      <GainHeadline gain={gain} />
      <HoldingsList holdings={holdings} onChange={setHoldings} />

      {holdings.length > 0 && (
        <Card title={t.moved}>
          <p className="text-sm text-muted">{t.tapHint}</p>
          <ul className="divide-y divide-border">
            {holdings.map((holding) => (
              <HoldingChartRow key={holding.id} holding={holding} />
            ))}
          </ul>
        </Card>
      )}

      <Card title={t.listTitle}>
        <p className="text-sm text-muted">{t.listHint}</p>
        <h3 className="mt-3 text-xs font-medium uppercase tracking-wide text-muted">{t.etfs}</h3>
        <ul className="divide-y divide-border">
          {ETFS.map((instrument) => (
            <InstrumentRow key={instrument.id} instrument={instrument} />
          ))}
        </ul>
        <h3 className="mt-3 text-xs font-medium uppercase tracking-wide text-muted">{t.stocks}</h3>
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
