"use client";

import { setHoldingReference } from "@/lib/app-store";
import { ASSET_IDS, assetShortName, type AssetId } from "@/lib/assets";
import { formatEur, formatPercent } from "@/lib/format";
import { instrumentForHolding } from "@/lib/market-data";
import type { MixModel } from "@/lib/mix";
import { defaultReference, PORTFOLIO_LABEL, type Allocation } from "@/lib/portfolio";
import { HowMyPortfolioWorks } from "./explainers";

/**
 * My portfolio's holdings, each with what it grows like: worked out from
 * the ticker (a stock's market index, what a fund holds, else World), and
 * changeable here.
 */
export function PortfolioEditor({ allocation, model }: { allocation: Allocation; model: MixModel | null }) {
  return (
    <div className="col-span-2 space-y-3 rounded-lg bg-background p-3 sm:col-span-4">
      <p className="text-sm font-medium">{PORTFOLIO_LABEL}</p>
      <p className="text-xs text-muted">Each holding grows like the asset beside it; change any of them.</p>
      <ul className="space-y-2">
        {allocation.entries.map((entry) => {
          const { holding } = entry;
          const instrument = instrumentForHolding(holding.ticker, holding.currency);
          const standard = defaultReference(holding);
          return (
            <li key={holding.id} className="flex items-center gap-2">
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">
                  {holding.ticker}
                  {instrument && <span className="hidden font-normal text-muted sm:inline"> · {instrument.name}</span>}
                </span>
                <span className="block text-xs text-muted tabular-nums">
                  {formatPercent(entry.weight, { decimals: 0 })} · {formatEur(entry.value)}
                  {entry.stock ? " · its own ups and downs" : ""}
                  {entry.assumed ? " · a guess: change it" : ""}
                </span>
              </span>
              <select
                aria-label={`What ${holding.ticker} grows like`}
                value={entry.asset}
                onChange={(event) => {
                  const asset = event.target.value as AssetId;
                  // Back to what the ticker says: no choice stored.
                  setHoldingReference(holding.id, asset === standard.asset && !standard.assumed ? null : asset);
                }}
                className="min-h-11 w-36 shrink-0 rounded-md border border-border bg-background px-2 py-1.5 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/30 sm:w-48"
              >
                {ASSET_IDS.map((asset) => (
                  <option key={asset} value={asset}>
                    {assetShortName(asset)}
                  </option>
                ))}
              </select>
            </li>
          );
        })}
      </ul>
      {allocation.left.length > 0 && (
        <p className="text-xs text-muted">
          Not counted:{" "}
          {allocation.left
            .map((holding) => `${holding.ticker} (${holding.currency !== "EUR" ? holding.currency : "no price"})`)
            .join(", ")}
          . The app does not convert currencies.
        </p>
      )}
      <HowMyPortfolioWorks model={model} />
    </div>
  );
}
