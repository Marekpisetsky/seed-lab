import { describe, expect, it } from "vitest";
import { parseLooseNumber } from "./number";

describe("parseLooseNumber", () => {
  it.each([
    ["1234.5", 1234.5],
    ["1,234.50", 1234.5],
    ["1.234,50", 1234.5],
    ["1234,5", 1234.5],
    ["0,123", 0.123],
    ["1,234", 1234],
    ["1.234.567", 1234567],
    ["1.234", 1.234],
    ["€ 1 234,56", 1234.56],
    ["1'234.50", 1234.5],
    ["-12.5%", -12.5],
    ["USD 99", 99],
    [".5", 0.5],
    ["2.0000000000", 2],
  ])("reads %j as %d", (raw, expected) => {
    expect(parseLooseNumber(raw)).toBeCloseTo(expected, 10);
  });

  it.each(["", "   ", "abc", "1.2.3,4,5", "--1", "12abc34", undefined])("rejects %j", (raw) => {
    expect(parseLooseNumber(raw)).toBeNull();
  });

  it.each([
    ["10.000", 10_000],
    ["1.000,5", 1000.5],
    ["1,5", 1.5],
    ["1,234", 1.234],
    ["7.5", 7.5],
    ["0.125", 0.125],
    ["1.234.567", 1_234_567],
    ["1,234.5", 1234.5],
  ])("reads %j the Spanish way (decimal comma) as %d", (raw, expected) => {
    expect(parseLooseNumber(raw, true)).toBeCloseTo(expected, 10);
  });
});

describe("what the page writes, read back", () => {
  it("reads every way a page language and a reader's region write a number: India's lakhs, Swiss apostrophes", () => {
    expect(parseLooseNumber("1,50,000")).toBe(150_000);
    expect(parseLooseNumber("1,00,00,000")).toBe(10_000_000);
    expect(parseLooseNumber("150’000")).toBe(150_000);
    expect(parseLooseNumber("150ʼ000.5")).toBe(150_000.5);
    expect(parseLooseNumber("12,34")).toBe(12.34);
  });

  it("gives back every number it shows, in every region a page language can be read in", () => {
    const regions = ["US", "GB", "IN", "CH", "IE", "AU", "ZA", "NG", "ES", "MX", "AR", "CO", "PE", "CL", "NL", "BE", "DE", "FR"];
    const values = [0, 7, 1234, 150_000, 2_500_000, 10_000_000, 1234.5, 999_999_999];
    for (const language of ["en", "es", "nl"]) {
      for (const region of regions) {
        const format = new Intl.NumberFormat(`${language}-${region}`, { maximumFractionDigits: 2 });
        const comma = format.formatToParts(1.5).find((part) => part.type === "decimal")?.value === ",";
        for (const value of values) expect(parseLooseNumber(format.format(value), comma), `${language}-${region} ${format.format(value)}`).toBe(value);
      }
    }
  });
});
