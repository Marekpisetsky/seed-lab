"use client";

import { Check } from "lucide-react";
import { useI18n } from "@/components/i18n";
import { Button } from "@/components/ui/button";
import { IntentLink } from "@/components/ui/intent-link";
import { useAppState } from "@/hooks/use-app";
import { setInvestment } from "@/lib/app-store";
import { INDEXES } from "@/lib/indexes";
import { lineChange } from "@/lib/lines";
import { MARKET, type Instrument, type InstrumentPrices } from "@/lib/market-data";
import type { Investment } from "@/lib/types";
import { localePath } from "@/i18n/locales";
import { ChartRow } from "./chart-row";
import { InstrumentFigures } from "./instrument-figures";
import { PriceLines } from "./price-lines";
import { Sparkline } from "./sparkline";

/** The investment a plan gets from an ETF: the index it tracks. A single stock is never projected on its own. */
export function investmentFor(instrument: Instrument): Investment | null {
  return instrument.kind === "etf" ? { kind: "asset", asset: instrument.index } : null;
}

function isChosen(current: Investment, instrument: Instrument): boolean {
  const investment = investmentFor(instrument);
  return investment !== null && JSON.stringify(current) === JSON.stringify(investment);
}

/**
 * A row's change over a year and its small picture: the last year's weekly
 * line when the data has it (the same change the chart's 1Y shows), else
 * the change from the latest close a year back.
 */
export function rowSummary(prices: InstrumentPrices | undefined): { change: number | null; visual: React.ReactNode } {
  const line = prices?.line1y;
  if (!line) return { change: prices?.change1y ?? null, visual: null };
  const change = lineChange(line);
  return { change, visual: <Sparkline closes={line} rising={change >= 0} /> };
}

/** One ETF or stock of the curated list; opening it shows how it moved and lets the plan use a fund. */
export function InstrumentRow({ instrument }: { instrument: Instrument }) {
  const { change, visual } = rowSummary(MARKET.prices[instrument.id]);
  return (
    <ChartRow title={instrument.id} subtitle={instrument.name} visual={visual} change={change}>
      <InstrumentPanel instrument={instrument} />
    </ChartRow>
  );
}

/** Under a stock's line: it is only its past. */
export function HistoryOnly({ instrument }: { instrument: Instrument }) {
  const { m } = useI18n();
  return instrument.kind === "stock" ? <p className="text-sm font-medium">{m.stocks.historyOnly}</p> : null;
}

function InstrumentPanel({ instrument }: { instrument: Instrument }) {
  const { locale, m, f } = useI18n();
  const t = m.stocks;
  const { plan } = useAppState();
  const prices = MARKET.prices[instrument.id];
  const index = INDEXES[instrument.index];
  const period = `${index.firstYear}–${index.lastYear}`;
  const name = m.assets.inSentence[instrument.index];
  const chosen = isChosen(plan.investment, instrument);
  const investment = investmentFor(instrument);

  return (
    <>
      <PriceLines instrument={instrument} />
      <HistoryOnly instrument={instrument} />
      {prices ? <InstrumentFigures prices={prices} /> : <p className="rounded-lg border border-border bg-background px-3 py-2 text-sm">{t.noPrices}</p>}

      <p className="text-sm text-muted">
        {instrument.kind === "etf"
          ? t.tracks(name, f.rate(index.averageReturn), period, index.priceOnly)
          : t.stockNote(name, f.rate(index.averageReturn), period)}
      </p>

      {!investment ? null : chosen ? (
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-medium" aria-live="polite">
          <span className="inline-flex items-center gap-1 text-positive">
            <Check aria-hidden="true" className="size-4" />
            {t.chosen(name)}
          </span>
          <IntentLink href={localePath("/", locale)} className="text-accent underline-offset-2 hover:underline">
            {t.seeWhat}
          </IntentLink>
        </p>
      ) : (
        <Button variant="primary" onClick={() => setInvestment(investment)}>
          {t.use}
        </Button>
      )}
    </>
  );
}
