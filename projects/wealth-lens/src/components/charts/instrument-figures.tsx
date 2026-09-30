"use client";

import { useI18n } from "@/components/i18n";
import { Marked } from "@/components/ui/marked";
import type { InstrumentPrices } from "@/lib/market-data";
import { YearChanges } from "./year-changes";

/**
 * What the daily job worked out from an instrument's closes: the latest
 * close, past growth, the worst fall, how much it moves and each year's
 * change. Figures only: the closes themselves are not published.
 */
export function InstrumentFigures({ prices, averageCost = null }: { prices: InstrumentPrices; averageCost?: number | null }) {
  const { m, f } = useI18n();
  const t = m.stocks;
  const since = (from: string) => from.slice(0, 4);
  const vsPaid = averageCost ? prices.close / averageCost - 1 : null;
  return (
    <div className="space-y-2 text-sm">
      <p>
        {t.lastClose(f.money(prices.close, prices.currency), f.dayMonth(prices.date))}
        {vsPaid !== null && averageCost !== null && (
          <>
            {" "}
            <Marked
              text={t.vsPaid(f.percent(Math.abs(vsPaid)), vsPaid >= 0, f.money(averageCost, prices.currency))}
              strongClassName={vsPaid >= 0 ? "text-positive" : "text-negative"}
            />
          </>
        )}
      </p>
      <ul className="space-y-1 text-muted">
        {prices.growth && (
          <li>
            <Marked text={t.grew(f.percent(prices.growth.perYear, { signed: true }), since(prices.growth.from))} />
          </li>
        )}
        {prices.drawdown && (
          <li>
            <Marked text={t.worstFall(since(prices.drawdown.from), f.percent(-prices.drawdown.max, { decimals: 0 }))} />
          </li>
        )}
        {prices.stats && (
          <li>
            <Marked text={t.moves(f.percent(prices.stats.volatility, { decimals: 0 }))} />
          </li>
        )}
      </ul>
      <YearChanges years={prices.stats?.years} />
    </div>
  );
}
