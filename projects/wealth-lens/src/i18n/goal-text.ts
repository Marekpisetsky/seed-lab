/**
 * A goal in words, in the page's language: its name ("Live in Peru"), the
 * detail beside it ("with housing") and how its status is worked out, one
 * step per line. The status itself (lib/calculator.ts) holds only numbers.
 */

import type { I18n } from ".";
import { countryInSentence } from "./countries";
import { itemName, itemSource } from "./item-text";
import { dividendNote, growthSource } from "./investment-text";
import { MAX_YEARS, NEEDED_WITHIN_YEARS, type GoalStatus, type Scenario } from "@/lib/calculator";
import { countryByCode } from "@/lib/cost-of-living";
import type { ResolvedInvestment } from "@/lib/investment";

/** Where a country's figures come from: its sources, or its price level for an estimate. */
function liveSource(code: string, referenceDate: string | null, { m }: I18n): string {
  const level = countryByCode(code)?.priceLevel;
  return level ? m.countryTable.estimatedSource(level.year) : m.countryTable.detailedSource(referenceDate ?? "");
}

/** "Live in Peru", "Stop working", "A used car", "Reach €100,000", "My rent" (a monthly amount's own label). */
export function goalName(status: GoalStatus, i18n: I18n): string {
  const { m, f } = i18n;
  if (!status.known) return m.goals.unknown;
  const { goal } = status;
  switch (goal.kind) {
    case "live":
      return goal.stopWorking ? m.wishes.stopWorking : m.goals.live(countryInSentence(goal.country, i18n));
    case "buy":
      return m.things.items[goal.item] ? itemName(goal.item, i18n) : m.goals.unknown;
    case "buy-own":
      return goal.name;
    case "amount":
      return m.goals.reach(f.eur(goal.amount));
    case "monthly":
      return goal.label ? goal.label.charAt(0).toUpperCase() + goal.label.slice(1) : m.goals.monthlyName;
  }
}

/** "with housing", "in Spain, with housing" (stop working), "prices of the Netherlands" (a thing priced elsewhere), or nothing. */
export function goalDetail({ goal, otherCountry }: GoalStatus, i18n: I18n): string | null {
  const { m } = i18n;
  if (goal.kind === "live") {
    if (goal.stopWorking) return m.goals.stopWorkingIn(countryInSentence(goal.country, i18n));
    return goal.housing ? m.goals.withHousing : m.goals.withoutHousing;
  }
  return otherCountry ? m.things.otherCountry(countryInSentence(otherCountry, i18n)) : null;
}

/** How the status is worked out: what is needed, when it gets there, and where the figures come from. */
export function goalExplain(status: GoalStatus, scenario: Scenario, investment: ResolvedInvestment, i18n: I18n): string[] {
  const { m, f } = i18n;
  const t = m.goals.explain;
  if (!status.known) return [m.goals.unknownExplain];
  const cost =
    status.kind === "monthly" ? t.monthlyCost(f.eur(status.amount), f.rate(scenario.withdrawalRate), f.eur(status.target)) : t.onceCost(f.eur(status.target));
  const dividends = dividendNote(investment, i18n);
  const source = growthSource(investment, i18n) + (dividends ? `; ${dividends}` : "");
  const start = t.start(f.eur(scenario.capital), f.eur(scenario.monthly), f.rate(scenario.realReturn), source);
  const reach =
    status.months <= 1e-9
      ? t.already(f.eur(scenario.capital))
      : status.reachable && status.date
        ? t.reaches(start, f.eur(status.target), f.duration(status.months), f.monthYear(status.date))
        : t.tooFar(start, MAX_YEARS, f.eur(status.needed ?? 0), NEEDED_WITHIN_YEARS);
  const { goal } = status;
  const where =
    goal.kind === "live"
      ? t.liveSource(goal.housing, liveSource(goal.country, status.referenceDate, i18n))
      : goal.kind === "buy" && status.item
        ? t.itemSource(itemSource(status.item, i18n))
        : goal.kind === "buy-own"
          ? t.ownPrice
          : t.ownAmount;
  return [cost, reach, where];
}
