"use client";

import { useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { inputClass } from "@/components/ui/form";
import { Notice } from "@/components/ui/notice";
import { usePersistentStore } from "@/hooks/use-persistent-store";
import { usePriceSeries } from "@/hooks/use-price-series";
import { averageCost } from "@/lib/finance";
import { formatMoney, formatNumber, formatPercent, formatPrice } from "@/lib/format";
import {
  defaultStooqSymbol,
  isValidStooqSymbol,
  parsePriceCsv,
  stooqQuoteCurrency,
  summarizeSeries,
  type PriceError,
  type PricePoint,
} from "@/lib/prices";
import { chartSymbolsStore, uploadedPricesStore } from "@/lib/stores";
import type { Holding } from "@/lib/types";
import { PriceChart } from "./price-chart";

interface HoldingChartCardProps {
  holding: Holding;
}

export function HoldingChartCard({ holding }: HoldingChartCardProps) {
  const [symbols, setSymbols] = usePersistentStore(chartSymbolsStore);
  const [uploaded, setUploaded] = usePersistentStore(uploadedPricesStore(holding.ticker));
  const [uploadMessage, setUploadMessage] = useState<{ tone: "warning" | "info"; text: string } | null>(null);

  const symbol = symbols[holding.ticker] ?? defaultStooqSymbol(holding.ticker);
  const { state, retry } = usePriceSeries(uploaded ? null : symbol);
  const average = averageCost(holding);

  const handleUpload = async (file: File) => {
    let text: string;
    try {
      text = await file.text();
    } catch {
      setUploadMessage({ tone: "warning", text: `Could not read ${file.name}.` });
      return;
    }
    const parsed = parsePriceCsv(text);
    if (!parsed.ok) {
      setUploadMessage({ tone: "warning", text: `${file.name}: ${parsed.error}` });
      return;
    }
    const saved = setUploaded({ fileName: file.name, points: parsed.points });
    const skipped =
      parsed.skippedRows > 0 ? ` ${parsed.skippedRows} row${parsed.skippedRows === 1 ? " was" : "s were"} skipped.` : "";
    setUploadMessage(
      saved
        ? skipped
          ? { tone: "info", text: `Loaded ${parsed.points.length} days.${skipped}` }
          : null
        : {
            tone: "warning",
            text: `Loaded ${parsed.points.length} days, but the browser could not save them (storage full or blocked), so they will be gone after a reload.${skipped}`,
          },
    );
  };

  const points: readonly PricePoint[] | null = uploaded
    ? uploaded.points
    : state.status === "done" && state.ok
      ? state.data.points
      : null;

  return (
    <Card
      title={holding.ticker}
      description={
        <>
          {formatNumber(holding.quantity)} shares · average cost{" "}
          {average === null ? "—" : formatMoney(average, holding.currency)}
        </>
      }
    >
      <div className="space-y-3">
        {!uploaded && (
          <SymbolForm
            ticker={holding.ticker}
            symbol={symbol}
            onChange={(next) => setSymbols((previous) => ({ ...previous, [holding.ticker]: next }))}
          />
        )}

        {points ? (
          <>
            <PriceChart
              points={points}
              averageCost={average}
              label={`Daily closing prices of ${holding.ticker} with a line at your average cost`}
            />
            <Summary points={points} average={average} currency={holding.currency} />
          </>
        ) : state.status === "loading" ? (
          <div className="h-64 animate-pulse rounded-lg bg-border/40 sm:h-72" aria-label="Loading prices" />
        ) : state.status === "done" && !state.ok ? (
          <LoadError ticker={holding.ticker} symbol={symbol} error={state.error} onRetry={retry} />
        ) : null}

        <CurrencyCheck symbol={uploaded ? null : symbol} holdingCurrency={holding.currency} />

        <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
          {uploaded ? (
            <>
              <span>
                Source: your file <span className="font-medium text-foreground">{uploaded.fileName}</span> (
                {uploaded.points.length} days).
              </span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setUploaded(null);
                  setUploadMessage(null);
                }}
              >
                Use Stooq instead
              </Button>
            </>
          ) : (
            state.status === "done" &&
            state.ok && <span>Source: Stooq ({state.data.symbol}), unofficial third-party data, may be delayed.</span>
          )}
          <UploadButton ticker={holding.ticker} onFile={handleUpload} replacing={Boolean(uploaded)} />
        </div>

        {uploadMessage && <Notice tone={uploadMessage.tone}>{uploadMessage.text}</Notice>}
      </div>
    </Card>
  );
}

