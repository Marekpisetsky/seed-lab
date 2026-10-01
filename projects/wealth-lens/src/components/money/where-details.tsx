"use client";

import { useI18n } from "@/components/i18n";
import type { CalculationBundle } from "@/hooks/use-calculation";
import { CountriesSection } from "./countries-section";
import { Things } from "./things-section";

/**
 * "Where it reaches", in its card: what the monthly amount covers country
 * by country, then the things the money could buy, and when.
 */
export function WhereDetails({ bundle }: { bundle: CalculationBundle }) {
  const { m } = useI18n();
  const { calc, state } = bundle;
  return (
    <div className="space-y-6">
      <CountriesSection income={calc.result.income} rows={calc.countries} />
      <section aria-labelledby="things-title" className="space-y-2">
        <h2 id="things-title" className="text-base font-bold">
          {m.things.title}
        </h2>
        <Things scenario={calc.scenario} goals={state.plan.goals} />
        <p className="text-xs text-muted">{m.things.note}</p>
      </section>
    </div>
  );
}
