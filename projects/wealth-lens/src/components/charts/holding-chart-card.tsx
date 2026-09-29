"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { usePersistentStore } from "@/hooks/use-persistent-store";
import { useHistory } from "@/hooks/use-history";
import { averageCost } from "@/lib/finance";
import { formatMoney, formatPercent, formatPrice } from "@/lib/format";
import { instrumentForHolding, MARKET } from "@/lib/market-data";
import { parsePriceCsv, summarizeSeries, type PricePoint } from "@/lib/prices";
import { lastDays, periodChange } from "@/lib/sparkline";
import { uploadedPricesStore } from "@/lib/stores";
import type { Holding } from "@/lib/types";
import { ChartRow } from "./chart-row";
import { PriceChart } from "./price-chart";

const PERIOD_DAYS = 365;

/**
 * One holding in the Charts list. Prices come from the daily downloaded
 * data when the ticker is on the curated list, or from a CSV the user
 * uploads; the app never asks a price source.
 */
export function HoldingChartRow({ holding }: { holding: Holding }) {
  const [uploaded, setUploaded] = usePersistentStore(uploadedPricesStore(holding.ticker));
  const instrument = instrumentForHolding(holding.ticker, holding.currency);
  const market = instrument ? MARKET.prices[instrument.id] : undefined;

  const recent = uploaded ? lastDays(uploaded.points, PERIOD_DAYS) : null;
  const closes = recent ? recent.map((point) => point.close) : (market?.spark ?? []);
  const change = recent ? periodChange(recent) : (market?.change1y ?? null);
  const subtitle = uploaded ? "your prices" : instrument && market ? instrument.name : "no downloaded prices";

  return (
    <ChartRow title={holding.ticker} subtitle={subtitle} closes={closes} change={change}>
      <HoldingChart holding={holding} historyId={market && instrument ? instrument.id : null} uploaded={uploaded?.points ?? null} />
      {uploaded ? (
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-xs text-muted">Prices from your file {uploaded.fileName}.</p>
          {market && (
            <Button size="sm" variant="ghost" onClick={() => setUploaded(null)}>
              Use downloaded prices
            </Button>
          )}
        </div>
      ) : null}
      {!market && (
        <UploadPrices
          ticker={holding.ticker}
          onLoaded={(fileName, points) => setUploaded({ fileName, points })}
        />
      )}
    </ChartRow>
  );
}

function HoldingChart({
  holding,
  historyId,
  uploaded,
}: {
  holding: Holding;
  historyId: string | null;
  uploaded: readonly PricePoint[] | null;
}) {
  const history = useHistory(uploaded ? null : historyId);
  const points = uploaded ?? (history.status === "ready" ? history.points : null);
  if (points) {
    return (
      <>
        <PriceChart
          points={points}
          averageCost={averageCost(holding)}
          label={`Daily closing prices of ${holding.ticker} with a line at your average cost`}
        />
        <Summary points={points} holding={holding} />
      </>
    );
  }
  if (history.status === "loading") {
    return <div className="h-64 animate-pulse rounded-lg bg-border/40" aria-label="Loading prices" />;
  }
  return (
    <p className="rounded-lg border border-border bg-background px-3 py-2 text-sm">
      {historyId
        ? "The price history could not be loaded. Reload the page to try again."
        : `No downloaded prices for ${holding.ticker}. Upload a CSV with its daily prices to see a chart.`}
    </p>
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
