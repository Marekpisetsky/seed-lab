import { describe, expect, it } from "vitest";
import { parseNumber } from "@seed-kit/format.ts";
import { EN, getI18n } from "@/i18n";
import { parseLooseNumber } from "./number";

const ES = getI18n("es");
const {
  dayMonth: formatDayMonth,
  duration: formatDuration,
  cur: formatEur,
  curRounded: formatEurRounded,
  money: formatMoney,
  monthYear: formatMonthYear,
  number: formatNumber,
  percent: formatPercent,
  price: formatPrice,
  rate: formatRate,
  span: formatYears,
} = EN.f;

describe("formatRate", () => {
  it("drops needless decimals", () => {
    expect(formatRate(0.04)).toBe("4%");
    expect(formatRate(0.045)).toBe("4.5%");
    expect(formatRate(0.07)).toBe("7%");
  });
});

describe("formatMoney", () => {
  it("formats amounts with the currency symbol", () => {
    expect(formatMoney(1967.1513, "EUR")).toBe("€1,967.15");
    expect(formatMoney(1234567.89, "EUR", { decimals: 0 })).toBe("€1,234,568");
  });

  it("signs gains and losses when asked", () => {
    expect(formatMoney(250, "EUR", { signed: true })).toBe("+€250.00");
    expect(formatMoney(-250, "USD", { signed: true })).toBe("−$250.00");
    expect(formatMoney(0, "EUR", { signed: true })).toBe("€0.00");
  });

  it("writes a loss with the true minus sign (−), which every reader of typed numbers reads back", () => {
    for (const text of [formatMoney(-250, "EUR", { signed: true }), formatEur(-1234), formatPercent(-0.05), formatNumber(-2.5), ES.f.cur(-1234)]) {
      expect(text).toMatch(/^\u2212|\u2212\d/);
      expect(text).not.toContain("-");
    }
    expect(parseLooseNumber("\u22122,5", true)).toBe(-2.5);
    expect(parseLooseNumber("\u22121,234")).toBe(-1234);
    expect(parseNumber("\u22122,5", ",")).toBe(-2.5);
    expect(parseNumber("-2.5", ".")).toBe(-2.5);
  });

  it("falls back to the code for currencies without a symbol", () => {
    // Intl separates the code with a no-break space (U+00A0).
    expect(formatMoney(12.5, "GBX")).toBe("GBX\u00A012.50");
  });
});

describe("formatPercent / formatNumber", () => {
  it("formats fractions as percentages", () => {
    expect(formatPercent(0.0914)).toBe("9.1%");
    expect(formatPercent(0.07, { decimals: 0 })).toBe("7%");
    expect(formatPercent(-0.2, { signed: true })).toBe("−20.0%");
    expect(formatPercent(0.25, { signed: true })).toBe("+25.0%");
  });

  it("formats plain numbers without trailing zeros", () => {
    expect(formatNumber(2.5)).toBe("2.5");
    expect(formatNumber(0.123456789)).toBe("0.1235");
    expect(formatNumber(1500)).toBe("1,500");
  });
});

describe("formatPrice", () => {
  it("always shows cents, and more precision for prices under 1", () => {
    expect(formatPrice(233.3)).toBe("233.30");
    expect(formatPrice(1234.5678)).toBe("1,234.57");
    expect(formatPrice(0.12345)).toBe("0.1235");
  });
});

describe("formatDuration", () => {
  it.each([
    [0, "0 months"],
    [1, "1 month"],
    [0.2, "1 month"],
    [12, "1 year"],
    [13, "1 year 1 month"],
    [115.17, "9 years 8 months"],
    [24, "2 years"],
    [Infinity, "never"],
  ])("formats %d months as %j", (months, expected) => {
    expect(formatDuration(months)).toBe(expected);
  });
});

describe("formatMonthYear", () => {
  it("formats in UTC", () => {
    expect(formatMonthYear(new Date(Date.UTC(2036, 5, 1)))).toBe("Jun 2036");
  });
});

describe("formatDayMonth", () => {
  it("formats a trading day as DD/MM", () => {
    expect(formatDayMonth("2026-09-05")).toBe("05/09");
  });
});

describe("formatEur / formatYears", () => {
  it("formats whole euros, optionally signed", () => {
    expect(formatEur(1234.5)).toBe("€1,235");
    expect(formatEur(-50)).toBe("−€50");
    expect(formatEur(5400, { signed: true })).toBe("+€5,400");
  });

  it("rounds time the way people say it", () => {
    expect(formatYears(0.2)).toBe("1 month");
    expect(formatYears(3)).toBe("3 months");
    expect(formatYears(11.4)).toBe("11 months");
    expect(formatYears(12)).toBe("1 year");
    expect(formatYears(17)).toBe("1 year");
    expect(formatYears(18)).toBe("2 years");
    expect(formatYears(-30)).toBe("3 years");
    expect(formatYears(Infinity)).toBe("never");
  });
});

describe("formatEurRounded", () => {
  it("rounds like a brief: two or three significant figures", () => {
    expect(formatEurRounded(66_827)).toBe("€67,000");
    expect(formatEurRounded(443_049)).toBe("€443,000");
    expect(formatEurRounded(8429)).toBe("€8,400");
    expect(formatEurRounded(456)).toBe("€460");
    expect(formatEurRounded(42)).toBe("€42");
    expect(formatEurRounded(-5230, { signed: true })).toBe("−€5,200");
  });
});


describe("in Spanish", () => {
  const nbsp = "\u00a0";

  it("writes money, percents and numbers the Spanish way", () => {
    expect(ES.f.cur(112_288)).toBe(`112.288${nbsp}€`);
    expect(ES.f.cur(5400, { signed: true })).toBe(`+5400${nbsp}€`);
    expect(ES.f.money(1967.1513, "EUR")).toBe(`1967,15${nbsp}€`);
    expect(ES.f.percent(0.0914)).toBe(`9,1${nbsp}%`);
    expect(ES.f.rate(0.045)).toBe(`4,5${nbsp}%`);
    expect(ES.f.number(1500.5)).toBe("1500,5");
    expect(ES.f.fixed(0.9, 2)).toBe("0,90");
    expect(ES.f.curRounded(66_827)).toBe(`67.000${nbsp}€`);
  });

  it("writes spans of time and months in Spanish", () => {
    expect(ES.f.duration(115.17)).toBe("9 años 8 meses");
    expect(ES.f.duration(1)).toBe("1 mes");
    expect(ES.f.span(18)).toBe("2 años");
    expect(ES.f.monthYear(new Date(Date.UTC(2036, 5, 1)))).toMatch(/^jun\.? 2036$/);
  });

  it("never writes a minus zero", () => {
    expect(ES.f.cur(-0.3)).toBe(`0${nbsp}€`);
    expect(ES.f.rate(-0.000001)).toBe(`0${nbsp}%`);
  });
});
