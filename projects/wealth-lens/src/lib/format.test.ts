import { describe, expect, it } from "vitest";
import { formatDuration, formatMoney, formatMonthYear, formatNumber, formatPercent, formatPrice } from "./format";

describe("formatMoney", () => {
  it("formats amounts with the currency symbol", () => {
    expect(formatMoney(1967.1513, "EUR")).toBe("€1,967.15");
    expect(formatMoney(1234567.89, "EUR", { decimals: 0 })).toBe("€1,234,568");
  });

  it("signs gains and losses when asked", () => {
    expect(formatMoney(250, "EUR", { signed: true })).toBe("+€250.00");
    expect(formatMoney(-250, "USD", { signed: true })).toBe("-$250.00");
    expect(formatMoney(0, "EUR", { signed: true })).toBe("€0.00");
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
    expect(formatPercent(-0.2, { signed: true })).toBe("-20.0%");
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
