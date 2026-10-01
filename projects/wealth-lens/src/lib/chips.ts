/**
 * The growth chips under "How much does it grow a year?": one tap picks
 * what the money grows like, with no list to open. "My %" is Custom growth:
 * the user types the one number, growth after rising prices. Anything else
 * (Nasdaq-100, gold, another mix, My portfolio) is chosen in "More options"
 * and leaves no chip picked.
 */

import { setAssumptions, setInvestment } from "./app-store";
import { SERIES } from "./indexes";
import { TEMPLATES, templateOf } from "./mix";
import type { Investment } from "./types";

export const CHIP_IDS = ["sp500", "world", "60-40", "bonds", "savings", "mine"] as const;
export type ChipId = (typeof CHIP_IDS)[number];

/** The chip an investment is, or `null` when no chip is it. */
export function chipOf(investment: Investment): ChipId | null {
  switch (investment.kind) {
    case "asset": {
      const { asset } = investment;
      return asset === "sp500" || asset === "world" || asset === "bonds" || asset === "savings" ? asset : null;
    }
    case "mix":
      return templateOf(investment.parts)?.id === "60-40" ? "60-40" : null;
    case "custom":
      return "mine";
    case "portfolio":
      return null;
  }
}

const SIXTY_FORTY = TEMPLATES.find((template) => template.id === "60-40");

/** What a chip invests in; "My %" is Custom growth. */
export function chipInvestment(id: ChipId): Investment {
  switch (id) {
    case "60-40":
      return { kind: "mix", parts: (SIXTY_FORTY?.parts ?? []).map((part) => ({ ...part })), rebalance: false };
    case "mine":
      return { kind: "custom" };
    default:
      return { kind: "asset", asset: id };
  }
}

/** The growth a year shown on the S&P 500 and World chips ("~7.5%"): their average after rising prices. */
export function chipRate(id: "sp500" | "world"): number {
  return SERIES[id].averageReturn;
}

/**
 * The growth "My %" starts from when tapped: what the money grew at just
 * before, to a tenth of a percent, so the field holds a number to change
 * rather than an empty box.
 */
export function startingCustomGrowth(realReturn: number): number {
  return Math.round(realReturn * 1000) / 1000;
}

/**
 * One tap on a chip, and done: the plan invests in it. "My %" also starts
 * from `shownGrowth`, the growth on screen just before the tap.
 */
export function pickChip(id: ChipId, shownGrowth: number): void {
  setInvestment(chipInvestment(id));
  if (id === "mine") setAssumptions({ growth: startingCustomGrowth(shownGrowth) });
}
