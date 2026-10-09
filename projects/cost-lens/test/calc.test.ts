import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { byCode, equivalent, exchangeRate, extremes, monthlyCost, reach, startingChoice, type Country } from "../src/calc.ts";
import { countriesFor } from "../src/countries.ts";
import { listsHtml, ratePair, resultHtml } from "../src/view.ts";
import { costOfLiving } from "../../../packages/seed-kit/src/cost-of-living.ts";

const country = (code: string, cost: number, currency = "USD", perDollar = 1): Country => ({ code, name: code, sentence: code, cost, currency, perDollar, rateYear: 2024 });
const HOME = country("NL", 2700);
const CHEAP = country("PE", 900);
const DEAR = country("CH", 5400);

describe("what you would need elsewhere to live the same", () => {
  it("scales the amount by how much living costs there", () => {
    assert.equal(equivalent(2500, HOME, CHEAP), (2500 * 900) / 2700);
    assert.equal(equivalent(2700, HOME, DEAR), 5400);
  });

  it("is the same amount in the same country", () => {
    assert.equal(equivalent(1234, HOME, HOME), 1234);
  });

  it("goes back where it came from: there and back is the amount again", () => {
    const there = equivalent(2500, HOME, CHEAP);
    assert.ok(there);
    const back = equivalent(there, CHEAP, HOME);
    assert.ok(back && Math.abs(back - 2500) < 1e-9);
  });

  it("refuses an amount that is not above zero, or not a number", () => {
    for (const amount of [0, -100, Number.NaN, Number.POSITIVE_INFINITY]) assert.equal(equivalent(amount, HOME, CHEAP), null, String(amount));
  });

  it("handles very large and very small amounts without rounding them away", () => {
    assert.equal(equivalent(1e9, HOME, CHEAP), (1e9 * 900) / 2700);
    assert.ok((equivalent(0.01, HOME, CHEAP) ?? 0) > 0);
  });
});

describe("amounts in each country's currency", () => {
  const EURO = country("NL", 2000, "EUR", 0.9);
  const SOL = country("PE", 250, "PEN", 3.75);

  it("reads the amount in the currency of where you live, and answers in the other's", () => {
    // 1800 € is 2000 $; there the same life costs 250 $, which is 937.50 soles.
    assert.ok(Math.abs((equivalent(1800, EURO, SOL) ?? 0) - 937.5) < 1e-9);
    assert.ok(Math.abs((equivalent(937.5, SOL, EURO) ?? 0) - 1800) < 1e-9);
    assert.ok(Math.abs(exchangeRate(EURO, SOL) - 3.75 / 0.9) < 1e-12);
  });

  it("gives each country's cost in its currency, rounded as the data allow", () => {
    assert.equal(monthlyCost(EURO), 1800);
    assert.equal(monthlyCost(SOL), 940);
  });

  it("writes the rate from the currency worth more", () => {
    assert.equal(ratePair(EURO, SOL, "en"), "€1 = PEN\u00a04.17");
    assert.equal(ratePair(SOL, EURO, "en"), "€1 = PEN\u00a04.17");
  });

  it("starts from the country the browser's language names, with what living there costs", () => {
    const list = [EURO, SOL, country("MX", 600, "MXN", 18)];
    assert.deepEqual(startingChoice("es-MX", list, { from: "NL", to: "PE" }), { amount: 10_800, from: "MX", to: "PE" });
    assert.deepEqual(startingChoice("es-PE", list, { from: "NL", to: "PE" }), { amount: 940, from: "PE", to: "NL" });
    assert.deepEqual(startingChoice("pt-BR", list, { from: "NL", to: "PE" }), { amount: 1800, from: "NL", to: "PE" });
  });
});

