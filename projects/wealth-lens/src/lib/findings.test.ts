import { describe, expect, it } from "vitest";
import { priceHoldings } from "./auto-price";
import { parseIsoDate } from "./dates";
import { futureValueWithContributions, monthsToGoal } from "./finance";
import {
  allFindings,
  concentrationFinding,
  currencyFinding,
  doublingFinding,
  feesFinding,
  geographyFinding,
  growthShareFinding,
  inflationFinding,
  leverFinding,
  sequenceFinding,
  stockPastFinding,
  topFindings,
  waitingFinding,
  withdrawalFinding,
  type FindingContext,
} from "./findings";
import { formatEurRounded, formatYears } from "./format";
import { INDEXES } from "./indexes";
import { MARKET } from "./market-data";
import { parsePricesFile } from "./market-format";
import { buildReport, type ReportPlan } from "./report";
import type { Holding } from "./types";

const today = parseIsoDate("2026-09-29");
const r = INDEXES.sp500.averageReturn;

const plan = (overrides: Partial<ReportPlan> = {}): ReportPlan => ({
  invested: 1000,
  monthlyContribution: 200,
  investment: { kind: "index", index: "sp500" },
  withdrawalRate: 0.04,
  inflation: 0.02,
  housing: "rent",
  homeCountry: "NL",
  pinned: null,
  horizonYears: null,
  customConnections: [],
  ...overrides,
});

const holding = (ticker: string, quantity: number, price: number, currency = "EUR"): Holding => ({
  id: ticker,
  ticker,
  quantity,
  costBasis: quantity * price,
  currency,
  currentPrice: price,
  priceSource: "manual",
  priceDate: null,
});

function context(overrides: Partial<ReportPlan> = {}, holdings: Holding[] = []): FindingContext {
  const priced = priceHoldings(holdings);
  return { report: buildReport(plan(overrides), priced, today), holdings: priced, market: MARKET };
}

/** Profile 1: EUR 1,000 and EUR 200/month; the goal is living in India (EUR 99,000). */
const small = context();
const n = monthsToGoal(1000, 200, r, 99_000);
/** Profile 3: 70% of the portfolio in ASML. */
const concentrated = context({ monthlyContribution: 300 }, [holding("ASML", 9, 1601.2), holding("VWCE", 36, 169.4)]);

describe("lever: +€100 a month vs +1% vs a year earlier", () => {
  it("reports the strongest lever in years", () => {
    const finding = leverFinding(small);
    const gain = n - monthsToGoal(1000, 300, r, 99_000);
    expect(finding).toMatchObject({ value: formatYears(gain), text: `Adding €100 a month gets you there ${formatYears(gain)} earlier.` });
    expect(finding?.calculation).toHaveLength(4);
    expect(finding?.calculation[3]).toBe("Starting a year earlier: 1 year earlier.");
  });

  it("is not shown when the goal is already reached or less than two years away", () => {
    expect(leverFinding(context({ invested: 200_000, pinned: "country:IN" }))).toBeNull();
    expect(leverFinding(context({ pinned: "buy:e-bike" }))).toBeNull();
  });

  it("speaks in euros when looking a fixed number of years ahead", () => {
    const finding = leverFinding(context({ horizonYears: 10 }));
    expect(finding?.value).toMatch(/^\+€\d+\/month$/);
    expect(finding?.text).toMatch(/more in 2036\.$/);
  });
});

describe("waiting a year", () => {
  it("costs the difference at the goal's date", () => {
    const now = futureValueWithContributions(1000, 200, r, n / 12);
    const later = futureValueWithContributions(1000, 200, r, (n - 12) / 12);
    const finding = waitingFinding(small);
    expect(finding?.value).toBe(formatEurRounded(now - later));
    expect(finding?.text).toBe(`Starting a year later leaves you ${formatEurRounded(now - later)} less by 2046.`);
  });

  it("is not shown for a goal under two years away", () => {
    expect(waitingFinding(context({ pinned: "buy:e-bike" }))).toBeNull();
  });
});

