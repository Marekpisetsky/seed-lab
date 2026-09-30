"use client";

import { useI18n } from "@/components/i18n";
import { latestPriceDate } from "@/lib/market-data";

/** The single line that says how fresh the downloaded prices are. */
export function PricesUpdated({ className = "" }: { className?: string }) {
  const { m, f } = useI18n();
  const date = latestPriceDate();
  return (
    <p className={`text-xs text-muted ${className}`}>
      {date ? m.stocks.updated(f.dayMonth(date)) : m.stocks.notDownloaded}
    </p>
  );
}
