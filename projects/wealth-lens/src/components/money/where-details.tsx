"use client";

import type { CalculationBundle } from "@/hooks/use-calculation";
import { CountriesSection } from "./countries-section";

/** "Where it reaches": what the monthly amount covers country by country, seven rows until "Show all". */
export function WhereDetails({ bundle }: { bundle: CalculationBundle }) {
  const { calc, today } = bundle;
  return <CountriesSection income={calc.result.income} rows={calc.countries} horizonMonths={calc.result.years * 12} today={today} />;
}
