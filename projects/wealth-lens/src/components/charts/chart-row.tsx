"use client";

import { useId, useState } from "react";
import { formatPercent } from "@/lib/format";
import { Sparkline } from "./sparkline";

interface ChartRowProps {
  title: string;
  subtitle: string;
  /** Closes of the last 12 months for the small line; empty when unknown. */
  closes: readonly number[];
  /** Change over the last 12 months; `null` when unknown. */
  change: number | null;
  /** The open panel; only rendered (and loaded) once the row is opened. */
  children: React.ReactNode;
}

/** One row of a summary list: name, small line and 1-year change; tapping opens the panel. */
export function ChartRow({ title, subtitle, closes, change, children }: ChartRowProps) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  return (
    <li>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center gap-3 py-3 text-left"
      >
        <span className="min-w-0 flex-1">
          <span className="block font-semibold">{title}</span>
          <span className="block text-xs text-muted">{subtitle}</span>
        </span>
        {change !== null && closes.length > 1 && <Sparkline closes={closes} rising={change >= 0} />}
        <span
          className={`w-20 text-right text-sm font-medium tabular-nums ${
            change === null ? "text-muted" : change >= 0 ? "text-positive" : "text-negative"
          }`}
        >
          {change === null ? "—" : formatPercent(change, { signed: true })}
          <span className="block text-xs font-normal text-muted">1 year</span>
        </span>
        <span aria-hidden="true" className={`text-muted transition-transform ${open ? "rotate-180" : ""}`}>
          ▾
        </span>
      </button>
      {open && (
        <div id={panelId} className="space-y-3 pb-5">
          {children}
        </div>
      )}
    </li>
  );
}
