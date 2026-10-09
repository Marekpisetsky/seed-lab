import { afterEach, describe, expect, it } from "vitest";
import { ratePerDollar } from "@seed-kit/money.ts";
import { appStore, INITIAL_STATE, replaceState, setCurrency, setPricesOf, startFromLanguage, updatePlan } from "./app-store";
import { calculate } from "./calculator";
import { countryByCode } from "./cost-of-living";
import { parseIsoDate } from "./dates";
import { costIn, countriesIn, isPlanCurrency, moneyStep, PLAN_CURRENCIES, PRICE_YEAR, roundFigure } from "./money";
import { SP500_PLAN } from "./sp500-plan";

afterEach(() => replaceState(INITIAL_STATE));

describe("the plan's currency", () => {
  it("is any currency with an official rate in the year of the countries' prices", () => {
    expect(PLAN_CURRENCIES.length).toBeGreaterThan(100);
    for (const code of ["EUR", "USD", "PEN", "MXN", "JPY", "GBP"]) expect(isPlanCurrency(code)).toBe(true);
    expect(isPlanCurrency("XXX")).toBe(false);
    for (const code of PLAN_CURRENCIES) expect(ratePerDollar(code, PRICE_YEAR)).toBeGreaterThan(0);
  });

  it("gives every country's cost in it, at that year's official rate", () => {
    const peru = countryByCode("PE")!;
    expect(costIn(peru, "EUR")).toBe(peru.monthlyCostEur);
    const soles = costIn(peru, "PEN");
    expect(soles / peru.monthlyCostUsd).toBeCloseTo(ratePerDollar("PEN", PRICE_YEAR)!, 1);
    expect(countriesIn("PEN").find((country) => country.code === "PE")?.monthlyCost).toBe(soles);
    expect(countriesIn("PEN")).toBe(countriesIn("PEN"));
  });

  it("makes the €50 step the same size of money, a round figure", () => {
    expect([54, 8100, 140, 1].map(roundFigure)).toEqual([50, 10_000, 100, 1]);
    expect(moneyStep("EUR")).toBe(50);
    expect(moneyStep("USD")).toBe(50);
    expect(moneyStep("JPY")).toBeGreaterThanOrEqual(5000);
    expect(moneyStep("PEN")).toBe(200);
  });

  it("leaves the result alone and shows the countries in it", () => {
    const today = parseIsoDate("2026-10-09");
    const euros = calculate({ ...SP500_PLAN, currency: "EUR" }, today);
    const soles = calculate({ ...SP500_PLAN, currency: "PEN" }, today);
    expect(soles.result).toEqual(euros.result);
    const peru = (calc: typeof euros) => calc.countries.find((row) => row.code === "PE")!.cost.amount;
    expect(peru(soles)).toBe(costIn(countryByCode("PE")!, "PEN"));
    expect(soles.step).toBe(200);
  });
});

describe("choosing the country and the currency", () => {
  it("lets the currency follow the country when it was the country's own", () => {
    // Euros were the Netherlands' own: Peru brings its soles.
    setPricesOf("PE");
    expect(appStore.get().plan).toMatchObject({ pricesOf: "PE", currency: "PEN" });
    setPricesOf("MX");
    expect(appStore.get().plan).toMatchObject({ pricesOf: "MX", currency: "MXN" });
    setCurrency("USD");
    setPricesOf("PE");
    expect(appStore.get().plan).toMatchObject({ pricesOf: "PE", currency: "USD" });
  });

  it("starts a first visit where the browser's language says, and never changes a plan already touched", () => {
    startFromLanguage("es-MX");
    expect(appStore.get().plan).toMatchObject({ pricesOf: "MX", currency: "MXN" });
    replaceState(INITIAL_STATE);
    startFromLanguage("en");
    expect(appStore.get().plan).toMatchObject({ pricesOf: "US", currency: "USD" });
    replaceState(INITIAL_STATE);
    updatePlan({ invested: 10 });
    startFromLanguage("es-MX");
    expect(appStore.get().plan).toMatchObject({ pricesOf: "NL", currency: "EUR" });
    replaceState(INITIAL_STATE);
    startFromLanguage("es-419");
    expect(appStore.get()).toBe(INITIAL_STATE);
  });
});
