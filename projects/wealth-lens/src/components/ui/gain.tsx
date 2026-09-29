import { ArrowDown, ArrowUp } from "lucide-react";
import type { GainLoss } from "@/lib/finance";
import { formatMoney, formatPercent } from "@/lib/format";

interface GainProps {
  gain: GainLoss;
  currency: string;
  className?: string;
  /** Fraction digits of the amount; defaults to 2. */
  decimals?: number;
}

/** Signed gain/loss. Uses a sign and an arrow as well as color, so it reads without color. */
export function Gain({ gain, currency, className = "", decimals = 2 }: GainProps) {
  const tone = gain.absolute > 0 ? "text-positive" : gain.absolute < 0 ? "text-negative" : "text-muted";
  const Arrow = gain.absolute > 0 ? ArrowUp : gain.absolute < 0 ? ArrowDown : null;
  return (
    <span className={`tabular-nums ${tone} ${className}`}>
      <span className="whitespace-nowrap">
        {Arrow && <Arrow aria-hidden="true" className="mr-0.5 inline size-[0.8em] align-[-0.05em]" strokeWidth={2.5} />}
        {formatMoney(gain.absolute, currency, { signed: true, decimals })}
      </span>
      {gain.percent !== null && (
        <> <span className="whitespace-nowrap">({formatPercent(gain.percent, { signed: true })})</span></>
      )}
    </span>
  );
}
