"use client";

import { Trend } from "@seed-kit/react/trend.tsx";
import { ChevronDown } from "lucide-react";
import { useId, useState } from "react";
import { useI18n } from "@/components/i18n";

interface ChartRowProps {
  title: string;
  subtitle: string;
  /** A small picture beside the name (recent years, or the user's own prices); decorative. */
  visual: React.ReactNode;
  /** Change over the last 12 months; `null` when unknown. */
  change: number | null;
  /** The open panel; only rendered once the row is opened. */
  children: React.ReactNode;
}

/** A change as "+12.3%" shows it, to one decimal: −0.04% is "0.0%", with no mark and no colour. */
export const shownPercent = (change: number) => Math.round(change * 1000) / 1000;

/** A gain's colour, a loss's, or none. */
export const tone = (change: number | null) => (change === null || shownPercent(change) === 0 ? "text-muted" : change > 0 ? "text-positive" : "text-negative");

/** One row of a summary list: name, a small picture and the 1-year change (sign, ▲/▼ and colour); tapping opens the panel. */
export function ChartRow({ title, subtitle, visual, change, children }: ChartRowProps) {
  const { m, f } = useI18n();
  const [open, setOpen] = useState(false);
  const panelId = useId();
  return (
    <li>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
        className="flex min-h-11 w-full items-center gap-3 py-3 text-left"
      >
        <span className="min-w-0 flex-1">
          <span className="block font-semibold">{title}</span>
          <span className="block text-xs text-muted">{subtitle}</span>
        </span>
        {visual}
        <span className={`w-20 text-right text-sm font-medium tabular-nums ${tone(change)}`}>
          {change === null ? "—" : <Trend change={shownPercent(change)}>{f.percent(change, { signed: true })}</Trend>}
          <span className="block text-xs font-normal text-muted">{m.stocks.oneYear}</span>
        </span>
        <ChevronDown aria-hidden="true" className={`size-4 shrink-0 text-muted transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div id={panelId} className="space-y-3 pb-5">
          {children}
        </div>
      )}
    </li>
  );
}
