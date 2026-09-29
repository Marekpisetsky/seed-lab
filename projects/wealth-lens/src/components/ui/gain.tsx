import type { GainLoss } from "@/lib/finance";
import { formatMoney, formatPercent } from "@/lib/format";

interface GainProps {
  gain: GainLoss;
  currency: string;
  className?: string;
}

/** Signed gain/loss. Uses a sign and an arrow as well as color, so it reads without color. */
export function Gain({ gain, currency, className = "" }: GainProps) {
  const tone = gain.absolute > 0 ? "text-positive" : gain.absolute < 0 ? "text-negative" : "text-muted";
  const arrow = gain.absolute > 0 ? "▲" : gain.absolute < 0 ? "▼" : "";
  return (
    <span className={`tabular-nums ${tone} ${className}`}>
      <span className="whitespace-nowrap">
        {arrow && <span aria-hidden="true">{arrow} </span>}
        {formatMoney(gain.absolute, currency, { signed: true })}
      </span>
      {gain.percent !== null && (
        <> <span className="whitespace-nowrap">({formatPercent(gain.percent, { signed: true })})</span></>
      )}
    </span>
  );
}
