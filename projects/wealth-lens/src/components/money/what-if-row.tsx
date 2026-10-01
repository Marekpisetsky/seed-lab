"use client";

import { X } from "lucide-react";
import { useI18n } from "@/components/i18n";
import { Changed } from "@/components/ui/changed";
import { whatIfsFor } from "@/hooks/calculation-details";
import type { CalculationBundle } from "@/hooks/use-calculation";
import type { I18n } from "@/i18n";
import { clearWhatIf, toggleWhatIf } from "@/lib/app-store";
import type { WhatIfEffect, WhatIfId } from "@/lib/what-if";

/** "+€23,000", or why it cannot apply. */
function effectText({ id, change, available }: WhatIfEffect, { m, f }: I18n): string {
  if (!available) return id === "years-5" ? m.whatIf.maxYears : m.whatIf.noUps;
  return f.eurRounded(change, { signed: true });
}

/** "What if: grows 1% more ×": the scenario applied to the whole screen, and the way back. */
export function WhatIfIndicator({ applied }: { applied: WhatIfId | null }) {
  const { m } = useI18n();
  if (!applied) return null;
  const label = m.whatIf.applied[applied];
  return (
    <button
      type="button"
      onClick={clearWhatIf}
      aria-label={m.whatIf.stop(label)}
      className="inline-flex min-h-11 shrink-0 items-center gap-1 rounded-full bg-accent/10 px-3 py-1 text-sm font-medium text-accent hover:bg-accent/20"
    >
      {m.whatIf.indicator(label)}
      <X aria-hidden="true" className="size-4" />
    </button>
  );
}

/**
 * "What if…?", in its card: five quick scenarios, each with what it changes
 * in euros on the plan as it is (worked out when the card is opened).
 * Tapping one applies it to the whole screen, tapping another switches,
 * tapping the one applied takes it away. The row never changes order or
 * size: the chips have a fixed width and scroll sideways on a phone.
 */
export function WhatIfRow({ bundle }: { bundle: CalculationBundle }) {
  const i18n = useI18n();
  const { m } = i18n;
  const effects = whatIfsFor(bundle);
  const applied = bundle.calc.whatIf;
  return (
    <div className="space-y-2">
      <p className="text-sm text-muted">{m.help.whatIf}</p>
      <div role="group" aria-label={m.whatIf.title} className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:grid sm:grid-cols-5 sm:overflow-visible sm:px-0">
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
              <span className="text-sm font-medium">{m.whatIf.chips[effect.id]}</span>
              <span className={`text-xs font-medium tabular-nums ${tone}`}>
                <Changed value={effectText(effect, i18n)} />
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
