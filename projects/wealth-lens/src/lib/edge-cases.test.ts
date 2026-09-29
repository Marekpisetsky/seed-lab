/**
 * Tiny, empty and huge inputs: every number the report shows must still be
 * sensible. Each case checks what it says, and that nothing in the headline,
 * the findings or the levers reads NaN, Infinity, "-€0" or a year more than
 * 60 years away.
 */

import { describe, expect, it } from "vitest";
import { parseIsoDate } from "./dates";
import { allFindings } from "./findings";
import { buildLevers } from "./levers";
import { buildReport, formatSmallEur, type Report, type ReportPlan } from "./report";

const today = parseIsoDate("2026-09-29");

const plan = (overrides: Partial<ReportPlan> = {}): ReportPlan => ({
  invested: 1000,
  monthlyContribution: 200,
  investment: { kind: "index", index: "sp500" },
  withdrawalRate: 0.04,
  inflation: 0.02,
  housing: "rent",
  homeCountry: "NL",
  mission: { kind: "stop-working" },
  horizonYears: null,
  customConnections: [],
  ...overrides,
});

/** Every text the report shows for this plan. */
function texts(report: Report): string[] {
  const { headline } = report;
  const levers = buildLevers(report, []);
  const numbers = [headline.today, headline.future?.when, headline.future?.value, ...(headline.instead ?? []).map((option) => option.monthly)];
  return [
    headline.meaning,
    ...numbers.flatMap((number) => (number ? [number.text, ...number.explain] : [])),
    ...allFindings(report, []).flatMap((finding) => [finding.value, finding.text, ...finding.calculation]),
    levers.monthly.up.text,
    levers.monthly.down?.text ?? "",
    ...[...levers.investment, ...levers.horizon, ...(levers.withdrawal ?? [])].flatMap((option) => [
      option.detail,
      option.effect?.text ?? "",
    ]),
  ];
}

function expectSensible(report: Report) {
  for (const text of texts(report)) {
    expect(text).not.toMatch(/NaN|Infinity|undefined|-€0\b|€-/);
    for (const year of text.match(/\b2\d{3}\b/g) ?? []) expect(Number(year), text).toBeLessThanOrEqual(2026 + 60);
  }
}

describe("€1 invested, nothing added", () => {
  const report = buildReport(plan({ invested: 1, monthlyContribution: 0 }), [], today);

  it("pays 'under €1' a month, not €0", () => {
    expect(report.headline.today.text).toBe("under €1/month");
    expect(report.headline.today.explain[1]).toBe("× 4% taken out a year ÷ 12 = under €1 a month");
  });

  it("is not reachable, and says what 20 and 30 years would take", () => {
    expect(report.answer.reachable).toBe(false);
    const monthly = report.headline.instead?.map((option) => Number(option.monthly.text.replace(/[^\d]/g, ""))) ?? [];
    expect(monthly).toHaveLength(2);
    expect(monthly[0]).toBeGreaterThan(monthly[1]);
    expect(monthly[1]).toBeGreaterThan(0);
  });

  it("shows only findings that do not need a date", () => {
    expect(allFindings(report, []).map((finding) => finding.id)).toEqual(["doubling"]);
    expectSensible(report);
  });
});

describe("nothing invested, nothing added", () => {
  const report = buildReport(plan({ invested: 0, monthlyContribution: 0 }), [], today);

  it("pays €0 and is not reachable", () => {
    expect(report.headline.today.text).toBe("€0/month");
    expect(report.answer.reachable).toBe(false);
    expectSensible(report);
  });

  it("looking 10 years ahead, has no '-€0' bad-decade card", () => {
    const ahead = buildReport(plan({ invested: 0, monthlyContribution: 0, horizonYears: 10 }), [], today);
    expect(allFindings(ahead, []).map((finding) => finding.id)).not.toContain("sequence");
    expectSensible(ahead);
  });
});

describe("€1,000 invested, nothing added", () => {
  it("grows on its own but not within 60 years; €50 a month would get there", () => {
    const report = buildReport(plan({ monthlyContribution: 0 }), [], today);
    expect(report.answer.reachable).toBe(false);
    expect(buildLevers(report, []).monthly.up.text).toMatch(/^reachable in \d+ years$/);
    expectSensible(report);
  });
});

describe("€10,000,000 invested", () => {
  const report = buildReport(plan({ invested: 10_000_000 }), [], today);

  it("is already enough, and says so once", () => {
    expect(report.headline).toMatchObject({ future: null, instead: null, meaning: "already enough to stop working" });
    expect(report.headline.today.text).toBe("€33,333/month");
  });

  it("has no findings dated after a goal already reached", () => {
    const ids = allFindings(report, []).map((finding) => finding.id);
    for (const id of ["lever", "waiting", "inflation", "fees", "sequence", "growth-share"]) expect(ids).not.toContain(id);
    expectSensible(report);
  });

  it("says 'already reached' instead of 'same time' on the levers", () => {
    const levers = buildLevers(report, []);
    expect(levers.monthly.up.text).toBe("already reached");
    expect(levers.investment.find((option) => !option.selected)?.effect?.text).toBe("already reached");
  });

  it("buying a home leaves the rest invested", () => {
    const home = buildReport(plan({ invested: 10_000_000, monthlyContribution: 0, mission: { kind: "buy", item: "home-nl" } }), [], today);
    expect(home.headline.meaning).toBe("already enough for an average Dutch home, fully paid");
    expect(home.purchase).toMatchObject({ buyMonths: 0, before: 10_000_000, after: 9_520_000 });
    expectSensible(home);
  });
});

describe("€1,000,000 added a month", () => {
  it("gets there in a month", () => {
    const report = buildReport(plan({ invested: 0, monthlyContribution: 1_000_000 }), [], today);
    expect(report.headline.future?.when.text).toBe("1 month");
    expectSensible(report);
  });
});

describe("€1 invested, a used car", () => {
  it("has no purchase note for a purchase out of reach", () => {
    const report = buildReport(plan({ invested: 1, monthlyContribution: 0, mission: { kind: "buy", item: "used-car" } }), [], today);
    expect(report.answer.reachable).toBe(false);
    expect(report.purchase).toBeNull();
    expectSensible(report);
  });
});

describe("no growth, or a loss, every year", () => {
  it("stays sensible at 0% and at -2% a year", () => {
    for (const realReturn of [0, -0.02]) {
      const report = buildReport(plan({ investment: { kind: "custom", realReturn } }), [], today);
      expect(report.answer.reachable).toBe(false);
      expect(report.headline.instead?.every((option) => /^€[\d,]+\/month$/.test(option.monthly.text))).toBe(true);
      expectSensible(report);
    }
  });
});

describe("formatSmallEur", () => {
  it("says 'under €1' for a few cents, and whole euros otherwise", () => {
    expect(formatSmallEur(0.003)).toBe("under €1");
    expect(formatSmallEur(0)).toBe("€0");
    expect(formatSmallEur(0.6)).toBe("€1");
    expect(formatSmallEur(1234.4)).toBe("€1,234");
  });
});
