"use client";

import { useRef, useState } from "react";
import { useI18n } from "@/components/i18n";
import { Button } from "@/components/ui/button";
import { Marked } from "@/components/ui/marked";
import { useAppState } from "@/hooks/use-app";
import { setUploadedPrices } from "@/lib/app-store";
import { averageCost } from "@/lib/finance";
import { instrumentForHolding, MARKET } from "@/lib/market-data";
import { parsePriceCsv, summarizeSeries, type PricePoint } from "@/lib/prices";
import { problem, problemText, type Problem } from "@/lib/problems";
import { lastDays, periodChange } from "@/lib/sparkline";
import type { Holding } from "@/lib/types";
import { ChartRow } from "./chart-row";
import { InstrumentFigures } from "./instrument-figures";
import { HistoryOnly, rowSummary } from "./instrument-row";
import { PriceChart } from "./price-chart";
import { PriceLines } from "./price-lines";
import { Sparkline } from "./sparkline";

const PERIOD_DAYS = 365;

/**
 * One holding in the My stocks list. When its ticker is on the curated list,
 * its weekly line and the figures the daily job worked out (never the
 * closes themselves); when the user uploaded a CSV of prices, the full
 * chart of their own file. The app never asks a price source.
 */
export function HoldingChartRow({ holding }: { holding: Holding }) {
  const { m } = useI18n();
  const t = m.stocks;
  const uploaded = useAppState().uploadedPrices[holding.ticker] ?? null;
  const setUploaded = (prices: Parameters<typeof setUploadedPrices>[1]) => setUploadedPrices(holding.ticker, prices);
  const instrument = instrumentForHolding(holding.ticker, holding.currency);
  const market = instrument ? MARKET.prices[instrument.id] : undefined;

  const recent = uploaded ? lastDays(uploaded.points, PERIOD_DAYS) : null;
  const downloaded = rowSummary(market);
  const change = recent ? periodChange(recent) : downloaded.change;
  const subtitle = uploaded ? t.yourPrices : instrument && market ? instrument.name : t.noDownloaded;
  const visual =
    recent && recent.length > 1 ? <Sparkline closes={recent.map((point) => point.close)} rising={(change ?? 0) >= 0} /> : downloaded.visual;

  return (
    <ChartRow title={holding.ticker} subtitle={subtitle} visual={visual} change={change}>
      {uploaded ? (
        <>
          <PriceChart points={uploaded.points} averageCost={averageCost(holding)} label={t.chartLabel(holding.ticker)} />
          <Summary points={uploaded.points} holding={holding} />
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs text-muted">{t.fromFile(uploaded.fileName)}</p>
            {market && (
              <Button size="sm" variant="ghost" onClick={() => setUploaded(null)}>
                {t.useDownloaded}
              </Button>
            )}
          </div>
        </>
      ) : market && instrument ? (
        <>
          <PriceLines instrument={instrument} />
          <HistoryOnly instrument={instrument} />
          <InstrumentFigures prices={market} averageCost={averageCost(holding)} />
        </>
      ) : (
        <p className="rounded-lg border border-border bg-background px-3 py-2 text-sm">{t.noPricesFor(holding.ticker)}</p>
      )}
      {!market && <UploadPrices ticker={holding.ticker} onLoaded={(fileName, points) => setUploaded({ fileName, points })} />}
    </ChartRow>
  );
}

function Summary({ points, holding }: { points: readonly PricePoint[]; holding: Holding }) {
  const { m, f } = useI18n();
  const average = averageCost(holding);
  const summary = summarizeSeries(points, average);
  if (!summary) return null;
  const { last, vsAverageCost } = summary;
  if (vsAverageCost === null || average === null) {
    return <p className="text-sm">{m.stocks.lastPrice(f.price(last.close))}</p>;
  }
  return (
    <p className="text-sm">
      <Marked
        text={m.stocks.now(f.price(last.close), f.percent(Math.abs(vsAverageCost)), vsAverageCost >= 0, f.money(average, holding.currency))}
        strongClassName={vsAverageCost >= 0 ? "text-positive" : "text-negative"}
      />
    </p>
  );
}

type UploadMessage = { kind: "problem"; file: string; problem: Problem } | { kind: "skipped"; count: number };

function UploadPrices({ ticker, onLoaded }: { ticker: string; onLoaded: (fileName: string, points: PricePoint[]) => unknown }) {
  const { m } = useI18n();
  const inputRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<UploadMessage | null>(null);

  const handle = async (file: File) => {
    let text: string;
    try {
      text = await file.text();
    } catch {
      setMessage({ kind: "problem", file: "", problem: problem("file-unreadable", { file: file.name }) });
      return;
    }
    const parsed = parsePriceCsv(text);
    if (!parsed.ok) {
      setMessage({ kind: "problem", file: file.name, problem: parsed.error });
      return;
    }
    onLoaded(file.name, parsed.points);
    setMessage(parsed.skippedRows > 0 ? { kind: "skipped", count: parsed.skippedRows } : null);
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
        aria-label={m.stocks.uploadLabel(ticker)}
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void handle(file);
          event.target.value = "";
        }}
      />
      <Button size="sm" onClick={() => inputRef.current?.click()}>
        {m.stocks.upload}
      </Button>
      <p className="text-xs text-muted">{m.stocks.uploadHint}</p>
      {message && (
        <p className="text-xs">
          {message.kind === "skipped"
            ? m.stocks.loadedSkipped(message.count)
            : `${message.file ? `${message.file}: ` : ""}${problemText(message.problem, m.problems)}`}
        </p>
      )}
    </div>
  );
}
