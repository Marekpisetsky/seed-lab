/**
 * What the folded cards show, worked out from a calculation only when a
 * card is opened, and kept for that calculation. Apart from
 * use-calculation.ts so this code (the findings, the mix figures) loads
 * with the cards, not with the first screen.
 */

import type { I18n } from "@/i18n";
import { whatIfEffects } from "@/lib/calculator";
import { topFindings, type Finding } from "@/lib/findings";
import { mixFigures, type MixFigures } from "@/lib/projections";
import type { WhatIfEffect } from "@/lib/what-if";
import type { CalculationBundle } from "./use-calculation";

const whatIfs = new WeakMap<CalculationBundle, WhatIfEffect[]>();

/** What each "What if…?" would change, in the fixed order of their row: worked out when their card is opened. */
export function whatIfsFor(bundle: CalculationBundle): WhatIfEffect[] {
  let kept = whatIfs.get(bundle);
  if (!kept) {
    kept = whatIfEffects(bundle.base);
    whatIfs.set(bundle, kept);
  }
  return kept;
}

const mixes = new WeakMap<CalculationBundle, MixFigures | null>();

/** For a mix: its range and worst year, with US stocks alone beside them; worked out when shown. */
export function mixFiguresFor(bundle: CalculationBundle): MixFigures | null {
  let kept = mixes.get(bundle);
  if (kept === undefined) {
    const { calc } = bundle;
    kept = mixFigures(calc.investment, { start: calc.scenario.capital, monthly: calc.scenario.monthly, years: calc.result.years });
    mixes.set(bundle, kept);
  }
  return kept;
}

let lastFindings: { bundle: CalculationBundle; i18n: I18n; findings: Finding[] } | null = null;

/** The findings of a calculation in the page's language, worked out only when their section is open. */
export function findingsFor(bundle: CalculationBundle, i18n: I18n): Finding[] {
  if (lastFindings?.bundle === bundle && lastFindings.i18n === i18n) return lastFindings.findings;
  const findings = topFindings({ calc: bundle.base, inflation: bundle.base.investment.inflation, today: bundle.today, i18n });
  lastFindings = { bundle, i18n, findings };
  return findings;
}
