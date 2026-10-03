"use client";

import { Trend } from "@seed-kit/react/trend.tsx";
import { useI18n } from "@/components/i18n";
import type { GainLoss } from "@/lib/finance";

interface GainProps {
  gain: GainLoss;
  currency: string;
  className?: string;
  /** Fraction digits of the amount; defaults to 2. */
  decimals?: number;
}

/** Signed gain/loss. A sign (+/−) and ▲/▼ as well as colour, so it reads without colour (seed-kit's Trend). */
export function Gain({ gain, currency, className = "", decimals = 2 }: GainProps) {
  const { f } = useI18n();
  const shown = Number(gain.absolute.toFixed(decimals));
  const tone = shown > 0 ? "text-positive" : shown < 0 ? "text-negative" : "text-muted";
  return (
    <span className={`tabular-nums ${tone} ${className}`}>
      <Trend change={shown}>{f.money(gain.absolute, currency, { signed: true, decimals })}</Trend>
      {gain.percent !== null && (
        <> <span className="whitespace-nowrap">({f.percent(gain.percent, { signed: true })})</span></>
      )}
    </span>
  );
}
