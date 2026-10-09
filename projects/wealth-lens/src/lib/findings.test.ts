import { describe, expect, it } from "vitest";
import { EN, getI18n } from "@/i18n";
import { calculate, valueAt, type CalculatorPlan } from "./calculator";
import { parseIsoDate } from "./dates";
import { futureValueWithContributions, monthsToGoal } from "./finance";
import {
  allFindings,
  doublingFinding,
  feesFinding,
  focusOf,
  inflationFinding,
  leverFinding,
  ORDER,
  sequenceFinding,
  topFindings,
  waitingFinding,
  type FindingContext,
} from "./findings";
import { INDEXES } from "./indexes";
import { STANDARD_ASSUMPTIONS, type Goal } from "./types";

const ES = getI18n("es");
const formatEurRounded = EN.f.eurRounded;
const formatYears = EN.f.span;

const today = parseIsoDate("2026-09-29");
const r = INDEXES.sp500.averageReturn;

const plan = (overrides: Partial<CalculatorPlan> = {}): CalculatorPlan => ({
  invested: 1000,
  monthlyContribution: 200,
  investment: { kind: "asset", asset: "sp500" },
  years: 20,
  withdrawalRate: 0.04,
  pricesOf: "NL",
  assumptions: STANDARD_ASSUMPTIONS,
  goals: [],
  ...overrides,
});

function context(overrides: Partial<CalculatorPlan> = {}): FindingContext {
  return { calc: calculate(plan(overrides), today), inflation: 0.02, today, i18n: EN };
}

const peru: Goal = { id: "a", kind: "live", country: "PE" };
const ebike: Goal = { id: "b", kind: "buy-own", name: "An e-bike", amount: 2900 };

/** The default: EUR 1,000 and EUR 200/month in US stocks for 20 years, no goals. */
const byDefault = context();
const total = futureValueWithContributions(1000, 200, r, 20);
/** With a first goal: living in Peru, housing included (EUR 210/month → EUR 63,000). */
const small = context({ goals: [peru] });
const n = monthsToGoal(1000, 200, r, 63_000);

describe("the first goal", () => {
  it("is what findings about reaching something are about, when the plan gets there later", () => {
    expect(focusOf(byDefault)).toBeNull();
    expect(focusOf(small)?.goal).toBe(peru);
    // Reached already, or past 60 years: findings speak about the result instead.
    expect(focusOf(context({ invested: 200_000, goals: [peru] }))).toBeNull();
    expect(focusOf(context({ invested: 500, monthlyContribution: 0, goals: [peru] }))).toBeNull();
    // Only the first goal counts.
    expect(focusOf(context({ goals: [ebike, peru] }))?.goal).toBe(ebike);
  });
});

describe("lever: +€100 a month vs +1% vs a year earlier", () => {
  it("speaks in euros at the end of the chosen years when there is no goal", () => {
    const finding = leverFinding(byDefault);
    const gain = futureValueWithContributions(1000, 300, r, 20) - total;
    expect(finding?.value).toBe(`+${formatEurRounded(gain)}`);
    expect(finding?.text).toBe(`€100 more a month gives you ${formatEurRounded(gain)} more by 2046.`);
    expect(finding?.calculation).toHaveLength(4);
  });

  it("speaks in years for the first goal", () => {
    const finding = leverFinding(small);
    const gain = n - monthsToGoal(1000, 300, r, 63_000);
    expect(finding).toMatchObject({ value: formatYears(gain), text: `€100 more a month reaches your first goal ${formatYears(gain)} sooner.` });
    expect(finding?.calculation[0]).toMatch(/^Live in Peru: €63,000 needed, in \d+ years \(20\d\d\)\.$/);
  });

  it("is about the result when the first goal is less than two years away", () => {
    expect(leverFinding(context({ goals: [ebike] }))?.text).toBe(leverFinding(byDefault)?.text);
  });
});

describe("waiting a year", () => {
  it("costs the difference at the end of the chosen years", () => {
    const later = futureValueWithContributions(1000, 200, r, 19);
    const finding = waitingFinding(byDefault);
    expect(finding?.value).toBe(formatEurRounded(total - later));
    expect(finding?.text).toBe(`Starting a year later leaves you ${formatEurRounded(total - later)} less by 2046.`);
  });

  it("is not shown for less than two years", () => {
    expect(waitingFinding(context({ years: 1 }))).toBeNull();
  });
});

