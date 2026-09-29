import { describe, expect, it } from "vitest";
import { addMonths, parseIsoDate, startOfUtcDay, toIsoDate, wholeMonthsBetween } from "./dates";

const d = parseIsoDate;

describe("parseIsoDate / toIsoDate", () => {
  it("round-trips date-only strings in UTC", () => {
    expect(toIsoDate(d("2036-06-15"))).toBe("2036-06-15");
    expect(d("2036-06-15").getUTCHours()).toBe(0);
  });

  it("truncates a timestamp to its UTC day", () => {
    expect(toIsoDate(startOfUtcDay(new Date("2026-09-29T23:59:59Z")))).toBe("2026-09-29");
  });
});

describe("addMonths", () => {
  it("adds months across years", () => {
    expect(toIsoDate(addMonths(d("2026-09-29"), 115))).toBe("2036-04-29");
    expect(toIsoDate(addMonths(d("2026-11-15"), 2))).toBe("2027-01-15");
  });

  it("clamps to the end of shorter months", () => {
    expect(toIsoDate(addMonths(d("2024-01-31"), 1))).toBe("2024-02-29");
    expect(toIsoDate(addMonths(d("2023-01-31"), 1))).toBe("2023-02-28");
  });
});

describe("wholeMonthsBetween", () => {
  it("counts complete months only", () => {
    expect(wholeMonthsBetween(d("2026-09-29"), d("2036-09-29"))).toBe(120);
    expect(wholeMonthsBetween(d("2026-09-29"), d("2036-09-28"))).toBe(119);
    expect(wholeMonthsBetween(d("2026-01-31"), d("2026-02-28"))).toBe(1);
    expect(wholeMonthsBetween(d("2026-09-29"), d("2026-09-30"))).toBe(0);
  });

  it("is negative for dates in the past", () => {
    expect(wholeMonthsBetween(d("2026-09-29"), d("2026-06-29"))).toBe(-3);
  });
});
