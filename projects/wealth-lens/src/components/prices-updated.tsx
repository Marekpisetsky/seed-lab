import { formatDayMonth } from "@/lib/format";
import { latestPriceDate } from "@/lib/market-data";

/** The single line that says how fresh the downloaded prices are. */
export function PricesUpdated({ className = "" }: { className?: string }) {
  const date = latestPriceDate();
  return (
    <p className={`text-xs text-muted ${className}`}>
      {date ? `Prices updated ${formatDayMonth(date)}` : "Prices not downloaded yet"}
    </p>
  );
}
