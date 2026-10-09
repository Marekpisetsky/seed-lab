import { describe, expect, it } from "vitest";
import { SERIES_IDS } from "./indexes";
import { resolveInvestment } from "./investment";
import { successRates } from "./monte-carlo";
import { cachedSuccessRates } from "./simulation";
import { PRECOMPUTED_SUCCESS } from "./success-table";
import { DEFAULT_PLAN } from "./validation";
import { WITHDRAWAL_STEPS } from "./withdrawal";

describe("the precomputed success rates", () => {
  const investments = [...SERIES_IDS.map((asset) => resolveInvestment({ kind: "asset", asset })), resolveInvestment(DEFAULT_PLAN.investment, DEFAULT_PLAN)];

  it("are exactly what the simulation gives for every asset with a history, the starting plan and every step of the slider", () => {
    for (const { key, returns } of investments) {
      const live = successRates({ withdrawalRates: WITHDRAWAL_STEPS, returns });
      const table = WITHDRAWAL_STEPS.map((rate) => PRECOMPUTED_SUCCESS[key]?.[rate.toFixed(4)]);
      // If the data changed, copy these numbers into success-table.ts.
      expect(table, `${key}: ${JSON.stringify(live)}`).toEqual(live);
    }
  });

  it("are used for those rates, and anything else is simulated", () => {
    const { key, returns } = resolveInvestment({ kind: "asset", asset: "gold" });
    expect(cachedSuccessRates(key, returns, [0.04])).toEqual([PRECOMPUTED_SUCCESS[key]["0.0400"]]);
    expect(cachedSuccessRates(key, returns, [0.033])).toEqual(successRates({ withdrawalRates: [0.033], returns }));
  });
});
