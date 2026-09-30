"use client";

import { X } from "lucide-react";
import { Changed } from "@/components/ui/changed";
import { clearWhatIf, toggleWhatIf } from "@/lib/app-store";
import { formatEurRounded } from "@/lib/format";
import { WHAT_IF_LABELS, type WhatIfEffect, type WhatIfId } from "@/lib/what-if";

/** "+€23,000", or why it cannot apply. */
function effectText({ id, change, available }: WhatIfEffect): string {
  if (!available) return id === "years-5" ? "60 years at most" : "No ups and downs here";
  return formatEurRounded(change, { signed: true });
}

/** "What if: grows 1% more ×": the scenario applied to the whole screen, and the way back. */
export function WhatIfIndicator({ applied }: { applied: WhatIfId | null }) {
  if (!applied) return null;
  const label = WHAT_IF_LABELS[applied].applied;
  return (
    <button
      type="button"
      onClick={clearWhatIf}
      aria-label={`Stop "What if: ${label}"`}
      className="inline-flex min-h-11 shrink-0 items-center gap-1 rounded-full bg-accent/10 px-3 py-1 text-sm font-medium text-accent hover:bg-accent/20"
    >
      What if: {label}
      <X aria-hidden="true" className="size-4" />
    </button>
  );
}

/**
 * "What if…?": five quick scenarios, each with what it changes in euros on
 * the plan as it is. Tapping one applies it to the whole screen, tapping
 * another switches, tapping the one applied takes it away. The row never
 * changes order or size: the chips have a fixed width and scroll sideways on
 * a phone.
 */
export function WhatIfRow({ effects, applied }: { effects: readonly WhatIfEffect[]; applied: WhatIfId | null }) {
  return (
    <div className="space-y-1.5">
      <p id="what-if-label" className="text-xs font-medium text-muted">
        What if…?
      </p>
      <div role="group" aria-labelledby="what-if-label" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:grid sm:grid-cols-5 sm:overflow-visible sm:px-0">
        {effects.map((effect) => {
          const pressed = applied === effect.id;
          const tone = !effect.available ? "text-muted" : effect.change >= 0 ? "text-positive" : "text-negative";
          return (
            <button
              key={effect.id}
              type="button"
              aria-pressed={pressed}
              disabled={!effect.available}
              onClick={() => toggleWhatIf(effect.id)}
              className={`flex w-36 shrink-0 flex-col items-start gap-0.5 rounded-lg border px-3 py-2 text-left sm:w-auto ${
                pressed ? "border-accent bg-accent/10 ring-1 ring-accent" : "border-border bg-card hover:bg-border/30"
              } disabled:opacity-60`}
            >
              <span className="text-sm font-medium">{WHAT_IF_LABELS[effect.id].chip}</span>
              <span className={`text-xs font-medium tabular-nums ${tone}`}>
                <Changed value={effectText(effect)} />
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
