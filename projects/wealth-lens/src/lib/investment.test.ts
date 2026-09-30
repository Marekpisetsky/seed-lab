import { describe, expect, it } from "vitest";
import { SAVINGS_RATE, seriesVolatility } from "./assets";
import { annualizedReturn, SERIES } from "./indexes";
import { dividendNote, inflationFor, mixName, periodText, resolveInvestment, STANDARD_SETTINGS, toNominal, toReal, type ProjectionSettings } from "./investment";
import { logStats } from "./volatility";
import { STANDARD_ASSUMPTIONS, type Holding } from "./types";

const holding = (ticker: string, value: number, currency = "EUR"): Holding => ({
  id: ticker,
  ticker,
  quantity: 1,
  costBasis: value,
  currency,
  currentPrice: value,
  priceSource: "manual",
  priceDate: null,
});

const settings = (patch: Partial<ProjectionSettings["assumptions"]> = {}, pricesOf = "NL"): ProjectionSettings => ({
  pricesOf,
  assumptions: { ...STANDARD_ASSUMPTIONS, ...patch },
});

describe("standard assumptions: filled in from the data", () => {
  it("gives an asset its average growth after inflation, its swings and its years", () => {
    const resolved = resolveInvestment({ kind: "asset", asset: "sp500" }, []);
    expect(resolved).toMatchObject({ name: "S&P 500", period: [1988, 2022], simulation: "history", custom: false, key: "asset:sp500" });
    expect(resolved.realReturn).toBeCloseTo(SERIES.sp500.averageReturn, 12);
    expect(resolved.volatility).toBeCloseTo(seriesVolatility("sp500"), 12);
    expect(resolved.volatility).toBeGreaterThan(0.15);
    expect(resolved.returns).toHaveLength(35);
    expect(resolved.standard).toMatchObject({ basis: "real", period: [1988, 2022] });
  });

  it("does the same for euro government bonds and gold: lower growth, bonds steadier, gold swinging hard", () => {
    const bonds = resolveInvestment({ kind: "asset", asset: "bonds" }, []);
    const gold = resolveInvestment({ kind: "asset", asset: "gold" }, []);
    const sp500 = resolveInvestment({ kind: "asset", asset: "sp500" }, []);
    expect(bonds.realReturn).toBeCloseTo(0.0247, 3);
    expect(gold.realReturn).toBeCloseTo(0.0106, 3);
    expect(bonds.volatility).toBeLessThan(0.1);
    expect(gold.volatility).toBeGreaterThan(bonds.volatility);
    expect(bonds.realReturn).toBeLessThan(sp500.realReturn);
    expect(gold.realReturn).toBeLessThan(bonds.realReturn);
    expect(bonds.modelText).toBe("euro government bond histories");
    expect(gold.modelText).toBe("gold histories");
  });

  it("gives a savings account its rate less the country's inflation, with no swings: it can be below zero", () => {
    const savings = resolveInvestment({ kind: "asset", asset: "savings" }, []);
    expect(savings.realReturn).toBeCloseTo((1 + SAVINGS_RATE) / 1.02 - 1, 12);
    expect(savings.realReturn).toBeLessThan(0);
    expect(savings).toMatchObject({ volatility: 0, simulation: "fixed", period: null, custom: false });
    expect(savings.standard).toMatchObject({ basis: "nominal", nominalRate: SAVINGS_RATE });
    expect(savings.returns).toEqual([savings.realReturn]);
    // Switzerland's 1% reference inflation leaves it above zero.
    expect(resolveInvestment({ kind: "asset", asset: "savings" }, [], settings({}, "CH")).realReturn).toBeCloseTo(1.015 / 1.01 - 1, 12);
  });

  it("weights My portfolio by value, each holding growing like what it holds", () => {
    const resolved = resolveInvestment({ kind: "portfolio" }, [holding("VUAA", 5000), holding("EQQQ", 3000), holding("4GLD", 2000)]);
    expect(resolved.name).toBe("My portfolio");
    expect(resolved.realReturn).toBeCloseTo(0.5 * SERIES.sp500.averageReturn + 0.3 * SERIES.nasdaq100.averageReturn + 0.2 * SERIES.gold.averageReturn, 12);
    expect(resolved.model?.parts.map((part) => [part.asset, part.weight])).toEqual([
      ["sp500", 0.5],
      ["nasdaq100", 0.3],
      ["gold", 0.2],
    ]);
    expect(resolved).toMatchObject({ simulation: "joint", period: [1988, 2022] });
    expect(resolved.allocation?.total).toBe(10_000);
    expect(resolved.withoutDividends).toBeCloseTo(0.3, 12);
  });

  it("names a mix after its template", () => {
    expect(mixName({ kind: "mix", parts: [{ asset: "world", weight: 60 }, { asset: "bonds", weight: 40 }], rebalance: false })).toBe("Mix 60/40");
    expect(mixName({ kind: "mix", parts: [{ asset: "bonds", weight: 20 }, { asset: "world", weight: 80 }], rebalance: true })).toBe("Mix 80/20");
    expect(mixName({ kind: "mix", parts: [{ asset: "world", weight: 100 }], rebalance: false })).toBe("Mix: 100% stocks");
    expect(mixName({ kind: "mix", parts: [{ asset: "gold", weight: 50 }, { asset: "sp500", weight: 50 }], rebalance: false })).toBe("Mix of 2");
  });

  it("falls back to the S&P 500 when the choice cannot be used", () => {
    expect(resolveInvestment({ kind: "portfolio" }, []).investment).toEqual({ kind: "asset", asset: "sp500" });
    expect(resolveInvestment({ kind: "portfolio" }, [holding("NVDA", 5000, "USD")]).name).toBe("S&P 500");
    expect(resolveInvestment({ kind: "mix", parts: [{ asset: "gold", weight: 0 }], rebalance: false }, []).name).toBe("S&P 500");
  });
});

