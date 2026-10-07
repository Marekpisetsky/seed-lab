import { describe, expect, it } from "vitest";
import { EN, getI18n } from "@/i18n";
import { seriesVolatility } from "./assets";
import { plainLanguageProblems } from "@seed-kit/plain-language.ts";
import { historicalRiskText, realismWarning, strongGrowthWarning } from "./assumptions";
import { SERIES, SERIES_IDS } from "./indexes";
import { resolveInvestment } from "./investment";
import type { InstrumentPrices, PricesFile } from "./market-format";
import { BEST_20_YEARS, bestRun, beyondHistory, closestHistory, keptRecords, STRONG_GROWTH } from "./realism";
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
  it("appears only above the best 20 years, with the figure and the years from the data", () => {
    expect(realismWarning(typed(0.12), EN)).toBeNull();
    expect(realismWarning(typed(BEST_20_YEARS.growth - 0.0001), EN)).toBeNull();
    expect(realismWarning(typed(0.15), EN)).toBe("Very rare: the best 20 years in the data gave 13%.");
    expect(plain(realismWarning(typed(0.15), ES))).toBe("Muy raro: los mejores 20 años de los datos dieron un 13 %.");
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
    expect(realismWarning(typed(0.06), EN, made)).toBe("Very rare: the best 20 years in the data gave 5%.");
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

describe("a growth over 50% a year: what the data has kept", () => {
  /** A company's stored prices: its calendar years, and its growth a year since October 2016. */
  const company = (years: Record<string, number>, perYear: number): InstrumentPrices => ({
    symbol: "X",
    currency: "USD",
    source: "yahoo",
    date: "2026-10-06",
    close: 1,
    change1y: null,
    growth: { from: "2016-10-07", perYear },
    stats: { from: "2016-10-07", to: "2026-10-06", volatility: 0.5, years },
  });
  const market: PricesFile = {
    version: 1,
    updatedAt: null,
    prices: {
      NVDA: company({ "2017": 0.8, "2018": -0.3, "2019": 0.76, "2020": 1.2, "2021": 1.25, "2022": -0.5, "2023": 2.4, "2024": 1.7, "2025": 0.4 }, 0.643),
      TSLA: company({ "2017": 0.4, "2018": 0.07, "2019": 0.26, "2020": 7.4, "2021": 0.5, "2022": -0.65, "2023": 1.0, "2024": 0.6, "2025": 0.1 }, 0.401),
      // A fund is an index, not a company: never a record here.
      VUAA: company({ "2025": 9 }, 9),
    },
  };
  const money = { years: 20, invested: 1100, monthly: 0 };
  const words = (text: string | null, i18n = EN) => plainLanguageProblems([{ path: "growth.strong", text: text ?? "" }], i18n.locale);

  it("is only for more than 50%: up to it, the warning on the best 20 years stays", () => {
    expect(STRONG_GROWTH).toBe(0.5);
    expect(strongGrowthWarning(0.5, money, EN, market)).toBeNull();
    expect(realismWarning(typed(0.5), EN)).not.toBeNull();
  });

  it("keeps each index's and each company's best average over the plan's years, or over all it has", () => {
    const records = keptRecords(20, market);
    // Ten years of a company's prices is all there is: its growth since 2016.
    expect(records[0]).toEqual({ kind: "stock", id: "NVDA", growth: 0.643, years: 10, from: 2016, to: 2026 });
    expect(records.map((record) => record.id)).not.toContain("VUAA");
    // Three calendar years in a row: TSLA's 2019–2021 first, then NVDA's 2023–2025.
    expect(keptRecords(3, market).slice(0, 2)).toMatchObject([
      { id: "TSLA", years: 3, from: 2019, to: 2021 },
      { id: "NVDA", years: 3, from: 2023, to: 2025 },
    ]);
    expect(keptRecords(3, market)[1].growth).toBeCloseTo((3.4 * 2.7 * 1.4) ** (1 / 3) - 1, 12);
  });

  it("says no index or large company kept it, and what the user's money would be at that pace", () => {
    const text = strongGrowthWarning(0.7, money, EN, market);
    expect(text).toBe(`No index or large company has kept this up: 70% on average for 20 years. At that pace, your €1,100 would be ${EN.f.eur(1100 * 1.7 ** 20)}.`);
    expect(EN.f.eur(1100 * 1.7 ** 20)).toBe("€44,706,545");
    expect(plain(strongGrowthWarning(0.7, money, ES, market))).toBe("Ningún índice ni gran empresa ha mantenido esto: un 70 % de media durante 20 años. A ese ritmo, tus 1100 € serían 44.706.545 €.");
  });

  it("names the one that did, and for how long, when one did: never a claim the data denies", () => {
    // NVDA kept 64% a year for its 10 years of prices: 60% for 20 years is beyond the data, but not for 10.
    expect(strongGrowthWarning(0.6, money, EN, market)).toMatch(/^60% on average for 20 years: only NVDA did, and only for 10 years \(2016–2026\)\. At that pace/);
    expect(strongGrowthWarning(0.6, { ...money, years: 10 }, EN, market)).toMatch(/^60% on average for 10 years: only NVDA has done it \(2016–2026\)\./);
    expect(plain(strongGrowthWarning(0.6, money, ES, market))).toMatch(/^Un 60 % de media durante 20 años: solo NVDA lo logró, y solo durante 10 años \(2016–2026\)\./);
    // Over 3 years, TSLA and NVDA both did 70%: the best is named.
    expect(strongGrowthWarning(0.7, { ...money, years: 3 }, EN, market)).toMatch(/^70% on average for 3 years: very few have done it, like TSLA \(2019–2021\)\./);
  });

  it("writes 500% for 20 years as a power of ten, and the monthly amount when nothing is there today", () => {
    expect(strongGrowthWarning(5, money, EN, market)).toBe("No index or large company has kept this up: 500% on average for 20 years. At that pace, your €1,100 would be €4.02 × 10¹⁸.");
    expect(plain(strongGrowthWarning(5, money, ES, market))).toMatch(/A ese ritmo, tus 1100 € serían 4,02 × 10¹⁸ €\.$/);
    expect(strongGrowthWarning(0.7, { years: 20, invested: 0, monthly: 100 }, EN, market)).toMatch(/At that pace, your €100 a month would be €\d/);
    expect(strongGrowthWarning(0.7, { years: 20, invested: 0, monthly: 0 }, EN, market)).toBe("No index or large company has kept this up: 70% on average for 20 years.");
  });

  it("reads plainly in both languages", () => {
    for (const growth of [0.6, 0.7, 5]) {
      for (const years of [3, 10, 20]) {
        expect(words(strongGrowthWarning(growth, { ...money, years }, EN, market))).toEqual([]);
        expect(words(strongGrowthWarning(growth, { ...money, years }, ES, market), ES)).toEqual([]);
      }
    }
  });
});
