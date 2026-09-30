"use client";

import { ChevronDown, TriangleAlert } from "lucide-react";
import { useState } from "react";
import { Changed } from "@/components/ui/changed";
import { findingsFor, type CalculationBundle } from "@/hooks/use-calculation";
import type { Finding } from "@/lib/findings";

function FindingCard({ finding }: { finding: Finding }) {
  return (
    <details className={`group/card rounded-xl border bg-card ${finding.tone === "warning" ? "border-warning-border" : "border-border"}`}>
      <summary className="flex cursor-pointer list-none items-start gap-3 p-3 [&::-webkit-details-marker]:hidden">
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1.5 text-xl font-semibold tracking-tight">
            {finding.tone === "warning" && <TriangleAlert aria-label="Risk" className="size-5 shrink-0 text-warning-foreground" />}
            <Changed value={finding.value} />
          </span>
          <span className="mt-0.5 block text-sm">
            <Changed value={finding.text} />
          </span>
        </span>
        <ChevronDown aria-hidden="true" className="mt-1 size-4 shrink-0 text-muted transition-transform group-open/card:rotate-180" />
      </summary>
      <div className="space-y-3 border-t border-border px-3 pb-3 pt-2 text-sm">
        <ol className="space-y-1 tabular-nums">
          {finding.calculation.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ol>
        <ul className="space-y-1 text-xs text-muted">
          {finding.assumptions.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </div>
    </details>
  );
}

/** The findings, worked out only once the section is open. */
function Findings({ bundle }: { bundle: CalculationBundle }) {
  const findings = findingsFor(bundle);
  if (findings.length === 0) return <p className="text-sm text-muted">Nothing stands out for these numbers.</p>;
  return (
    <ul className="grid gap-2 sm:grid-cols-3">
      {findings.map((finding) => (
        <li key={finding.id}>
          <FindingCard finding={finding} />
        </li>
      ))}
    </ul>
  );
}

/**
 * "What you should know", folded: two or three findings over the years
 * chosen (about the first goal when there is one), always in the same
 * order. Closed, it costs nothing: they are worked out on opening.
 */
export function FindingsSection({ bundle }: { bundle: CalculationBundle }) {
  const [open, setOpen] = useState(false);
  return (
    <details className="group/section rounded-xl border border-border" onToggle={(event) => setOpen(event.currentTarget.open)}>
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-semibold [&::-webkit-details-marker]:hidden">
        What you should know
        <ChevronDown aria-hidden="true" className="size-4 shrink-0 text-muted transition-transform group-open/section:rotate-180" />
      </summary>
      <div className="px-3 pb-3">{open && <Findings bundle={bundle} />}</div>
    </details>
  );
}
