"use client";

import { useI18n } from "@/components/i18n";
import { Changed } from "@/components/ui/changed";
import { whatIfsFor } from "@/hooks/calculation-details";
import type { CalculationBundle } from "@/hooks/use-calculation";

/**
 * Under a step, once there is a result: what one more step of it would
 * change, the same figure its "What if…?" shows. Under the monthly amount,
 * "+€50 a month → +€27,000 in 20 years"; under the years, "5 more years →
 * +€33,000". Nothing when it cannot apply (past 60 years).
 */
export function StepHint({ bundle, step }: { bundle: CalculationBundle; step: "monthly" | "years" }) {
  const { m, f } = useI18n();
  const id = step === "monthly" ? "monthly-50" : "years-5";
  const effect = whatIfsFor(bundle).find((entry) => entry.id === id);
  if (!effect?.available) return null;
  const change = f.eurRounded(effect.change, { signed: true });
  const what = m.whatIf.chips[id];
  return (
    <p className="text-sm font-medium tabular-nums">
      <Changed
        value={step === "monthly" ? m.calculator.effectIn(what, change, m.units.years(bundle.base.result.years)) : m.calculator.effect(what, change)}
        className={effect.change >= 0 ? "text-positive" : "text-negative"}
      />
    </p>
  );
}