function SymbolForm({ ticker, symbol, onChange }: { ticker: string; symbol: string; onChange: (symbol: string) => void }) {
  const id = useId();
  const [draft, setDraft] = useState(symbol);
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className="flex flex-wrap items-end gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        const next = draft.trim().toLowerCase();
        if (!isValidStooqSymbol(next)) {
          setError("Use a Stooq symbol such as aapl.us, vwce.de or vusa.uk.");
          return;
        }
        setError(null);
        onChange(next);
      }}
    >
      <div className="space-y-1">
        <label htmlFor={id} className="block text-xs font-medium text-muted">
          Stooq symbol for {ticker}
        </label>
        <input
          id={id}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          autoCapitalize="none"
          spellCheck={false}
          className={`${inputClass} w-40`}
        />
      </div>
      <Button type="submit" disabled={draft.trim().toLowerCase() === symbol}>
        Load
      </Button>
      {error && (
        <p id={`${id}-error`} className="w-full text-xs text-negative">
          {error}
        </p>
      )}
    </form>
  );
}

const ERROR_TITLES: Record<PriceError["code"], string> = {
  INVALID_SYMBOL: "Invalid symbol",
  NOT_FOUND: "No data for this symbol",
  RATE_LIMITED: "Stooq's daily limit was reached",
  VERIFICATION_REQUIRED: "Stooq asked for verification",
  UNEXPECTED_FORMAT: "Unexpected answer from Stooq",
  UPSTREAM_ERROR: "Stooq could not be reached",
  TIMEOUT: "Stooq did not answer in time",
};

function LoadError({
  ticker,
  symbol,
  error,
  onRetry,
}: {
  ticker: string;
  symbol: string;
  error: PriceError;
  onRetry: () => void;
}) {
  return (
    <Notice tone="warning" title={`${ERROR_TITLES[error.code]} (${ticker} → ${symbol})`}>
      <p>{error.message}</p>
      <p className="mt-1">
        You can still see this chart by uploading your own CSV with a date and a close column (for example
        exported from your broker or a spreadsheet).
      </p>
      {error.code !== "INVALID_SYMBOL" && error.code !== "NOT_FOUND" && (
        <Button size="sm" className="mt-2" onClick={onRetry}>
          Retry
        </Button>
      )}
    </Notice>
  );
}

function Summary({ points, average, currency }: { points: readonly PricePoint[]; average: number | null; currency: string }) {
  const summary = summarizeSeries(points, average);
  if (!summary) return null;
  const { last, vsAverageCost } = summary;
  return (
    <p className="text-sm">
      Last close <strong className="tabular-nums">{formatPrice(last.close)}</strong> on {last.time}
      {vsAverageCost !== null && average !== null && (
        <>
          :{" "}
          <strong className={vsAverageCost >= 0 ? "text-positive" : "text-negative"}>
            {formatPercent(Math.abs(vsAverageCost))} {vsAverageCost >= 0 ? "above" : "below"}
          </strong>{" "}
          your average cost of {formatMoney(average, currency)} (dashed line)
        </>
      )}
      .
    </p>
  );
}

/** The cost line only means something if prices and cost share a currency. */
function CurrencyCheck({ symbol, holdingCurrency }: { symbol: string | null; holdingCurrency: string }) {
  if (symbol === null) return null;
  const quoteCurrency = stooqQuoteCurrency(symbol);
  if (quoteCurrency === null || quoteCurrency === holdingCurrency) return null;
  return (
    <Notice tone="warning">
      Stooq quotes {symbol} in {quoteCurrency}, but this holding is recorded in {holdingCurrency}, so the
      average-cost line is not directly comparable with the prices.
    </Notice>
  );
}

function UploadButton({ ticker, onFile, replacing }: { ticker: string; onFile: (file: File) => void; replacing: boolean }) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept=".csv,text/csv,text/plain"
        className="sr-only"
        aria-label={`Upload a price CSV for ${ticker}`}
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) onFile(file);
          event.target.value = "";
        }}
      />
      <Button size="sm" variant="ghost" onClick={() => inputRef.current?.click()}>
        {replacing ? "Upload another CSV" : "Upload my own price CSV"}
      </Button>
    </>
  );
}