describe("where money goes furthest and least far", () => {
  it("says how many times as far it goes", () => {
    assert.equal(reach(HOME, CHEAP), 3);
    assert.equal(reach(HOME, DEAR), 0.5);
  });

  it("ranks by it, leaves out where you live, and never shows a country in both lists", () => {
    const list = [HOME, CHEAP, DEAR, country("PT", 1600), country("IN", 450), country("US", 4100)];
    const { furthest, least } = extremes(HOME, list, 2);
    assert.deepEqual(furthest.map(({ country: c }) => c.code), ["IN", "PE"]);
    assert.deepEqual(least.map(({ country: c }) => c.code), ["CH", "US"]);
    const shown = [...furthest, ...least].map(({ country: c }) => c.code);
    assert.ok(!shown.includes("NL"));
    assert.equal(new Set(shown).size, shown.length);
  });

  it("shares a short list fairly, and an empty one stays empty", () => {
    const { furthest, least } = extremes(HOME, [HOME, CHEAP, DEAR], 5);
    assert.equal(furthest.length, 1);
    assert.equal(least.length, 1);
    assert.deepEqual(extremes(HOME, [HOME]), { furthest: [], least: [] });
  });

  it("finds a country by its code, and nothing for an unknown one", () => {
    assert.equal(byCode("PE", [HOME, CHEAP])?.cost, 900);
    assert.equal(byCode("XX", [HOME, CHEAP]), undefined);
  });
});

describe("with the real data", () => {
  const en = countriesFor("en");
  const es = countriesFor("es");

  it("has every country of the official data in each language, named in that language and sorted by name", () => {
    assert.equal(en.length, costOfLiving.countries.length);
    assert.equal(es.length, costOfLiving.countries.length);
    assert.ok(en.length >= 100);
    assert.equal(byCode("NL", es)?.name, "Países Bajos");
    assert.equal(byCode("NL", en)?.sentence, "the Netherlands");
    assert.equal(byCode("NL", es)?.sentence, "los Países Bajos");
    const names = es.map((c) => c.name);
    assert.deepEqual(names, [...names].sort(new Intl.Collator("es-ES").compare));
  });

  it("says the key sentence in each language's way, in each country's currency, with the rates it used", () => {
    const choice = { amount: 2500, from: "NL", to: "PE" };
    const need = equivalent(2500, byCode("NL", en) as Country, byCode("PE", en) as Country);
    assert.ok(need);
    const english = resultHtml(choice, en, "en").value;
    assert.match(english, /With €2,500 a month in the Netherlands, in Peru you would need ≈\u00a0PEN\u00a0[\d,]+ to live the same\./);
    assert.match(english, /At the official rates of 20\d\d: €1 = PEN\u00a0\d\.\d\d\./);
    const spanish = resultHtml(choice, es, "es").value;
    assert.match(spanish, /Con 2500\u00a0€ al mes en los Países Bajos, en Perú necesitarías ≈\u00a0[\d.]+\u00a0PEN para vivir igual\./);
    // One currency, no rate to state.
    assert.doesNotMatch(resultHtml({ amount: 2500, from: "NL", to: "ES" }, en, "en").value, /official rates/);
  });

  it("gives every country its own currency, at the official rate of the prices' year", () => {
    assert.equal(byCode("NL", en)?.currency, "EUR");
    assert.equal(byCode("PE", en)?.currency, "PEN");
    assert.equal(byCode("US", en)?.perDollar, 1);
    for (const c of en) assert.ok(c.perDollar > 0 && /^[A-Z]{3}$/.test(c.currency), c.code);
    // Peru's cost in soles is its cost in dollars at Peru's official rate.
    const peru = byCode("PE", en) as Country;
    assert.equal(peru.cost, costOfLiving.countries.find((c) => c.code === "PE")?.monthlyCostUsd);
  });

  it("asks for an amount instead of showing nonsense", () => {
    assert.match(resultHtml({ amount: Number.NaN, from: "NL", to: "PE" }, en, "en").value, /Type an amount a month/);
    assert.match(resultHtml({ amount: 2500, from: "NL", to: "XX" }, en, "en").value, /Type an amount a month/);
    assert.match(listsHtml({ amount: 0, from: "NL", to: "PE" }, es, "es").value, /Donde tu dinero rinde más/);
  });

  it("lists five countries each way, with how much further the money goes", () => {
    const lists = listsHtml({ amount: 2500, from: "NL", to: "PE" }, en, "en").value;
    assert.equal((lists.match(/<tr><th scope="row">/g) ?? []).length, 10);
    assert.match(lists, /Where €2,500 goes furthest/);
    assert.match(lists, /<td>×\d+\.\d<\/td><\/tr>/);
  });
});
