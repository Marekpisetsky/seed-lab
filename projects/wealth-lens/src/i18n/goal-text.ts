/**
 * A goal in words, in the page's language: its name ("Live in Peru"), the
 * detail beside it ("housing included") and how its status is worked out, one
 * step per line. The status itself (lib/calculator.ts) holds only numbers.
 */

import type { I18n } from ".";
import { countryInSentence } from "./countries";
import { growthSource } from "./investment-text";
import { MAX_YEARS, NEEDED_WITHIN_YEARS, type GoalStatus, type Scenario } from "@/lib/calculator";
import { countryByCode } from "@/lib/cost-of-living";
import type { ResolvedInvestment } from "@/lib/investment";

/** Where a country's figure comes from: the World Bank's household survey and price level, with their years. */
function liveSource(code: string, { m }: I18n): string {
  const country = countryByCode(code);
  return m.countryTable.source(String(country?.surveyYear ?? ""), country?.referenceDate ?? "");
}

/** "Live in Peru", "Live without working", "Reach €100,000", "My rent" (a monthly amount's own label). */
export function goalName(status: GoalStatus, i18n: I18n): string {
  const { m, f } = i18n;
  if (!status.known) return m.goals.unknown;
  const { goal } = status;
  switch (goal.kind) {
    case "live":
      return m.goals.live(countryInSentence(goal.country, i18n));
    case "buy-own":
      return goal.name;
    case "amount":
      return goal.label ?? m.goals.reach(f.cur(goal.amount));
    case "freedom":
      return m.goals.freedom;
    case "monthly":
      return goal.label ? goal.label.charAt(0).toUpperCase() + goal.label.slice(1) : m.goals.monthlyName;
  }
}

/** "housing included" for a country, or nothing. */
export function goalDetail({ goal }: GoalStatus, i18n: I18n): string | null {
  return goal.kind === "live" ? i18n.m.goals.withHousing : null;
}

/** How the status is worked out: what is needed, when it gets there, and where the figures come from. */
export function goalExplain(status: GoalStatus, scenario: Scenario, investment: ResolvedInvestment, i18n: I18n): string[] {
  const { m, f } = i18n;
  const t = m.goals.explain;
  if (!status.known) return [m.goals.unknownExplain];
  const cost =
    status.kind === "monthly" ? t.monthlyCost(f.cur(status.amount), f.rate(scenario.withdrawalRate), f.cur(status.target)) : t.onceCost(f.cur(status.target));
  const source = growthSource(investment, i18n);
  const start = t.start(f.cur(scenario.capital), f.cur(scenario.monthly), f.rate(scenario.realReturn), source);
  const reach =
    status.months <= 1e-9
      ? t.already(f.cur(scenario.capital))
      : status.reachable && status.date
        ? t.reaches(start, f.cur(status.target), f.duration(status.months), f.monthYear(status.date))
        : t.tooFar(start, MAX_YEARS, f.cur(status.needed ?? 0), NEEDED_WITHIN_YEARS);
  const { goal } = status;
  const where =
    goal.kind === "freedom" && goal.country && goal.estimateDate
      ? m.goals.form.onePerson(countryInSentence(goal.country, i18n), goal.estimateDate)
      : goal.kind === "live"
      ? t.liveSource(liveSource(goal.country, i18n))
      : goal.kind === "buy-own"
        ? t.ownPrice
        : t.ownAmount;
  return [cost, reach, where, ...(goal.kind === "freedom" ? [m.goals.freedomRisk] : [])];
}
