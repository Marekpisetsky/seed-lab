"use client";

import dynamic from "next/dynamic";
import { useI18n } from "@/components/i18n";
import type { CalculationBundle } from "@/hooks/use-calculation";
import { CountriesSection } from "./countries-section";
import { SeeMore } from "./result-section";

/** The things the money could buy, and when: loaded with "See more". */
const Things = dynamic(() => import("./things-section").then((module) => module.Things));

/**
 * "Where it reaches": what the monthly amount covers country by country,
 * seven rows until "Show all"; then, behind "See more", the things the
 * money could buy, and when.
 */
export function WhereDetails({ bundle }: { bundle: CalculationBundle }) {
  const { m } = useI18n();
  const { calc, state, today } = bundle;
  return (
    <div className="space-y-3">
      <CountriesSection income={calc.result.income} rows={calc.countries} horizonMonths={calc.result.years * 12} today={today} />
      <SeeMore what={m.things.title}>
        <section aria-labelledby="things-title" className="space-y-2">
          <h3 id="things-title" className="text-base font-bold">
            {m.things.title}
          </h3>
          <Things scenario={calc.scenario} goals={state.plan.goals} today={today} />
          <p className="text-sm text-muted">{m.things.note}</p>
        </section>
      </SeeMore>
    </div>
  );
}
