/**
 * Work done ahead, in idle moments once the user starts using the page, one
 * short step at a time (each well under 50 ms, so the page never stutters): the mixes'
 * random draws, every asset's simulated years, a first run of the 60/40
 * template drifting and rebalanced, of a portfolio with a stock and of the
 * user's own figures.
 * Choosing any of them, or loading a file, then recalculates at once.
 */

import { resolveInvestment } from "./investment";
import { instrumentById } from "./market-data";
import { SERIES_IDS } from "./indexes";
import { mixModel, mixPercentiles, mixSuccessRates, partReturns, prepareMixDraws, TEMPLATES } from "./mix";
import { mixFigures, successRatesFor } from "./projections";
import { STANDARD_ASSUMPTIONS } from "./types";

let warmed = false;

export function warmUp(rates: readonly number[]): void {
  if (warmed || typeof window === "undefined") return;
  warmed = true;
  const amounts = { start: 1000, monthly: 100, years: 20 };
  const steps: (() => void)[] = [
    ...[0, 1, 2, 3].map((slots) => () => prepareMixDraws(slots)),
    // Every asset's simulated years, which any mix or portfolio shares.
    () => {
      const all = mixModel(SERIES_IDS.map((asset) => ({ asset, weight: 1 })), false);
      if (all) partReturns(all);
    },
    ...[false, true].map((rebalance) => () => {
      const mix = resolveInvestment({ kind: "mix", parts: [...TEMPLATES[2].parts], rebalance }, []);
      successRatesFor(mix, rates);
      mixFigures(mix, amounts);
    }),
    () => {
      const stock = instrumentById("NVDA");
      const model = mixModel([{ asset: "world", weight: 70 }, { asset: "nasdaq100", weight: 30, ...(stock ? { stock } : {}) }], false);
      if (model) {
        mixPercentiles(model, amounts);
        mixSuccessRates(model, rates);
      }
    },
    () => {
      const own = resolveInvestment({ kind: "custom" }, [], { pricesOf: "NL", assumptions: { ...STANDARD_ASSUMPTIONS, growth: { rate: 0.05, basis: "real" } } });
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