describe("assumptions the user changes", () => {
  it("takes a typed growth after inflation as it is, and switches the simulations to a normal distribution", () => {
    const resolved = resolveInvestment({ kind: "asset", asset: "sp500" }, [], settings({ growth: { rate: 0.05, basis: "real" } }));
    expect(resolved.realReturn).toBe(0.05);
    expect(resolved).toMatchObject({ custom: true, simulation: "normal", period: null });
    // The standard swings stay, now around the typed growth: the typical year grows exactly 5%.
    expect(resolved.volatility).toBeCloseTo(seriesVolatility("sp500"), 12);
    const { mean, deviation } = logStats(resolved.returns);
    expect(Math.expm1(mean)).toBeCloseTo(0.05, 6);
    expect(deviation).toBeCloseTo(resolved.volatility, 2);
    expect(resolved.key).toMatch(/^normal:0\.050000:/);
  });

  it("turns a growth before inflation into one after the country's inflation", () => {
    const nominal = settings({ growth: { rate: 0.07, basis: "nominal" } });
    expect(resolveInvestment({ kind: "asset", asset: "world" }, [], nominal).realReturn).toBeCloseTo(1.07 / 1.02 - 1, 12);
    // Brazil's 3% target: the same 7% before inflation is less after it.
    const brazil = { ...nominal, pricesOf: "BR" };
    expect(resolveInvestment({ kind: "asset", asset: "world" }, [], brazil).realReturn).toBeCloseTo(1.07 / 1.03 - 1, 12);
    // A typed inflation wins over the country's.
    const typed = settings({ growth: { rate: 0.07, basis: "nominal" }, inflation: 0.04 });
    expect(resolveInvestment({ kind: "asset", asset: "world" }, [], typed).realReturn).toBeCloseTo(1.07 / 1.04 - 1, 12);
  });

  it("uses typed swings, and grows the same every year with none", () => {
    const calm = resolveInvestment({ kind: "asset", asset: "gold" }, [], settings({ volatility: 0.05 }));
    expect(calm).toMatchObject({ custom: true, simulation: "normal", volatility: 0.05 });
    expect(calm.realReturn).toBeCloseTo(SERIES.gold.averageReturn, 12);
    const flat = resolveInvestment({ kind: "asset", asset: "gold" }, [], settings({ volatility: 0 }));
    expect(flat).toMatchObject({ simulation: "fixed", volatility: 0 });
    expect(flat.returns).toEqual([flat.realReturn]);
  });

  it("changes nothing about the growth or the simulations when only the inflation is typed", () => {
    const resolved = resolveInvestment({ kind: "asset", asset: "sp500" }, [], settings({ inflation: 0.03 }));
    expect(resolved).toMatchObject({ custom: false, customInflation: true, simulation: "history", inflation: 0.03, key: "asset:sp500" });
    expect(resolved.realReturn).toBeCloseTo(SERIES.sp500.averageReturn, 12);
    // A savings rate is before inflation: more inflation, less growth after it.
    expect(resolveInvestment({ kind: "asset", asset: "savings" }, [], settings({ inflation: 0.03 })).realReturn).toBeCloseTo(1.015 / 1.03 - 1, 12);
  });

  it("goes back to the standard figures when the changes are reset", () => {
    const changed = resolveInvestment({ kind: "asset", asset: "bonds" }, [], settings({ growth: { rate: 0.04, basis: "real" }, volatility: 0.2 }));
    const reset = resolveInvestment({ kind: "asset", asset: "bonds" }, [], settings());
    expect(changed.custom).toBe(true);
    expect(reset).toMatchObject({ custom: false, simulation: "history", key: "asset:bonds" });
    expect(reset.realReturn).toBe(changed.standard.realReturn);
    expect(reset.volatility).toBe(changed.standard.volatility);
  });

  it("simulates a mix with changed figures as one normal series", () => {
    const mix = { kind: "mix" as const, parts: [{ asset: "world" as const, weight: 60 }, { asset: "bonds" as const, weight: 40 }], rebalance: false };
    const standard = resolveInvestment(mix, []);
    const changed = resolveInvestment(mix, [], settings({ growth: { rate: 0.03, basis: "real" } }));
    expect(standard.simulation).toBe("joint");
    expect(changed).toMatchObject({ simulation: "normal", realReturn: 0.03 });
    expect(changed.volatility).toBeCloseTo(standard.volatility, 12);
    // Its model stays, for the worst year in the data.
    expect(changed.model).not.toBeNull();
  });
});

