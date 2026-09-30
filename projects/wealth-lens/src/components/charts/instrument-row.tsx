"use client";

import { Check } from "lucide-react";
import Link from "next/link";
import { useI18n } from "@/components/i18n";
import { Button } from "@/components/ui/button";
import { useAppState } from "@/hooks/use-app";
import { setInvestment } from "@/lib/app-store";
import { INDEXES } from "@/lib/indexes";
import { MARKET, type Instrument } from "@/lib/market-data";
import type { Investment } from "@/lib/types";
import { localePath } from "@/i18n/locales";
import { ChartRow } from "./chart-row";
import { InstrumentFigures } from "./instrument-figures";
import { YearStrip } from "./year-changes";

/** The investment a plan gets from an ETF: the index it tracks. A single stock is never projected on its own. */
export function investmentFor(instrument: Instrument): Investment | null {
  return instrument.kind === "etf" ? { kind: "asset", asset: instrument.index } : null;
}

function isChosen(current: Investment, instrument: Instrument): boolean {
  const investment = investmentFor(instrument);
  return investment !== null && JSON.stringify(current) === JSON.stringify(investment);
}

/** One ETF or stock of the curated list; opening it shows its figures and lets the plan use it. */
export function InstrumentRow({ instrument }: { instrument: Instrument }) {
  const prices = MARKET.prices[instrument.id];
  return (
    <ChartRow title={instrument.id} subtitle={instrument.name} visual={<YearStrip years={prices?.stats?.years} />} change={prices?.change1y ?? null}>
      <InstrumentPanel instrument={instrument} />
    </ChartRow>
  );
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
          <Link href={localePath("/", locale)} className="text-accent underline-offset-2 hover:underline">
            {t.seeWhat}
          </Link>
        </p>
      ) : (
        <Button variant="primary" onClick={() => setInvestment(investment)}>
          {t.use}
        </Button>
      )}
    </>
  );
}
