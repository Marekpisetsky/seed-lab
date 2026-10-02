import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { hasJargon, plainLanguageProblems, sentences, textsOf, words } from "../src/plain-language.ts";
import { CHROME_WORDS } from "../src/chrome.ts";
import { CATEGORY_NAMES, TOOLS } from "../src/tools.ts";
import { LOCALES } from "../src/locales.ts";

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
