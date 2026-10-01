import { describe, expect, it } from "vitest";
import { EN, getI18n } from "@/i18n";
import { seriesVolatility } from "./assets";
import { historicalRiskText, realismWarning } from "./assumptions";
import { SERIES, SERIES_IDS } from "./indexes";
import { resolveInvestment } from "./investment";
import { BEST_20_YEARS, bestRun, beyondHistory, closestHistory } from "./realism";
import { STANDARD_ASSUMPTIONS } from "./types";

const ES = getI18n("es");
/** Spanish keeps "13 %" together with a no-break space; compared as plain spaces. */
const plain = (text: string | null) => text?.replace(/[\u00a0\u202f]/g, " ") ?? null;
/** The plan's investment with a growth typed as banks quote it, in the Netherlands (2% rising prices). */
const typed = (afterPrices: number, investment: Parameters<typeof resolveInvestment>[0] = { kind: "asset", asset: "sp500" }) =>
  resolveInvestment(investment, [], { pricesOf: "NL", assumptions: { ...STANDARD_ASSUMPTIONS, growth: afterPrices } });

/** Every 20-year run of every dataset, worked out the long way. */
function allRuns(): { asset: string; from: number; growth: number }[] {
  return SERIES_IDS.flatMap((asset) => {
    const years = SERIES[asset].dataset.years;
    return years.slice(0, years.length - 19).map((entry, start) => {
      let product = 1;
      for (let i = start; i < start + 20; i++) product *= 1 + years[i].realReturn;
      return { asset, from: entry.year, growth: product ** (1 / 20) - 1 };
    });
  });
}

describe("the best 20 years in the data", () => {
  it("is worked out from the datasets: the highest steady growth of any asset over 20 years in a row", () => {
    const runs = allRuns();
    const best = runs.reduce((top, run) => (run.growth > top.growth ? run : top));
    expect(BEST_20_YEARS).toMatchObject({ asset: best.asset, from: best.from, to: best.from + 19 });
    expect(BEST_20_YEARS.growth).toBeCloseTo(best.growth, 12);
    expect(runs.every((run) => run.growth <= BEST_20_YEARS.growth + 1e-12)).toBe(true);
  });

  it("is today the S&P 500's 1980s and 1990s, about 13% a year after rising prices", () => {
    expect(BEST_20_YEARS).toMatchObject({ asset: "sp500", from: 1980, to: 1999 });
    expect(BEST_20_YEARS.growth).toBeGreaterThan(0.12);
    expect(BEST_20_YEARS.growth).toBeLessThan(0.14);
  });

  it("is above every asset's own average, so no standard figure is ever warned about", () => {
    for (const asset of SERIES_IDS) expect(beyondHistory(SERIES[asset].averageReturn)).toBe(false);
    expect(bestRun(10).growth).toBeGreaterThanOrEqual(BEST_20_YEARS.growth);
  });
});

describe("the realism warning under the growth", () => {
  it("appears only above the best 20 years, with the figure, the index and the years from the data", () => {
    expect(realismWarning(typed(0.12), EN)).toBeNull();
    expect(realismWarning(typed(BEST_20_YEARS.growth - 0.0001), EN)).toBeNull();
    expect(realismWarning(typed(0.15), EN)).toBe("Very rare: no broad index kept this for 20 years. The best was 13% (S&P 500, 1980–1999).");
    expect(plain(realismWarning(typed(0.15), ES))).toBe("Muy raro: ningún índice amplio lo mantuvo 20 años. El mejor fue 13 % (S&P 500, 1980–1999).");
  });

  it("compares the growth after rising prices, whatever the inflation", () => {
    // 12% after rising prices is under the best; 14% is above it, with any inflation.
    const twelve = resolveInvestment({ kind: "custom" }, [], { pricesOf: "NL", assumptions: { ...STANDARD_ASSUMPTIONS, growth: 0.12, inflation: 0.1 } });
    expect(realismWarning(twelve, EN)).toBeNull();
    const fourteen = resolveInvestment({ kind: "custom" }, [], { pricesOf: "NL", assumptions: { ...STANDARD_ASSUMPTIONS, growth: 0.14, inflation: 0 } });
    expect(realismWarning(fourteen, EN)).not.toBeNull();
  });

  it("uses whatever the data says is best", () => {
    const made = { asset: "gold" as const, from: 2001, to: 2020, growth: 0.05 };
    expect(realismWarning(typed(0.06), EN, made)).toBe("Very rare: no broad index kept this for 20 years. The best was 5% (Gold, 2001–2020).");
  });
});

describe("how much assets growing about as much moved", () => {
  it("names the asset with the closest average growth, and its ups and downs", () => {
    expect(closestHistory(0.072)).toEqual({ asset: "sp500", growth: SERIES.sp500.averageReturn, volatility: seriesVolatility("sp500") });
    expect(closestHistory(0.12).asset).toBe("nasdaq100");
    expect(closestHistory(0.04).asset).toBe("world");
    expect(closestHistory(0.02).asset).toBe("bonds");
    expect(closestHistory(0).asset).toBe("gold");
  });

  it("is a line under the ups and downs, which stay the user's to change", () => {
    expect(historicalRiskText(typed(0.072), EN)).toBe("Historically, assets growing about 7.5% moved about ±16% a year.");
    expect(plain(historicalRiskText(typed(0.072), ES))).toBe("Históricamente, lo que creció un 7,5 % se movió unos ±16 % al año.");
    // Changing the ups and downs does not change it: it is about the growth.
    const calm = resolveInvestment({ kind: "asset", asset: "sp500" }, [], { pricesOf: "NL", assumptions: { ...STANDARD_ASSUMPTIONS, volatility: 0.02 } });
    expect(historicalRiskText(calm, EN)).toBe("Historically, assets growing about 7.5% moved about ±16% a year.");
    expect(historicalRiskText(typed(0.12), EN)).toBe("Historically, assets growing about 9.9% moved about ±30% a year.");
  });

  it("says nothing for a savings account, which has no ups and downs", () => {
    expect(historicalRiskText(resolveInvestment({ kind: "asset", asset: "savings" }, []), EN)).toBeNull();
  });
});