describe("inflation", () => {
  it("gives the goal's worth in today's euros", () => {
    const factor = Math.pow(1.02, n / 12);
    const finding = inflationFinding(small);
    expect(finding?.value).toBe(formatEurRounded(99_000 / factor));
    expect(finding?.text).toMatch(/^€99,000 in 20\d\d buys what €[\d,]+ buys today\.$/);
  });

  it("is not shown for a goal less than 5 years away", () => {
    expect(inflationFinding(context({ pinned: "buy:e-bike" }))).toBeNull();
  });
});

describe("fees", () => {
  it("compares a 1% fund with a 0.2% one over the horizon", () => {
    const cheap = futureValueWithContributions(1000, 200, r - 0.002, n / 12);
    const dear = futureValueWithContributions(1000, 200, r - 0.01, n / 12);
    expect(feesFinding(small)?.value).toBe(formatEurRounded(cheap - dear));
  });

  it("is not shown for a short horizon", () => {
    expect(feesFinding(context({ pinned: "buy:e-bike" }))).toBeNull();
  });
});

describe("geography", () => {
  it("shows how much sooner the cheapest place comes than home", () => {
    const report = small.report;
    const home = report.statuses.find((status) => status.connection.id === "life:stop-working");
    const finding = geographyFinding(small);
    expect(finding?.value).toBe(formatYears((home?.months ?? 0) - n));
    expect(finding?.text).toMatch(/^Living in India comes \d+ years before the Netherlands\.$/);
  });

  it("counts the countries already covered", () => {
    // EUR 120,000 pays EUR 400/month: India (330) and Egypt (370).
    const finding = geographyFinding(context({ invested: 120_000 }));
    expect(finding).toMatchObject({ value: "2 countries", text: "Your money already covers living costs in 2 countries." });
  });

  it("is not shown when home is (nearly) the cheapest", () => {
    expect(geographyFinding(context({ homeCountry: "IN" }))).toBeNull();
  });
});

describe("concentration", () => {
  it("flags one stock over 40% of the portfolio, with its worst fall", () => {
    const finding = concentrationFinding(concentrated);
    expect(finding).toMatchObject({ value: "70%", text: "70% of your portfolio rides on ASML alone.", tone: "warning" });
    expect(finding?.calculation.join(" ")).toMatch(/Worst fall from a peak since 2016: -48%/);
  });

  it("does not count index funds, and needs more than 40%", () => {
    expect(concentrationFinding(context({}, [holding("VWCE", 90, 169.4), holding("ASML", 1, 1601.2)]))).toBeNull();
    expect(concentrationFinding(context({}, [holding("ASML", 2, 1601.2), holding("VWCE", 30, 169.4)]))).toBeNull();
    expect(concentrationFinding(small)).toBeNull();
  });
});

describe("currency", () => {
  it("says what is left out for being in another currency", () => {
    const finding = currencyFinding(context({}, [holding("VWCE", 10, 169.4), holding("NVDA", 5, 228, "USD")]));
    expect(finding).toMatchObject({ value: "$1,140", text: "Your $1,140 in US dollars isn't counted: no currency conversion." });
    expect(finding?.calculation.at(-1)).toBe("Counted: €1,694 in euros.");
  });

  it("is not shown when everything is in euros", () => {
    expect(currencyFinding(concentrated)).toBeNull();
  });
});

describe("a bad first decade", () => {
  it("shows how much later the goal comes after a 1-in-10 start", () => {
    const finding = sequenceFinding(small);
    expect(finding?.value).toMatch(/^\+\d+ years?$/);
    expect(finding?.text).toMatch(/^A bad first decade \(1 in 10\) pushes it back \d+ years?\.$/);
  });

  it("is not shown for a goal under 5 years away", () => {
    expect(sequenceFinding(context({ pinned: "buy:e-bike" }))).toBeNull();
  });
});

