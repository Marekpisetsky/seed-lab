import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { firstYear, lastYear, level, rise, worthThen, worthToday, yearOptions, type Series } from "../src/calc.ts";
import { resultHtml, timelineHtml } from "../src/view.ts";

const SERIES: Series = { code: "XX", name: "Testland", sentence: "Testland", from: 2021, rates: [10, -10, 0, 25] };
const close = (actual: number | null, expected: number) => assert.ok(actual !== null && Math.abs(actual - expected) < 1e-9, `${actual} is not ${expected}`);

describe("prices chained year after year", () => {
  it("start at 100 the year before the first rate, and move with each rate", () => {
    assert.equal(firstYear(SERIES), 2020);
    assert.equal(lastYear(SERIES), 2024);
    close(level(SERIES, 2020), 100);
    close(level(SERIES, 2021), 110);
    close(level(SERIES, 2022), 99);
    close(level(SERIES, 2023), 99);
    close(level(SERIES, 2024), 123.75);
  });

  it("have no level outside the data, or for a year that is not a whole number", () => {
    for (const year of [2019, 2025, 2021.5, Number.NaN]) assert.equal(level(SERIES, year), null, String(year));
  });

  it("offer every year an amount can come from, newest first", () => {
    assert.deepEqual(yearOptions(SERIES), [2024, 2023, 2022, 2021, 2020]);
  });
});

describe("what money from one year is worth in another", () => {
  it("grows with the prices since then, and goes back the same way", () => {
    close(worthToday(100, 2020, SERIES), 123.75);
    close(worthThen(123.75, 2020, SERIES), 100);
    close(worthToday(100, 2022, SERIES), 125);
    close(worthThen(worthToday(250, 2021, SERIES) ?? 0, 2021, SERIES), 250);
  });

  it("is the same amount today, and in years when prices did not move", () => {
    close(worthToday(80, 2024, SERIES), 80);
    close(worthToday(100, 2023, SERIES), 125);
    close(worthToday(100, 2022, SERIES), worthToday(100, 2023, SERIES) ?? 0);
  });

  it("follows prices down as well as up", () => {
    close(rise(2021, SERIES), 123.75 / 110 - 1);
    const falling: Series = { ...SERIES, from: 2021, rates: [-2] };
    close(rise(2020, falling), -0.02);
    close(worthToday(100, 2020, falling), 98);
  });

  it("refuses a negative or missing amount and years outside the data, and takes zero", () => {
    assert.equal(worthToday(-1, 2020, SERIES), null);
    assert.equal(worthToday(Number.NaN, 2020, SERIES), null);
    assert.equal(worthToday(100, 1999, SERIES), null);
    assert.equal(worthThen(100, 2030, SERIES), null);
    close(worthToday(0, 2020, SERIES), 0);
  });

  it("stays exact enough over long spans and with high inflation", () => {
    const long: Series = { ...SERIES, from: 1997, rates: Array.from({ length: 28 }, () => 2) };
    close(worthToday(100, 1996, long), 100 * 1.02 ** 28);
    const steep: Series = { ...SERIES, from: 1997, rates: [1058.4, 18.7] };
    close(worthToday(1, 1996, steep), 11.584 * 1.187);
  });
});

describe("the result and the timeline", () => {
  const choice = { amount: 100, year: 2020, place: "XX", direction: "today" as const };

  it("say it in each language's way, with the sentence for 100 euros", () => {
    const english = resultHtml(choice, [SERIES], "en").value;
    assert.match(english, /<p class="sk-big">≈\u00a0€124<\/p>/);
    assert.match(english, /€100 in 2020 in Testland are worth ≈\u00a0€124 today \(2024\)\./);
    assert.match(english, /Prices rose 23\.8% since 2020\./);
    assert.match(english, /€100 from 2020 buy today what ≈\u00a0€81 bought then\./);
    const spanish = resultHtml({ ...choice, direction: "then" }, [SERIES], "es").value;
    assert.match(spanish, /100\u00a0€ de hoy \(2024\) valían ≈\u00a081\u00a0€ en 2020 en Testland\./);
    assert.match(spanish, /100\u00a0€ de 2020 compran hoy lo que ≈\u00a081\u00a0€ entonces\./);
  });

  it("say prices fell when they did, and ask again instead of showing nonsense", () => {
    const falling: Series = { ...SERIES, from: 2021, rates: [-2] };
    assert.match(resultHtml(choice, [falling], "en").value, /Prices fell 2\.0% since 2020\./);
    assert.match(resultHtml({ ...choice, amount: -5 }, [SERIES], "en").value, /Type an amount and pick a year with data/);
    assert.match(resultHtml({ ...choice, year: 1990 }, [SERIES], "es").value, /Escribe una cantidad y elige un año con datos/);
    assert.match(resultHtml({ ...choice, place: "ZZ" }, [SERIES], "en").value, /Type an amount/);
  });

  it("draw one bar per year, the years since the chosen one standing out (colour and a dashed line), with a table of every year", () => {
    const drawn = timelineHtml({ ...choice, year: 2022 }, [SERIES], "en").value;
    assert.equal((drawn.match(/<rect /g) ?? []).length, 4);
    assert.equal((drawn.match(/<rect class="in"/g) ?? []).length, 2);
    assert.match(drawn, /role="img" aria-label="How much prices rose each year in Testland, from 2021 to 2024\."/);
    assert.equal((drawn.match(/<tr class="in"><th scope="row">/g) ?? []).length, 2);
    assert.match(drawn, /<title>2022: \u221210\.0%<\/title>/, "the true minus sign");
    assert.match(drawn, /<line class="since" x1="320\.0" x2="320\.0"/, "between 2022 and 2023");
    assert.match(drawn, /<span class="edge" aria-hidden="true"><\/span><span class="swatch" aria-hidden="true"><\/span> Since 2022/);
  });
});
