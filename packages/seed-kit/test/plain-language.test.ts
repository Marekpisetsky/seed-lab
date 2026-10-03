import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { hasJargon, percentWithoutMoney, plainLanguageProblems, sentences, textBlocks, textsOf, words } from "../src/plain-language.ts";
import { CHROME_WORDS } from "../src/chrome.ts";
import { CATEGORY_NAMES, TOOLS } from "../src/tools.ts";
import { LOCALES } from "../src/locales.ts";

describe("no percentage without its euros", () => {
  it("reads a page as blocks of text and screen-reader labels", () => {
    const html = '<section><p>A fall like 2008&#x27;s (−37&nbsp;%) = <strong>−407&nbsp;€</strong> of your 1.100 €</p><ul><li>Grows 5% a year</li></ul><input aria-valuetext="4%: €374 a month"/></section>';
    assert.deepEqual(textBlocks(html), ["A fall like 2008's (−37\u00a0%) = −407\u00a0€ of your 1.100 €", "Grows 5% a year", "4%: €374 a month"]);
  });

  it("finds a percent with no amount in euros beside it, and lets a count of futures be", () => {
    assert.deepEqual(percentWithoutMoney(["−37 % (2008) = −407 € de tus 1.100 €", "Grows 5% a year", "In 8 of 10 possible futures", "4%: €374 a month"]), ["Grows 5% a year"]);
  });
});

describe("the plain-language check", () => {
  it("counts the words a reader meets", () => {
    assert.equal(words("It grows **7.5 %** a year."), 5);
    assert.equal(words("Con 2500 € al mes"), 4);
    assert.deepEqual(sentences("One. Two: three · four"), ["One.", "Two:", "three", "four"]);
  });

  it("catches jargon, but not the plain phrases that look like it", () => {
    assert.ok(hasJargon("growth after inflation (real)", "en"));
    assert.ok(hasJargon("el IPCA anual", "es"));
    assert.ok(!hasJargon("the real history of prices", "en"));
    assert.ok(!hasJargon("what your money can really buy", "en"));
    assert.ok(!hasJargon("Source: https://www.bls.gov/cpi/", "en"));
  });

  it("never lets an app tell a person what to do with their money, not even in an explanation", () => {
    const advice = [
      { path: "explain.a", text: "You should put more in stocks." },
      { path: "home.b", text: "We recommend the 60/40 mix." },
      { path: "home.c", text: "This is the best option for you." },
    ];
    assert.equal(plainLanguageProblems(advice, "en", { technical: () => true }).filter((problem) => problem.includes("advice")).length, 3);
    const consejos = [
      { path: "a", text: "Deberías vender." },
      { path: "b", text: "Te recomendamos esta mezcla." },
      { path: "c", text: "Es lo mejor para ti." },
    ];
    assert.equal(plainLanguageProblems(consejos, "es").filter((problem) => problem.includes("advice")).length, 3);
    // Consequences, data and the disclaimers that say it does not advise are fine.
    const fine = [
      { path: "a", text: "At 4% a year, it lasted in 79 of 100 futures." },
      { path: "b", text: "It never tells you what to buy or sell." },
      { path: "c", text: "No te dice qué comprar ni qué vender." },
    ];
    assert.deepEqual(plainLanguageProblems(fine.slice(0, 2), "en"), []);
    assert.deepEqual(plainLanguageProblems(fine.slice(2), "es"), []);
  });

  it("reports long sentences and jargon, with their place", () => {
    const entries = [
      { path: "home.title", text: "One two three four five six seven eight nine ten eleven twelve thirteen." },
      { path: "explain.real", text: "Real growth." },
      { path: "home.note", text: "Nominal growth." },
    ];
    assert.deepEqual(plainLanguageProblems(entries, "en", { technical: (path) => path.startsWith("explain") }), [
      "en home.title (13 words): One two three four five six seven eight nine ten eleven twelve thirteen.",
      'en home.note: jargon in "Nominal growth."',
    ]);
  });

  it("reads a dictionary's texts, functions included", () => {
    const entries = textsOf({ a: "Hello there", b: { c: (name: string) => `Open ${name}`, d: (n: number) => `${n} ${n === 1 ? "goal" : "goals"}` }, e: ["One", "Two"] });
    assert.deepEqual(entries, [
      { path: "a", text: "Hello there" },
      { path: "b.c", text: "Open X" },
      { path: "b.d", text: "X goals" },
      { path: "e.0", text: "One" },
      { path: "e.1", text: "Two" },
    ]);
  });

  it("passes the kit's own words: the header, the footer and the tool list", () => {
    for (const locale of LOCALES) {
      const entries = [
        ...textsOf(CHROME_WORDS[locale], ["chrome"]),
        ...TOOLS.flatMap((tool) => [
          { path: `${tool.id}.tagline`, text: tool.tagline[locale] },
          ...Object.entries(tool.principles).map(([id, { note }]) => ({ path: `${tool.id}.${id}`, text: note[locale] })),
        ]),
        ...Object.entries(CATEGORY_NAMES).map(([id, name]) => ({ path: `category.${id}`, text: name[locale] })),
      ];
      assert.deepEqual(plainLanguageProblems(entries, locale, { maxWords: 22 }), []);
    }
  });
});