describe("withdrawal rate", () => {
  it("warns when the rate ran out of money in more than 1 history in 10", () => {
    const finding = withdrawalFinding(context({ withdrawalRate: 0.07 }));
    expect(finding?.tone).toBe("warning");
    expect(finding?.text).toMatch(/^At 7% a year, the money ran out in \d+% of histories\.$/);
  });

  it("shows that even 4% ran out in about 1 history in 8 with the S&P 500", () => {
    expect(withdrawalFinding(small)).toMatchObject({ value: "1 in 8", text: "At 4% a year, the money ran out in 12% of histories." });
  });

  it("is not shown at 3%, or for a purchase", () => {
    expect(withdrawalFinding(context({ withdrawalRate: 0.03 }))).toBeNull();
    expect(withdrawalFinding(context({ withdrawalRate: 0.07, pinned: "buy:new-car" }))).toBeNull();
  });
});

describe("growth share", () => {
  it("says how much of the money is growth by the goal's date", () => {
    const total = futureValueWithContributions(50_000, 1000, r, 240 / 12);
    const finding = growthShareFinding(context({ invested: 50_000, monthlyContribution: 1000, horizonYears: 20 }));
    expect(finding?.value).toBe(`${Math.round(((total - 50_000 - 240_000) / total) * 100)}%`);
  });

  it("is not shown when growth is less than 30%", () => {
    expect(growthShareFinding(context({ horizonYears: 5 }))).toBeNull();
  });
});

describe("doubling time", () => {
  it("is ln 2 ÷ ln(1 + growth)", () => {
    expect(doublingFinding(small)?.value).toBe(formatYears((Math.log(2) / Math.log1p(r)) * 12));
  });

  it("is not shown below 2% growth", () => {
    expect(doublingFinding(context({ investment: { kind: "custom", realReturn: 0.01 } }))).toBeNull();
  });
});

describe("a single stock as the investment", () => {
  it("contrasts its past with the index used to project it", () => {
    const market = parsePricesFile({
      prices: {
        NVDA: { symbol: "NVDA", currency: "USD", source: "yahoo", date: "2026-09-29", close: 228, change1y: 0.25, spark: [], growth: { from: "2016-09-29", perYear: 0.6337 } },
      },
    });
    const finding = stockPastFinding({ ...context({ investment: { kind: "stock", id: "NVDA" } }), market });
    expect(finding).toMatchObject({ value: "63%/yr", text: "NVIDIA grew 63% a year; projections use the Nasdaq-100's 10.8%." });
  });

  it("is not shown for an index", () => {
    expect(stockPastFinding(small)).toBeNull();
  });
});

describe("the findings shown", () => {
  const profiles = {
    small,
    large: context({ invested: 50_000, monthlyContribution: 1000 }),
    concentrated,
    horizon: context({ horizonYears: 15 }),
    purchase: context({ pinned: "buy:new-car" }),
  };

  it("are 3 to 5, biggest impact first", () => {
    for (const [name, ctx] of Object.entries(profiles)) {
      const shown = topFindings(ctx.report, ctx.holdings);
      expect(shown.length, name).toBeGreaterThanOrEqual(3);
      expect(shown.length, name).toBeLessThanOrEqual(5);
      const impacts = shown.map((finding) => finding.impact);
      expect([...impacts].sort((a, b) => b - a), name).toEqual(impacts);
    }
  });

  it("put the risk of a concentrated portfolio at the top", () => {
    expect(topFindings(concentrated.report, concentrated.holdings)[0].id).toBe("concentration");
  });

  it("are short, concrete and never tell the user what to do", () => {
    for (const ctx of Object.values(profiles)) {
      for (const finding of allFindings(ctx.report, ctx.holdings)) {
        expect(finding.text.split(/\s+/).length, finding.text).toBeLessThanOrEqual(13);
        expect(finding.text, finding.id).not.toMatch(/\b(should|must|need to|recommend)\b/i);
        expect(finding.calculation.length, finding.id).toBeGreaterThan(0);
        expect(finding.assumptions.length, finding.id).toBeGreaterThan(0);
      }
    }
  });
});
