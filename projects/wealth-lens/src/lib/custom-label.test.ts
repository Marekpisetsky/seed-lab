import { beforeEach, describe, expect, it } from "vitest";
import { EN, getI18n } from "@/i18n";
import { selectorName } from "@/i18n/investment-text";
import { appStore, INITIAL_STATE, resetAssumptions, setAssumptions, setInvestment, setPricesOf } from "./app-store";
import { resolveInvestment } from "./investment";

const ES = getI18n("es");

/** What "Invested in" shows for the plan in the store. */
function shown(i18n = EN): string {
  const { plan } = appStore.get();
  return selectorName(resolveInvestment(plan.investment, plan), i18n);
}

describe('"Invested in" once an assumption is changed', () => {
  beforeEach(() => {
    appStore.set(INITIAL_STATE);
    setInvestment({ kind: "asset", asset: "sp500" });
  });

  it("shows the investment's own name with the standard figures", () => {
    expect(shown()).toBe("US stocks");
    expect(shown(ES)).toBe("Acciones de EE. UU.");
  });

  it('says "Custom (based on US stocks)" as soon as any figure is the user\'s', () => {
    setAssumptions({ growth: 0.12 });
    expect(shown()).toBe("Custom (based on US stocks)");
    expect(shown(ES)).toBe("Propio (basado en Acciones de EE. UU.)");
    resetAssumptions();
    setAssumptions({ volatility: 0.05 });
    expect(shown()).toBe("Custom (based on US stocks)");
    resetAssumptions();
    setAssumptions({ inflation: 0.04 });
    expect(shown()).toBe("Custom (based on US stocks)");
  });

  it('goes back to the original name with "Reset to standard"', () => {
    setAssumptions({ growth: 0.12, volatility: 0.3, inflation: 0.03 });
    resetAssumptions();
    expect(shown()).toBe("US stocks");
  });

  it("names whatever it was based on: an asset, a mix", () => {
    setInvestment({ kind: "asset", asset: "gold" });
    setAssumptions({ volatility: 0.05 });
    expect(shown()).toBe("Custom (based on Gold)");
    setInvestment({ kind: "mix", parts: [{ asset: "sp500", weight: 60 }, { asset: "bonds", weight: 40 }], rebalance: false });
    setAssumptions({ growth: 0.05 });
    expect(shown()).toBe("Custom (based on Mix 60/40)");
  });

  it("keeps Custom growth's own name, which has no asset behind it", () => {
    setInvestment({ kind: "custom" });
    expect(shown()).toBe("Custom growth");
    setAssumptions({ growth: 0.05 });
    expect(shown()).toBe("Custom growth");
  });

  it("is not changed by picking another country's prices: that is the standard for that country", () => {
    setPricesOf("BR");
    expect(shown()).toBe("US stocks");
  });

  it("drops the label when another investment is chosen, since its standard growth and ups and downs come with it", () => {
    setAssumptions({ growth: 0.12 });
    setInvestment({ kind: "asset", asset: "bonds" });
    expect(shown()).toBe("German government bonds");
  });
});