describe("Custom growth", () => {
  it("starts from the S&P 500's figures, with no asset behind it, and is always the user's own", () => {
    const resolved = resolveInvestment({ kind: "custom" }, []);
    expect(resolved).toMatchObject({ name: "Custom growth", custom: true, simulation: "normal", period: null, growthText: "your own figure" });
    expect(resolved.realReturn).toBeCloseTo(SERIES.sp500.averageReturn, 12);
    expect(resolved.volatility).toBeCloseTo(seriesVolatility("sp500"), 12);
  });

  it("uses the growth and swings typed", () => {
    const resolved = resolveInvestment({ kind: "custom" }, [], settings({ growth: { rate: 0.06, basis: "real" }, volatility: 0.1 }));
    expect(resolved).toMatchObject({ realReturn: 0.06, volatility: 0.1 });
    expect(resolved.modelText).toBe("simulations with 6% a year after rising prices and ups and downs of ±10%");
    expect(annualizedReturn(resolved.returns)).toBeCloseTo(0.06, 4);
  });
});

describe("inflation and conversions", () => {
  it("reads the Prices of country's reference, or the typed inflation", () => {
    expect(inflationFor(STANDARD_SETTINGS)).toBe(0.02);
    expect(inflationFor(settings({}, "IN"))).toBe(0.04);
    expect(inflationFor(settings({ inflation: 0.035 }, "IN"))).toBe(0.035);
  });

  it("converts growth before and after inflation both ways", () => {
    expect(toNominal(0.05, 0.02)).toBeCloseTo(0.071, 12);
    expect(toReal(0.071, 0.02)).toBeCloseTo(0.05, 12);
    expect(toReal(toNominal(-0.01, 0.03), 0.03)).toBeCloseTo(-0.01, 12);
  });
});

describe("periodText and dividendNote", () => {
  it("say where a growth figure comes from", () => {
    expect(periodText(resolveInvestment({ kind: "asset", asset: "world" }, []))).toBe("1988–2022");
    expect(periodText(resolveInvestment({ kind: "asset", asset: "savings" }, []))).toBe("");
    expect(dividendNote(resolveInvestment({ kind: "asset", asset: "world" }, []))).toBeNull();
    expect(dividendNote(resolveInvestment({ kind: "asset", asset: "nasdaq100" }, []))).toBe("price only: dividends (roughly 1% a year) not included");
    expect(dividendNote({ withoutDividends: 0.3 })).toBe("the Nasdaq-100 part is price only: dividends (roughly 1% a year) not included");
    // The user's own figure is not the index's.
    expect(dividendNote(resolveInvestment({ kind: "asset", asset: "nasdaq100" }, [], settings({ volatility: 0.2 })))).toBeNull();
  });
});
