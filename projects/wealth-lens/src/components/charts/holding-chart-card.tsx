"use client";

import { useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Disclosure } from "@/components/ui/disclosure";
import { inputClass } from "@/components/ui/form";
import { usePersistentStore } from "@/hooks/use-persistent-store";
import { usePriceSeries } from "@/hooks/use-price-series";
import { averageCost } from "@/lib/finance";
import { formatMoney, formatPercent, formatPrice } from "@/lib/format";
import {
  isValidStooqSymbol,
  parsePriceCsv,
  stooqQuoteCurrency,
  summarizeSeries,
  type PriceError,
  type PricePoint,
} from "@/lib/prices";
import { lastDays, periodChange } from "@/lib/sparkline";
import { chartSymbolsStore, uploadedPricesStore } from "@/lib/stores";
import { stooqCandidates } from "@/lib/symbols";
import type { Holding } from "@/lib/types";
import { PriceChart } from "./price-chart";
import { Sparkline } from "./sparkline";

const PERIOD_DAYS = 365;

/** One row of the summary list; tapping it opens the full chart. */
export function HoldingChartRow({ holding }: { holding: Holding }) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const [symbols, setSymbols] = usePersistentStore(chartSymbolsStore);
  const [uploaded, setUploaded] = usePersistentStore(uploadedPricesStore(holding.ticker));
  const candidates = stooqCandidates(holding.ticker, holding.currency, symbols[holding.ticker]);
  const { state, retry } = usePriceSeries(uploaded ? null : candidates);

  const points: readonly PricePoint[] | null = uploaded
    ? uploaded.points
    : state.status === "done" && state.ok
      ? state.data.points
      : null;
  const symbol = state.status === "done" ? state.symbol : candidates[0];
  const recent = points ? lastDays(points, PERIOD_DAYS) : [];
  const change = periodChange(recent);

  return (
    <li>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center gap-3 py-3 text-left"
      >
        <span className="min-w-0 flex-1">
          <span className="block font-semibold">{holding.ticker}</span>
          <span className="block text-xs text-muted">{rowStatus(state, uploaded !== null)}</span>
        </span>
        {change !== null && <Sparkline points={recent} rising={change >= 0} />}
        <span
          className={`w-20 text-right text-sm font-medium tabular-nums ${
            change === null ? "text-muted" : change >= 0 ? "text-positive" : "text-negative"
          }`}
        >
          {change === null ? "—" : formatPercent(change, { signed: true })}
          <span className="block text-xs font-normal text-muted">1 year</span>
        </span>
        <span aria-hidden="true" className={`text-muted transition-transform ${open ? "rotate-180" : ""}`}>
          ▾
        </span>
      </button>

      {open && (
        <div id={panelId} className="space-y-3 pb-5">
          {points ? (
            <>
              <PriceChart
                points={points}
                averageCost={averageCost(holding)}
                label={`Daily closing prices of ${holding.ticker} with a line at your average cost`}
              />
              <Summary points={points} holding={holding} />
            </>
          ) : state.status === "done" && !state.ok ? (
            <LoadError error={state.error} onRetry={retry} />
          ) : (
            <div className="h-64 animate-pulse rounded-lg bg-border/40" aria-label="Loading prices" />
          )}
          {!uploaded && <CurrencyNote symbol={symbol} holdingCurrency={holding.currency} />}
          <p className="text-xs text-muted">
            {uploaded
              ? `Prices from your file ${uploaded.fileName}.`
              : `Prices from Stooq (${symbol}), a free unofficial source; may be delayed.`}
          </p>
          <Disclosure summary="Change price source">
            {uploaded ? (
              <Button size="sm" onClick={() => setUploaded(null)}>
                Use Stooq again
              </Button>
            ) : (
              <SymbolForm
                ticker={holding.ticker}
                symbol={symbol}
                onChange={(next) => setSymbols((previous) => ({ ...previous, [holding.ticker]: next }))}
              />
            )}
            <UploadPrices ticker={holding.ticker} onLoaded={(fileName, loaded) => setUploaded({ fileName, points: loaded })} />
          </Disclosure>
        </div>
      )}
    </li>
  );
}

function rowStatus(state: ReturnType<typeof usePriceSeries>["state"], uploaded: boolean): string {
  if (uploaded) return "your prices";
  if (state.status === "loading") return "loading…";
  if (state.status === "done" && !state.ok) return "prices unavailable";
  return "";
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

const ERROR_TEXT: Record<PriceError["code"], string> = {
  INVALID_SYMBOL: "That symbol isn't valid.",
  NOT_FOUND: "No prices found for this symbol.",
  RATE_LIMITED: "The free price source hit its daily limit.",
  VERIFICATION_REQUIRED: "The price source asked for a check we can't pass.",
  UNEXPECTED_FORMAT: "The price source sent something unexpected.",
  UPSTREAM_ERROR: "The price source can't be reached right now.",
  TIMEOUT: "The price source took too long.",
};

function LoadError({ error, onRetry }: { error: PriceError; onRetry: () => void }) {
  const canRetry = error.code !== "INVALID_SYMBOL" && error.code !== "NOT_FOUND";
  return (
    <div className="rounded-lg border border-warning-border bg-warning-bg px-3 py-2 text-sm text-warning-foreground">
      <p>
        {ERROR_TEXT[error.code]} Upload your own prices under “Change price source”.
      </p>
      {canRetry && (
        <Button size="sm" className="mt-2" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}

/** One line: the cost line only compares with prices in the same currency. */
function CurrencyNote({ symbol, holdingCurrency }: { symbol: string; holdingCurrency: string }) {
  const quoteCurrency = stooqQuoteCurrency(symbol);
  if (quoteCurrency === null || quoteCurrency === holdingCurrency) return null;
  return (
    <p className="text-xs text-warning-foreground">
      ⚠ Prices are in {quoteCurrency}, your cost in {holdingCurrency}: the dashed line isn&apos;t comparable.
    </p>
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
          setError("Use a Stooq symbol such as vwce.de or aapl.us.");
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
          className={`${inputClass} w-36`}
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

function UploadPrices({ ticker, onLoaded }: { ticker: string; onLoaded: (fileName: string, points: PricePoint[]) => boolean }) {
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
    const saved = onLoaded(file.name, parsed.points);
    const skipped = parsed.skippedRows > 0 ? ` ${parsed.skippedRows} rows skipped.` : "";
    setMessage(saved ? (skipped ? `Loaded.${skipped}` : null) : `Loaded, but not saved (browser storage full or blocked).${skipped}`);
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
      <p className="text-xs text-muted">A file with a date and a close column.</p>
      {message && <p className="text-xs">{message}</p>}
    </div>
  );
}
