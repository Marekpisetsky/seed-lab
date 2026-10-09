import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { formatsFor } from "../src/format.ts";

const en = formatsFor("en");
const es = formatsFor("es");
const nb = (text: string) => text.replace(/ /g, "\u00a0");
/** Spanish words: the number holds to its word, "de euros" may wrap. */
const words = (text: string) => nb(text).replace(/\u00a0de\u00a0euros$/, " de euros");

describe("amounts too big to read in full", () => {
  it("keeps every figure up to a thousand million", () => {
    assert.equal(en.cur(999_999_999), "€999,999,999");
    assert.equal(es.cur(999_999_999), nb("999.999.999 €"));
  });

  it("writes a thousand million and more in words, three figures, the way each language says it", () => {
    assert.equal(en.cur(1_234_567_890), nb("€1.23 billion"));
    assert.equal(en.cur(44_617_000_000), nb("€44.6 billion"));
    assert.equal(en.cur(4.4e12), nb("€4.4 trillion"));
    assert.equal(en.cur(4.4e15), nb("€4,400 trillion"));
    // Spain writes thousands of millions, then billones (10¹²): "1230 millones", "4,4 billones".
    assert.equal(es.cur(1_234_567_890), words("1230 millones de euros"));
    assert.equal(es.cur(44_617_000_000), words("44.600 millones de euros"));
    assert.equal(es.cur(1e12), words("1 billón de euros"));
    assert.equal(es.cur(4.4e12), words("4,4 billones de euros"));
    assert.equal(es.cur(4.4e15), words("4400 billones de euros"));
  });

  it("rounds into the next word, never '1000 billion'", () => {
    assert.equal(en.cur(999_999_999_999), nb("€1 trillion"));
    assert.equal(es.cur(999_999_999_999), words("1 billón de euros"));
  });

  it("writes 10¹⁸ and more as a power of ten", () => {
    assert.equal(en.cur(4.353e18), nb("€4.35 × 10¹⁸"));
    assert.equal(es.cur(4.353e18), nb("4,35 × 10¹⁸ €"));
    assert.equal(en.cur(5.4e49), nb("€5.4 × 10⁴⁹"));
    assert.equal(en.cur(9.996e20), nb("€1 × 10²¹"));
  });

  it("keeps signs, with the true minus", () => {
    assert.equal(en.cur(-1.5e9), nb("−€1.5 billion"));
    assert.equal(en.cur(1.5e9, { signed: true }), nb("+€1.5 billion"));
    assert.equal(es.cur(-4.353e18, { signed: true }), nb("−4,35 × 10¹⁸ €"));
  });

  it("writes a big count the same way, for '×2.3 what you put in'", () => {
    assert.equal(en.count(12_345.6), "12,346");
    assert.equal(en.count(3.656e15), nb("3660 trillion").replace("3660", "3,660"));
    assert.equal(es.count(1_234_567_890), nb("1230 millones"));
    assert.equal(es.count(4.353e18), nb("4,35 × 10¹⁸"));
  });

  it("shortens an axis label the same way", () => {
    assert.equal(en.curCompact(4.4e12), "€4T");
    assert.equal(en.curCompact(4.353e18), nb("€4.4 × 10¹⁸"));
    assert.equal(es.curCompact(4.353e18), nb("4,4 × 10¹⁸ €"));
  });
});

describe("amounts in any currency, the way each country writes them", () => {
  it("takes the country's own marks and the currency's symbol where the language puts it", () => {
    assert.equal(formatsFor("en", { country: "US", currency: "USD" }).cur(1234.5), "$1,235");
    assert.equal(formatsFor("es", { country: "MX", currency: "MXN" }).cur(1234.5), "$1,235");
    assert.equal(formatsFor("es", { country: "PE", currency: "PEN" }).cur(1234.5), nb("S/ 1,235"));
    assert.equal(formatsFor("es", { country: "ES", currency: "EUR" }).cur(1234.5), nb("1235 €"));
    assert.equal(formatsFor("nl", { country: "NL", currency: "EUR" }).cur(1234.5), nb("€ 1.235"));
  });

  it("writes big amounts in words with that symbol, and the euro's name only where the language says it", () => {
    assert.equal(formatsFor("en", { country: "GB", currency: "GBP" }).cur(2_345_000_000), nb("£2.35 billion"));
    assert.equal(formatsFor("es", { country: "PE", currency: "PEN" }).cur(2_345_000_000), nb("S/ 2,350 millones"));
    assert.equal(formatsFor("nl", { country: "NL", currency: "EUR" }).cur(2_345_000_000), nb("€ 2,35 miljard"));
    assert.equal(words(formatsFor("es").cur(2_345_000_000)), words("2350 millones de euros"));
    assert.equal(formatsFor("en", { currency: "JPY" }).cur(5e18), nb("JP¥5 × 10¹⁸"));
  });

  it("falls back to the language's own marks for a country the browser does not pair with it", () => {
    assert.equal(formatsFor("es", { country: "ZZ" }).cur(1234.5), formatsFor("es").cur(1234.5));
    assert.equal(formatsFor("en", { currency: "USD" }).symbol, "US$");
  });
});
