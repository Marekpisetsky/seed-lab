import { formatDayMonth, formatMoney, formatPercent } from "@/lib/format";
import type { InstrumentPrices } from "@/lib/market-data";
import { YearChanges } from "./year-changes";

/**
 * What the daily job worked out from an instrument's closes: the latest
 * close, past growth, the worst fall, how much it moves and each year's
 * change. Figures only: the closes themselves are not published.
 */
export function InstrumentFigures({ prices, averageCost = null }: { prices: InstrumentPrices; averageCost?: number | null }) {
  const since = (from: string) => from.slice(0, 4);
  const vsPaid = averageCost ? prices.close / averageCost - 1 : null;
  return (
    <div className="space-y-2 text-sm">
      <p>
        Last close {formatMoney(prices.close, prices.currency)} on {formatDayMonth(prices.date)}.
        {vsPaid !== null && averageCost !== null && (
          <>
            {" "}
            <strong className={vsPaid >= 0 ? "text-positive" : "text-negative"}>
              {formatPercent(Math.abs(vsPaid))} {vsPaid >= 0 ? "above" : "below"}
            </strong>{" "}
            what you paid ({formatMoney(averageCost, prices.currency)}).
          </>
        )}
      </p>
      <ul className="space-y-1 text-muted">
        {prices.growth && (
          <li>
            Grew <strong className="font-medium text-foreground tabular-nums">{formatPercent(prices.growth.perYear, { signed: true })} a year</strong> since{" "}
            {since(prices.growth.from)}, before rising prices. Past, not a forecast.
          </li>
        )}
        {prices.drawdown && (
          <li>
            Worst fall since {since(prices.drawdown.from)}: <strong className="font-medium text-foreground tabular-nums">−{formatPercent(prices.drawdown.max, { decimals: 0 })}</strong>.
          </li>
        )}
        {prices.stats && (
          <li>
            Moves about <strong className="font-medium text-foreground tabular-nums">±{formatPercent(prices.stats.volatility, { decimals: 0 })}</strong> in a normal year.
          </li>
        )}
      </ul>
      <YearChanges years={prices.stats?.years} />
    </div>
  );
}
