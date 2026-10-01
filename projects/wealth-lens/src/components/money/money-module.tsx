"use client";

import dynamic from "next/dynamic";
import { useI18n } from "@/components/i18n";
import { useCalculation } from "@/hooks/use-calculation";
import { CalculatorCard } from "./calculator-card";

/** The result, its chart and its cards: their code loads once there is a result to show. */
const Results = dynamic(() => import("./results").then((module) => module.Results));

/**
 * "My money": the questions first, on their own. Until both amounts are
 * typed there is one calm line and nothing else; then the result in
 * levels (lib/plan.ts, planReady).
 */
export function MoneyModule() {
  const { m } = useI18n();
  const bundle = useCalculation();
  return (
    <div className="space-y-6">
      <CalculatorCard />
      {bundle.ready ? (
        <Results bundle={bundle} />
      ) : (
        <p role="status" className="px-1 text-base text-muted">
          {m.calculator.calm}
        </p>
      )}
    </div>
  );
}
