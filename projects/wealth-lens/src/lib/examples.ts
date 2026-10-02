/**
 * Step 3, "How much does it grow a year?": one field, a growth a year after
 * rising prices, 5 % to start (STARTING_GROWTH, lib/validation.ts).
 * Under it, examples to fill it with one tap: the S&P 500, World, 60/40,
 * bonds and savings. A number that is an example's (to a tenth of a
 * percent) invests in it, with its own past years; any other number is
 * Custom growth, with the ups and downs of world stocks.
 */

import { setAssumptions, setInvestment } from "./app-store";
import { SERIES } from "./indexes";
import { resolveInvestment, type ProjectionSettings } from "./investment";
import { TEMPLATES, templateOf } from "./mix";
import type { Investment } from "./types";

export const EXAMPLE_IDS = ["sp500", "world", "60-40", "bonds", "savings"] as const;
export type ExampleId = (typeof EXAMPLE_IDS)[number];

/** The example an investment is, or `null` (Custom growth, Nasdaq-100, gold, another mix, My portfolio). */
export function exampleOf(investment: Investment): ExampleId | null {
  switch (investment.kind) {
    case "asset": {
      const { asset } = investment;
      return asset === "sp500" || asset === "world" || asset === "bonds" || asset === "savings" ? asset : null;
    }
    case "mix":
      return templateOf(investment.parts)?.id === "60-40" ? "60-40" : null;
    case "custom":
    case "portfolio":
      return null;
  }
}

const SIXTY_FORTY = TEMPLATES.find((template) => template.id === "60-40");

/** What an example invests in. */
export function exampleInvestment(id: ExampleId): Investment {
  return id === "60-40" ? { kind: "mix", parts: (SIXTY_FORTY?.parts ?? []).map((part) => ({ ...part })), rebalance: false } : { kind: "asset", asset: id };
}

/** The S&P 500's and World's growth a year after rising prices: their average over the shared years. */
export function indexRate(id: "sp500" | "world"): number {
  return SERIES[id].averageReturn;
}

/**
 * Each example's growth a year after rising prices, with the plan's
 * country (a savings account's interest minus that country's rising
 * prices): what a tap writes in the field.
 */
export function exampleRates(settings: Pick<ProjectionSettings, "pricesOf" | "assumptions">): Record<ExampleId, number> {
  const standard = { pricesOf: settings.pricesOf, assumptions: { growth: null, volatility: null, inflation: settings.assumptions.inflation } };
  return Object.fromEntries(EXAMPLE_IDS.map((id) => [id, resolveInvestment(exampleInvestment(id), [], standard).realReturn])) as Record<ExampleId, number>;
}

/** Two growths the field shows the same: equal to a tenth of a percent. */
export function sameTenth(a: number, b: number): boolean {
  return Math.round(a * 1000) === Math.round(b * 1000);
}

/** The growth as the field shows it, in percent with one decimal at most: 7.49 % is 7.5. */
export function fieldPercent(growth: number): number {
  return Math.round(growth * 1000) / 10;
}

/**
 * The field's number, once typed: the example with that growth if there is
 * one (its own past years), or Custom growth at it. A number equal to what
 * the field already showed changes nothing, so leaving the field keeps
 * Nasdaq-100 or a mix chosen in More options.
 */
export function setGrowth(growth: number, shown: number, rates: Record<ExampleId, number>, investment: Investment): void {
  if (sameTenth(growth, shown)) return;
  const example = EXAMPLE_IDS.find((id) => sameTenth(rates[id], growth));
  if (example) {
    setInvestment(exampleInvestment(example));
    return;
  }
  if (investment.kind !== "custom") setInvestment({ kind: "custom" });
  setAssumptions({ growth });
}

/** A tap on an example: the plan invests in it, and the field shows its growth. */
export function pickExample(id: ExampleId): void {
  setInvestment(exampleInvestment(id));
}
