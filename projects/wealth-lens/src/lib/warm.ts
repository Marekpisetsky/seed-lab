/**
 * Work done ahead, in idle moments once the user starts using the page, one
 * short step at a time (each well under 50 ms, so the page never stutters): the mixes'
 * random draws, every asset's simulated years, a first run of each mix
 * template (100% stocks, 80/20, 60/40) drifting and rebalanced, and of
 * the user's own figures.
 * Choosing any of them, or loading a file, then recalculates at once.
 */

import { resolveInvestment } from "./investment";
import { SERIES_IDS } from "./indexes";
import { mixModel, partReturns, prepareMixDraws, TEMPLATES } from "./mix";
import { mixFigures, successRatesFor } from "./projections";
import { STANDARD_ASSUMPTIONS } from "./types";

let warmed = false;

export function warmUp(rates: readonly number[]): void {
  if (warmed || typeof window === "undefined") return;
  warmed = true;
  const amounts = { start: 1000, monthly: 100, years: 20 };
  const steps: (() => void)[] = [
    () => prepareMixDraws(),
    // Every asset's simulated years, which any mix shares.
    () => {
      const all = mixModel(SERIES_IDS.map((asset) => ({ asset, weight: 1 })), false);
      if (all) partReturns(all);
    },
    // The 60/40 first: it is the one a mix starts with.
    ...[TEMPLATES[2], TEMPLATES[1], TEMPLATES[0]].flatMap((template) =>
      [false, true].map((rebalance) => () => {
        const mix = resolveInvestment({ kind: "mix", parts: [...template.parts], rebalance });
        successRatesFor(mix, rates);
        mixFigures(mix, amounts);
      }),
    ),
    () => {
      const own = resolveInvestment({ kind: "custom" }, { pricesOf: "NL", assumptions: { ...STANDARD_ASSUMPTIONS, growth: 0.05 } });
      successRatesFor(own, rates);
    },
  ];
  const next = () => {
    const step = steps.shift();
    if (!step) return;
    step();
    schedule();
  };
  const schedule = () => {
    if (typeof window.requestIdleCallback === "function") window.requestIdleCallback(next);
    else window.setTimeout(next, 30);
  };
  schedule();
}
