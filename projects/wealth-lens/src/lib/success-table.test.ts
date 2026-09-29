import { describe, expect, it } from "vitest";
import { WITHDRAWAL_CHOICES } from "./calculator";
import { INDEX_IDS } from "./indexes";
import { resolveInvestment } from "./investment";
import { successRates } from "./monte-carlo";
import { cachedSuccessRates } from "./simulation";
import { PRECOMPUTED_SUCCESS } from "./success-table";

describe("the precomputed success rates", () => {
  it("are exactly what the simulation gives for every index and offered rate", () => {
    for (const index of INDEX_IDS) {
      const { key, returns } = resolveInvestment({ kind: "index", index }, []);
      const live = successRates({ withdrawalRates: WITHDRAWAL_CHOICES, returns });
      const table = WITHDRAWAL_CHOICES.map((rate) => PRECOMPUTED_SUCCESS[key]?.[rate.toFixed(4)]);
      // If the index data changed, copy these numbers into success-table.ts.
      expect(table, `${key}: ${JSON.stringify(live)}`).toEqual(live);
    }
  });

  it("are used for those rates, and anything else is simulated", () => {
    const { key, returns } = resolveInvestment({ kind: "index", index: "world" }, []);
    expect(cachedSuccessRates(key, returns, [0.04])).toEqual([PRECOMPUTED_SUCCESS[key]["0.0400"]]);
    expect(cachedSuccessRates(key, returns, [0.035])).toEqual(successRates({ withdrawalRates: [0.035], returns }));
  });
});
