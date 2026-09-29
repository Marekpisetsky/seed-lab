"use client";

import { useCalculation } from "@/hooks/use-calculation";
import { CalculatorCard } from "./calculator-card";
import { FindingsSection } from "./findings-section";
import { GoalsSection } from "./goals-section";
import { ResultSection } from "./result-section";

/**
 * "My money": the calculator first, working on its own, then its results
 * in places that never move. Goals are optional and only the user adds
 * them; nothing here assumes where or how the user lives.
 */
export function MoneyModule() {
  const bundle = useCalculation();
  return (
    <div className="space-y-6">
      <CalculatorCard />
      <ResultSection bundle={bundle} />
      <GoalsSection goals={bundle.calc.goals} today={bundle.today} />
      <FindingsSection bundle={bundle} />
    </div>
  );
}
