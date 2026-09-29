import { ChevronDown, TriangleAlert } from "lucide-react";
import { Changed } from "@/components/ui/changed";
import type { Finding } from "@/lib/findings";

/**
 * "What you should know": 3-5 cards, each one number and one sentence.
 * Opening a card shows how the number is worked out and what it assumes.
 */
export function FindingsSection({ findings }: { findings: readonly Finding[] }) {
  if (findings.length === 0) return null;
  return (
    <section aria-labelledby="findings-title" className="space-y-3">
      <h2 id="findings-title" className="text-sm font-semibold uppercase tracking-wide text-muted">
        What you should know
      </h2>
      <ul className="grid gap-3 sm:grid-cols-2">
        {findings.map((finding) => (
          <li key={finding.id}>
            <details
              className={`group h-full rounded-xl border bg-card ${
                finding.tone === "warning" ? "border-warning-border" : "border-border"
              }`}
            >
              <summary className="flex cursor-pointer list-none items-start gap-3 p-4 [&::-webkit-details-marker]:hidden">
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1.5 text-2xl font-semibold tracking-tight">
                    {finding.tone === "warning" && (
                      <TriangleAlert aria-label="Risk" className="size-5 shrink-0 text-warning-foreground" />
                    )}
                    <Changed value={finding.value} />
                  </span>
                  <span className="mt-1 block text-sm">{finding.text}</span>
                </span>
                <ChevronDown aria-hidden="true" className="mt-1 size-4 shrink-0 text-muted transition-transform group-open:rotate-180" />
              </summary>
              <div className="space-y-3 border-t border-border px-4 pb-4 pt-3 text-sm">
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
          </li>
        ))}
      </ul>
    </section>
  );
}
