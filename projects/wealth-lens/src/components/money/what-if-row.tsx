"use client";

import { X } from "lucide-react";
import { useId } from "react";
import { useI18n } from "@/components/i18n";
import { Changed } from "@/components/ui/changed";
import { whatIfsFor } from "@/hooks/calculation-details";
import type { CalculationBundle } from "@/hooks/use-calculation";
import type { I18n } from "@/i18n";
import { clearWhatIf, toggleWhatIf } from "@/lib/app-store";
import { decadeYears } from "@/lib/decade";
import type { ResolvedInvestment } from "@/lib/investment";
import type { WhatIfEffect, WhatIfId } from "@/lib/what-if";

/** "+€23,000", or why it cannot apply. */
function effectText({ id, change, available }: WhatIfEffect, { m, f }: I18n): string {
  if (!available) return id === "years-5" ? m.whatIf.maxYears : m.whatIf.noUps;
  return f.eurRounded(change, { signed: true });
}

/** A scenario's name in a chip: "Grows 1% more", "First 10 years like 2000–2009". */
export function whatIfChip(id: WhatIfId, investment: ResolvedInvestment, years: number, { m }: I18n): string {
  const decade = id === "bad-decade" ? decadeYears(investment, years) : null;
  return decade ? m.whatIf.decade(decade[1] - decade[0] + 1, `${decade[0]}–${decade[1]}`) : m.whatIf.chips[id];
}

/** The same, once applied: "grows 1% more", "first 10 years like 2000–2009". */
export function whatIfApplied(id: WhatIfId, investment: ResolvedInvestment, years: number, { m }: I18n): string {
  const decade = id === "bad-decade" ? decadeYears(investment, years) : null;
  return decade ? m.whatIf.decadeApplied(decade[1] - decade[0] + 1, `${decade[0]}–${decade[1]}`) : m.whatIf.applied[id];
}

/** "What if: grows 1% more (+€23,000) ×": the scenario applied to the whole screen, what it changes, and the way back. */
export function WhatIfIndicator({ bundle }: { bundle: CalculationBundle }) {
  const i18n = useI18n();
  const { m, f } = i18n;
  const applied = bundle.calc.whatIf;
  if (!applied) return null;
  const label = whatIfApplied(applied, bundle.base.investment, bundle.base.result.years, i18n);
  const change = f.eurRounded(bundle.calc.result.total - bundle.base.result.total, { signed: true });
  return (
    <button
      type="button"
      onClick={clearWhatIf}
      aria-label={m.whatIf.stop(`${label} (${change})`)}
      className="inline-flex min-h-11 shrink-0 items-center gap-1 rounded-full bg-accent/10 px-3 py-1 text-sm font-medium text-accent hover:bg-accent/20"
    >
      {m.whatIf.indicator(label, change)}
      <X aria-hidden="true" className="size-4" />
    </button>
  );
}

/**
 * "What if…?": five quick scenarios, each with what it changes in euros on
 * the plan as it is. Tapping one applies it to the whole screen, tapping
 * another switches, tapping the one applied takes it away. Under the chart
 * on a phone, two across (`grid`); beside the result on a wide screen, one
 * under the other (`list`). Nothing moves: the buttons keep their place
 * and size.
 */
export function WhatIfRow({ bundle, layout = "grid" }: { bundle: CalculationBundle; layout?: "grid" | "list" }) {
  const i18n = useI18n();
  const { m } = i18n;
  const effects = whatIfsFor(bundle);
  const applied = bundle.calc.whatIf;
  const list = layout === "list";
  return (
    <div className="space-y-2">
      {!list && <p className="text-base text-muted">{m.help.whatIf}</p>}
      <div role="group" aria-label={m.whatIf.title} className={list ? "flex flex-col gap-2" : "grid grid-cols-2 gap-2 sm:grid-cols-3"}>
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
              className={`flex min-h-14 w-full rounded-lg border px-3 py-2 text-left ${list ? "items-center justify-between gap-2" : "flex-col items-start justify-center gap-0.5"} ${
                pressed ? "border-accent bg-accent/10 ring-1 ring-accent" : "border-border bg-card hover:bg-border/30"
              } disabled:opacity-60`}
            >
              <span className="text-base font-medium">{whatIfChip(effect.id, bundle.base.investment, bundle.base.result.years, i18n)}</span>
              <span className={`shrink-0 text-sm font-semibold tabular-nums ${tone}`}>
                <Changed value={effectText(effect, i18n)} />
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** "What if…?" beside the result, with its title: the left column on a wide screen, under the steps on a middle one. */
export function WhatIfPanel({ bundle }: { bundle: CalculationBundle }) {
  const { m } = useI18n();
  const heading = useId();
  return (
    <section aria-labelledby={heading} className="space-y-3">
      <h2 id={heading} className="text-lg font-bold">
        {m.whatIf.title}
      </h2>
      <WhatIfRow bundle={bundle} layout="list" />
    </section>
  );
}
