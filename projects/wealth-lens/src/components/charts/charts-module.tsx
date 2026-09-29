"use client";

import Link from "next/link";
import { FirstSteps } from "@/components/onboarding/first-steps";
import { PricesUpdated } from "@/components/prices-updated";
import { Card } from "@/components/ui/card";
import { useAppState } from "@/hooks/use-app";
import { hasStarted } from "@/lib/app-store";
import { INSTRUMENTS } from "@/lib/market-data";
import { HoldingChartRow } from "./holding-chart-card";
import { InstrumentRow } from "./instrument-row";

const ETFS = INSTRUMENTS.filter((instrument) => instrument.kind === "etf");
const STOCKS = INSTRUMENTS.filter((instrument) => instrument.kind === "stock");

export function ChartsModule() {
  const state = useAppState();
  if (!hasStarted(state)) return <FirstSteps />;
  return <ChartsContent />;
}

function ChartsContent() {
  const { holdings } = useAppState();

  return (
    <div className="space-y-6">
      <Card title="Your holdings">
        {holdings.length === 0 ? (
          <p className="text-sm text-muted">
            <Link href="/" className="font-medium text-accent underline-offset-2 hover:underline">
              Add your holdings
            </Link>{" "}
            to chart them here.
          </p>
        ) : (
          <>
            <p className="text-sm text-muted">Last 12 months. Tap one for its full chart.</p>
            <ul className="divide-y divide-border">
              {holdings.map((holding) => (
                <HoldingChartRow key={holding.id} holding={holding} />
              ))}
            </ul>
          </>
        )}
      </Card>

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