describe("far goals", () => {
  // EUR 500 and nothing added, living in Peru: about 67 years.
  const far = context({ invested: 500, monthlyContribution: 0, goals: [peru] });

  it("never quote a date more than 60 years out", () => {
    expect(far.calc.goals[0].reachable).toBe(false);
    const years = allFindings(far).flatMap((finding) => [finding.text, ...finding.calculation].join(" ").match(/\b2\d{3}\b/g) ?? []);
    expect(years.every((year) => Number(year) <= 2026 + 60)).toBe(true);
    const longest = allFindings(context({ years: 60 })).flatMap((finding) => [finding.text, ...finding.calculation].join(" ").match(/\b2\d{3}\b/g) ?? []);
    expect(longest.every((year) => Number(year) <= 2026 + 60)).toBe(true);
  });

  it("still say what does not depend on a date", () => {
    expect(doublingFinding(far)).not.toBeNull();
  });
});

describe("inflation", () => {
  it("gives what the account will show in euros of that year", () => {
    const factor = Math.pow(1.02, 20);
    const finding = inflationFinding(byDefault);
    const shown = formatEurRounded(total * factor);
    expect(finding?.value).toBe(`~${shown}`);
    expect(finding?.text).toBe(`In 2046 your account will show ~${shown}. That is ${formatEurRounded(total)} of today's money.`);
    expect(finding?.calculation[1]).toMatch(/^€[\d,]+ × 1\.49 = €[\d,]+ in euros of 2046\.$/);
  });

  it("follows the chosen years", () => {
    const ten = context({ years: 10 });
    const real = valueAt(ten.calc.scenario, 120);
    expect(inflationFinding(ten)?.text).toBe(
      `In 2036 your account will show ~${formatEurRounded(real * Math.pow(1.02, 10))}. That is ${formatEurRounded(real)} of today's money.`,
    );
  });

  it("is not shown for less than 5 years, or for a few euros", () => {
    expect(inflationFinding(context({ years: 4 }))).toBeNull();
    expect(inflationFinding(context({ invested: 1, monthlyContribution: 0 }))).toBeNull();
  });
});

describe("fees", () => {
  it("compares a 1% fund with a 0.2% one over the chosen years", () => {
    const cheap = futureValueWithContributions(1000, 200, r - 0.002, 20);
    const dear = futureValueWithContributions(1000, 200, r - 0.01, 20);
    expect(feesFinding(byDefault)?.value).toBe(formatEurRounded(cheap - dear));
  });

  it("is not shown for less than 5 years", () => {
    expect(feesFinding(context({ years: 4 }))).toBeNull();
  });
});

describe("a bad first decade", () => {
  it("shows how much less there is by the end after a real bad decade, the one “What if…?” applies", () => {
    const finding = sequenceFinding(byDefault);
    expect(finding?.value).toMatch(/^−€[\d,]+$/);
    expect(finding?.text).toMatch(/^First 10 years like 2000–2009: €[\d,]+ less by 2046\.$/);
    const base = byDefault.calc;
    const decade = calculate(plan(), today, "bad-decade");
    expect(finding?.value).toBe(formatEurRounded(decade.result.total - base.result.total));
  });

  it("shows how much later the first goal comes", () => {
    const finding = sequenceFinding(small);
    expect(finding?.value).toMatch(/^\+\d+ years?$/);
    expect(finding?.text).toMatch(/^First 10 years like 2000–2009: your first goal comes \d+ years? later\.$/);
  });

  it("is not shown for less than 5 years", () => {
    expect(sequenceFinding(context({ years: 4 }))).toBeNull();
    // A first goal that close is not hit by a bad decade: the finding is about the result.
    expect(sequenceFinding(context({ goals: [ebike] }))?.text).toBe(sequenceFinding(byDefault)?.text);
  });
});

describe("doubling time", () => {
  it("is ln 2 ÷ ln(1 + growth)", () => {
    expect(doublingFinding(small)?.value).toBe(formatYears((Math.log(2) / Math.log1p(r)) * 12));
  });

  it("is not shown below 2% growth", () => {
    expect(doublingFinding(context({ investment: { kind: "custom" }, assumptions: { ...STANDARD_ASSUMPTIONS, growth: 0.01 } }))).toBeNull();
  });
});

