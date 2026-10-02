import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { byCode, equivalent, extremes, reach, type Country } from "../src/calc.ts";
import { countriesFor } from "../src/countries.ts";
import { listsHtml, resultHtml } from "../src/view.ts";

const country = (code: string, withoutRent: number, withRent: number, estimated = false): Country => ({ code, name: code, sentence: code, withoutRent, withRent, estimated });
const HOME = country("NL", 1500, 2700);
const CHEAP = country("PE", 500, 900);
const DEAR = country("CH", 3000, 5400);

describe("what you would need elsewhere to live the same", () => {
  it("scales the amount by how much living costs there, with housing and without", () => {
    assert.deepEqual(equivalent(2500, HOME, CHEAP), { withRent: (2500 * 900) / 2700, withoutRent: (2500 * 500) / 1500 });
    assert.deepEqual(equivalent(2700, HOME, DEAR), { withRent: 5400, withoutRent: 5400 });
  });

  it("is the same amount in the same country", () => {
    assert.deepEqual(equivalent(1234, HOME, HOME), { withRent: 1234, withoutRent: 1234 });
  });

  it("goes back where it came from: there and back is the amount again", () => {
    const there = equivalent(2500, HOME, CHEAP);
    assert.ok(there);
    const back = equivalent(there.withRent, CHEAP, HOME);
    assert.ok(back && Math.abs(back.withRent - 2500) < 1e-9);
  });

  it("refuses an amount that is not above zero, or not a number", () => {
    for (const amount of [0, -100, Number.NaN, Number.POSITIVE_INFINITY]) assert.equal(equivalent(amount, HOME, CHEAP), null, String(amount));
  });

  it("handles very large and very small amounts without rounding them away", () => {
    assert.equal(equivalent(1e9, HOME, CHEAP)?.withRent, (1e9 * 900) / 2700);
    assert.ok((equivalent(0.01, HOME, CHEAP)?.withRent ?? 0) > 0);
  });
});

describe("where money goes furthest and least far", () => {
  it("says how many times as far it goes, with and without housing", () => {
    assert.deepEqual(reach(HOME, CHEAP), { withRent: 3, withoutRent: 3 });
    assert.deepEqual(reach(HOME, DEAR), { withRent: 0.5, withoutRent: 0.5 });
  });

  it("ranks by the cost with housing, leaves out where you live, and never shows a country in both lists", () => {
    const list = [HOME, CHEAP, DEAR, country("PT", 900, 1600), country("IN", 300, 450, true), country("US", 2200, 4100)];
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
    assert.equal(byCode("PE", [HOME, CHEAP])?.withRent, 900);
    assert.equal(byCode("XX", [HOME, CHEAP]), undefined);
  });
});

describe("with the real data", () => {
  const en = countriesFor("en");
  const es = countriesFor("es");

  it("has 172 countries in each language, named in that language and sorted by name", () => {
    assert.equal(en.length, 172);
    assert.equal(es.length, 172);
    assert.equal(byCode("NL", es)?.name, "Países Bajos");
    assert.equal(byCode("NL", en)?.sentence, "the Netherlands");
    assert.equal(byCode("NL", es)?.sentence, "los Países Bajos");
    const names = es.map((c) => c.name);
    assert.deepEqual(names, [...names].sort(new Intl.Collator("es-ES").compare));
  });

  it("keeps the ≈ of every estimated country", () => {
    assert.equal(en.filter((c) => c.estimated).length, 142);
    assert.equal(byCode("AF", en)?.estimated, true);
    assert.equal(byCode("PE", en)?.estimated, false);
    assert.equal(byCode("NL", en)?.estimated, false);
  });

  it("says the key sentence, with housing and without, in each language's way", () => {
    const choice = { amount: 2500, from: "NL", to: "PE" };
    const need = equivalent(2500, byCode("NL", en) as Country, byCode("PE", en) as Country);
    assert.ok(need);
    const english = resultHtml(choice, en, "en").value;
    assert.match(english, /With €2,500 a month in the Netherlands, in Peru you would need ≈\u00a0€[\d,]+ to live the same\./);
    assert.match(english, /Leaving housing out: ≈\u00a0€[\d,]+\./);
    assert.doesNotMatch(english, /estimated from its price level/, "Peru and the Netherlands are both detailed");
    assert.match(resultHtml({ ...choice, to: "AF" }, en, "en").value, /≈ This country(?:'|&#39;)s costs are estimated from its price level\./);
    const spanish = resultHtml(choice, es, "es").value;
    assert.match(spanish, /Con 2500\u00a0€ al mes en los Países Bajos, en Perú necesitarías ≈\u00a0[\d.]+\u00a0€ para vivir igual\./);
  });

  it("asks for an amount instead of showing nonsense", () => {
    assert.match(resultHtml({ amount: Number.NaN, from: "NL", to: "PE" }, en, "en").value, /Type an amount a month/);
    assert.match(resultHtml({ amount: 2500, from: "NL", to: "XX" }, en, "en").value, /Type an amount a month/);
    assert.match(listsHtml({ amount: 0, from: "NL", to: "PE" }, es, "es").value, /Donde tu dinero rinde más/);
  });

  it("lists five countries each way, marked ≈ when estimated, with both reaches", () => {
    const lists = listsHtml({ amount: 2500, from: "NL", to: "PE" }, en, "en").value;
    assert.equal((lists.match(/<tr><th scope="row">/g) ?? []).length, 10);
    assert.match(lists, /Where €2,500 goes furthest/);
    assert.match(lists, /<td>×\d+\.\d<\/td><td>×\d+\.\d<\/td>/);
    assert.match(lists, /<abbr title="estimated">≈<\/abbr>/);
  });
});
