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
    assert.equal(en.eur(999_999_999), "€999,999,999");
    assert.equal(es.eur(999_999_999), nb("999.999.999 €"));
  });

  it("writes a thousand million and more in words, three figures, the way each language says it", () => {
    assert.equal(en.eur(1_234_567_890), nb("€1.23 billion"));
    assert.equal(en.eur(44_617_000_000), nb("€44.6 billion"));
    assert.equal(en.eur(4.4e12), nb("€4.4 trillion"));
    assert.equal(en.eur(4.4e15), nb("€4,400 trillion"));
    // Spain writes thousands of millions, then billones (10¹²): "1230 millones", "4,4 billones".
    assert.equal(es.eur(1_234_567_890), words("1230 millones de euros"));
    assert.equal(es.eur(44_617_000_000), words("44.600 millones de euros"));
    assert.equal(es.eur(1e12), words("1 billón de euros"));
    assert.equal(es.eur(4.4e12), words("4,4 billones de euros"));
    assert.equal(es.eur(4.4e15), words("4400 billones de euros"));
  });

  it("rounds into the next word, never '1000 billion'", () => {
    assert.equal(en.eur(999_999_999_999), nb("€1 trillion"));
    assert.equal(es.eur(999_999_999_999), words("1 billón de euros"));
  });

  it("writes 10¹⁸ and more as a power of ten", () => {
    assert.equal(en.eur(4.353e18), nb("€4.35 × 10¹⁸"));
    assert.equal(es.eur(4.353e18), nb("4,35 × 10¹⁸ €"));
    assert.equal(en.eur(5.4e49), nb("€5.4 × 10⁴⁹"));
    assert.equal(en.eur(9.996e20), nb("€1 × 10²¹"));
  });

  it("keeps signs, with the true minus", () => {
    assert.equal(en.eur(-1.5e9), nb("−€1.5 billion"));
    assert.equal(en.eur(1.5e9, { signed: true }), nb("+€1.5 billion"));
    assert.equal(es.eur(-4.353e18, { signed: true }), nb("−4,35 × 10¹⁸ €"));
  });

  it("writes a big count the same way, for '×2.3 what you put in'", () => {
    assert.equal(en.count(12_345.6), "12,346");
    assert.equal(en.count(3.656e15), nb("3660 trillion").replace("3660", "3,660"));
    assert.equal(es.count(1_234_567_890), nb("1230 millones"));
    assert.equal(es.count(4.353e18), nb("4,35 × 10¹⁸"));
  });

  it("shortens an axis label the same way", () => {
    assert.equal(en.eurCompact(4.4e12), "€4T");
    assert.equal(en.eurCompact(4.353e18), nb("€4.4 × 10¹⁸"));
    assert.equal(es.eurCompact(4.353e18), nb("4,4 × 10¹⁸ €"));
  });
});