describe("where the growth comes from, in the assumptions", () => {
  it("names the asset and its years, or says the figure is the user's own", () => {
    expect(doublingFinding(small)?.assumptions[0]).toMatch(/: US stocks, 1988–2022 average\. Past, not a promise\.$/);
    const bonds = doublingFinding(context({ investment: { kind: "asset", asset: "bonds" } }));
    expect(bonds?.assumptions[0]).toMatch(/: German government bonds, 1988–2022 average\./);
    const own = doublingFinding(context({ investment: { kind: "custom" }, assumptions: { ...STANDARD_ASSUMPTIONS, growth: 0.06 } }));
    expect(own?.assumptions[0]).toBe("Growth 6% a year after rising prices, +€125 the first year: your own number. Not a promise.");
    // Step 3's starting 5 % is not the user's own: it is the world's long-run average.
    const starting = doublingFinding(context({ investment: { kind: "custom" }, assumptions: { ...STANDARD_ASSUMPTIONS, growth: 0.05 } }));
    expect(starting?.assumptions[0]).toBe("Growth 5% a year after rising prices, +€105 the first year: the world's long-run average (UBS). Not a promise.");
  });

  it("quotes the inflation of the country whose prices the user chose", () => {
    const finding = inflationFinding({ ...context({ pricesOf: "BR" }), inflation: 0.03 });
    expect(finding?.assumptions[0]).toBe("Prices rise 3% a year: €100 today costs €103 next year.");
  });
});

describe("the findings shown", () => {
  const profiles = {
    byDefault,
    small,
    large: context({ invested: 50_000, monthlyContribution: 1000 }),
    short: context({ years: 3 }),
    goals: context({ goals: [ebike, peru, { id: "c", kind: "amount", amount: 100_000 }] }),
  };

  it("are at most 3, in the fixed order", () => {
    for (const [name, ctx] of Object.entries(profiles)) {
      const shown = topFindings(ctx);
      expect(shown.length, name).toBeGreaterThanOrEqual(1);
      expect(shown.length, name).toBeLessThanOrEqual(3);
      const positions = shown.map((finding) => ORDER.indexOf(finding.id));
      expect([...positions].sort((a, b) => a - b), name).toEqual(positions);
    }
    expect(topFindings(byDefault).map((finding) => finding.id)).toEqual(["lever", "sequence", "inflation"]);
  });

  it("keep their order when the numbers change", () => {
    for (const monthlyContribution of [150, 200, 250, 300]) {
      const ids = topFindings(context({ monthlyContribution })).map((finding) => finding.id);
      const positions = ids.map((id) => ORDER.indexOf(id));
      expect([...positions].sort((a, b) => a - b)).toEqual(positions);
    }
  });

  it("are short, concrete and never tell the user what to do, in English and in Spanish", () => {
    for (const ctx of Object.values(profiles)) {
      for (const i18n of [EN, ES]) {
        for (const finding of allFindings({ ...ctx, i18n })) {
          // "1 %" and "9700 €" are one word each.
          expect(finding.text.replace(/(\d)\u00a0(?=[%€])/g, "$1").split(/\s+/).length, finding.text).toBeLessThanOrEqual(14);
          expect(finding.text, finding.id).not.toMatch(/\b(should|must|need to|recommend|deberías|debes|tienes que|recomend\w*)\b/i);
          expect(finding.calculation.length, finding.id).toBeGreaterThan(0);
          expect(finding.assumptions.length, finding.id).toBeGreaterThan(0);
        }
      }
    }
  });

  it("are the same findings in Spanish, with the same numbers written the Spanish way", () => {
    for (const ctx of Object.values(profiles)) {
      const english = allFindings(ctx);
      const spanish = allFindings({ ...ctx, i18n: ES });
      expect(spanish.map((finding) => finding.id)).toEqual(english.map((finding) => finding.id));
      for (const [index, finding] of spanish.entries()) expect(finding.text).not.toBe(english[index].text);
    }
    const [lever] = allFindings({ ...profiles.byDefault, i18n: ES });
    expect(lever.text).toMatch(/^100\u00a0€ más al mes te da [\d.]+\u00a0€ más en 2046\.$/);
  });
});
