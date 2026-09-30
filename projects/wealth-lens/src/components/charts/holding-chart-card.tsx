"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useAppState } from "@/hooks/use-app";
import { setUploadedPrices } from "@/lib/app-store";
import { averageCost } from "@/lib/finance";
import { formatMoney, formatPercent, formatPrice } from "@/lib/format";
import { instrumentForHolding, MARKET } from "@/lib/market-data";
import { parsePriceCsv, summarizeSeries, type PricePoint } from "@/lib/prices";
import { lastDays, periodChange } from "@/lib/sparkline";
import type { Holding } from "@/lib/types";
import { ChartRow } from "./chart-row";
import { InstrumentFigures } from "./instrument-figures";
import { PriceChart } from "./price-chart";
import { Sparkline } from "./sparkline";
import { YearStrip } from "./year-changes";

const PERIOD_DAYS = 365;

/**
 * One holding in the My stocks list. When its ticker is on the curated list,
 * the figures the daily job worked out (never the closes themselves); when
 * the user uploaded a CSV of prices, the full chart of their own file. The
 * app never asks a price source.
 */
export function HoldingChartRow({ holding }: { holding: Holding }) {
  const uploaded = useAppState().uploadedPrices[holding.ticker] ?? null;
  const setUploaded = (prices: Parameters<typeof setUploadedPrices>[1]) => setUploadedPrices(holding.ticker, prices);
  const instrument = instrumentForHolding(holding.ticker, holding.currency);
  const market = instrument ? MARKET.prices[instrument.id] : undefined;

  const recent = uploaded ? lastDays(uploaded.points, PERIOD_DAYS) : null;
  const change = recent ? periodChange(recent) : (market?.change1y ?? null);
  const subtitle = uploaded ? "your prices" : instrument && market ? instrument.name : "no downloaded prices";
  const visual =
    recent && recent.length > 1 ? (
      <Sparkline closes={recent.map((point) => point.close)} rising={(change ?? 0) >= 0} />
    ) : (
      <YearStrip years={market?.stats?.years} />
    );

  return (
    <ChartRow title={holding.ticker} subtitle={subtitle} visual={visual} change={change}>
      {uploaded ? (
        <>
          <PriceChart points={uploaded.points} averageCost={averageCost(holding)} label={`Daily closing prices of ${holding.ticker} with a line at your average cost`} />
          <Summary points={uploaded.points} holding={holding} />
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs text-muted">Prices from your file {uploaded.fileName}.</p>
            {market && (
              <Button size="sm" variant="ghost" onClick={() => setUploaded(null)}>
                Use the downloaded figures
              </Button>
            )}
          </div>
        </>
      ) : market ? (
        <InstrumentFigures prices={market} averageCost={averageCost(holding)} />
      ) : (
        <p className="rounded-lg border border-border bg-background px-3 py-2 text-sm">
          No downloaded prices for {holding.ticker}. Upload a CSV with its daily prices to see a chart.
        </p>
      )}
      {!market && <UploadPrices ticker={holding.ticker} onLoaded={(fileName, points) => setUploaded({ fileName, points })} />}
    </ChartRow>
  );
}

function Summary({ points, holding }: { points: readonly PricePoint[]; holding: Holding }) {
  const average = averageCost(holding);
  const summary = summarizeSeries(points, average);
  if (!summary) return null;
  const { last, vsAverageCost } = summary;
  if (vsAverageCost === null || average === null) {
    return <p className="text-sm">Last close {formatPrice(last.close)}.</p>;
  }
  return (
    <p className="text-sm">
      Now {formatPrice(last.close)}:{" "}
      <strong className={vsAverageCost >= 0 ? "text-positive" : "text-negative"}>
        {formatPercent(Math.abs(vsAverageCost))} {vsAverageCost >= 0 ? "above" : "below"}
      </strong>{" "}
      what you paid ({formatMoney(average, holding.currency)}, dashed line).
    </p>
  );
}

function UploadPrices({ ticker, onLoaded }: { ticker: string; onLoaded: (fileName: string, points: PricePoint[]) => unknown }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handle = async (file: File) => {
    let text: string;
    try {
      text = await file.text();
    } catch {
      setMessage(`Could not read ${file.name}.`);
      return;
    }
    const parsed = parsePriceCsv(text);
    if (!parsed.ok) {
      setMessage(`${file.name}: ${parsed.error}`);
      return;
    }
    onLoaded(file.name, parsed.points);
    setMessage(parsed.skippedRows > 0 ? `Loaded. ${parsed.skippedRows} rows skipped.` : null);
  };

  return (
    <div className="space-y-1">
      <input
        ref={inputRef}
        type="file"
        accept=".csv,text/csv,text/plain"
        className="sr-only"
        // Opened by the visible button next to it: one stop for Tab, not two.
        tabIndex={-1}
        aria-label={`Upload a price CSV for ${ticker}`}
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void handle(file);
          event.target.value = "";
        }}
      />
      <Button size="sm" onClick={() => inputRef.current?.click()}>
        Upload prices (CSV)
      </Button>
      <p className="text-xs text-muted">A file with a date and a close column. It stays in your browser.</p>
      {message && <p className="text-xs">{message}</p>}
    </div>
  );
}
