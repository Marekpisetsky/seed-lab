"use client";

import { ChevronDown, TriangleAlert } from "lucide-react";
import { useI18n } from "@/components/i18n";
import { Changed } from "@/components/ui/changed";
import { findingsFor, type CalculationBundle } from "@/hooks/use-calculation";
import type { Finding } from "@/lib/findings";

function FindingCard({ finding }: { finding: Finding }) {
  const { m } = useI18n();
  return (
    <details className={`group/card rounded-xl border bg-card ${finding.tone === "warning" ? "border-warning-border" : "border-border"}`}>
      <summary className="flex cursor-pointer list-none items-start gap-3 p-3 [&::-webkit-details-marker]:hidden">
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1.5 text-xl font-semibold tracking-tight">
            {finding.tone === "warning" && <TriangleAlert aria-label={m.findings.risk} className="size-5 shrink-0 text-warning-foreground" />}
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

/** The findings, worked out only once their card is open. */
export function Findings({ bundle }: { bundle: CalculationBundle }) {
  const i18n = useI18n();
  const findings = findingsFor(bundle, i18n);
  if (findings.length === 0) return <p className="text-sm text-muted">{i18n.m.findings.nothing}</p>;
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
