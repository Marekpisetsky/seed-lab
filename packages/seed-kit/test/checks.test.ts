import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { describe, it } from "node:test";
import { externalRequests, inlineScripts, measure, overWeight, renderWithWeight, storageUse } from "../src/checks.ts";
import { formatsFor, parseNumber } from "../src/format.ts";

describe("the page checks", () => {
  it("measure what a first visit downloads, and name the pages over a limit", () => {
    const page = "<p>" + "seed ".repeat(2000) + "</p>";
    const weight = measure([page]);
    assert.equal(weight.bytes, page.length);
    assert.ok(weight.compressed < weight.bytes / 10);
    assert.deepEqual(overWeight([{ name: "a.html", files: [page] }], 50), []);
    assert.match(overWeight([{ name: "b.html", files: [randomBytes(4000).toString("hex")] }], 1)[0], /^b\.html weighs [\d.]+ KB compressed, over 1 KB$/);
  });

  it("settle a page that states its own weight", () => {
    const { html, weight } = renderWithWeight((w) => `<p>This page weighs ${w.bytes} bytes.</p>`);
    assert.equal(html, `<p>This page weighs ${weight.bytes} bytes.</p>`);
    assert.equal(Buffer.byteLength(html), weight.bytes);
  });

  it("find requests to other sites, but not links someone can follow", () => {
    const html = `<a href="https://example.org">a link</a><img src="/seed.svg"><script src="https://cdn.example/x.js"></script>
<link rel="stylesheet" href="//fonts.example/a.css"><style>.a{background:url("https://img.example/b.png")}</style>
<script>fetch("https://api.example/v1")</script><link rel="icon" href="/favicon.svg">
<link rel="canonical" href="https://seed-lab.example/"><link rel="alternate" hreflang="es" href="https://seed-lab.example/es/">`;
    assert.deepEqual(externalRequests(html), ["https://cdn.example/x.js", "//fonts.example/a.css", "https://img.example/b.png", "https://api.example/v1"]);
    assert.deepEqual(externalRequests('<img src="/a.png"><link href="/b.css" rel="stylesheet">'), []);
  });

  it("find browser storage in a page's code", () => {
    const [code] = inlineScripts('<script>localStorage.setItem("a", 1); document.cookie = "b"</script><script src="/x.js"></script>');
    assert.deepEqual(storageUse(code), ["localStorage", "document.cookie"]);
    assert.deepEqual(storageUse("const stored = 0;"), []);
  });
});

describe("the formats", () => {
  it("write money and percents the way each language does", () => {
    assert.equal(formatsFor("en").cur(2500), "€2,500");
    assert.equal(formatsFor("es").cur(2500), "2500 €");
    assert.equal(formatsFor("es").cur(25000), "25.000 €");
    assert.equal(formatsFor("en").percent(0.0914), "9.1%");
    assert.equal(formatsFor("es").rate(0.045), "4,5 %");
  });

  it("read numbers the way each language types them", () => {
    const en = formatsFor("en").decimalSeparator;
    const es = formatsFor("es").decimalSeparator;
    assert.equal(parseNumber("2,500.5", en), 2500.5);
    assert.equal(parseNumber("2.500,5", es), 2500.5);
    assert.equal(parseNumber("2500,5 €", es), 2500.5);
    assert.equal(parseNumber("1.000", es), 1000);
    assert.equal(parseNumber("2.5", es), 2.5);
    assert.equal(parseNumber("1,5", en), 1.5);
    assert.equal(parseNumber("€ 1 000", en), 1000);
    assert.equal(parseNumber("-40", en), -40);
    assert.ok(Number.isNaN(parseNumber("", en)));
    assert.ok(Number.isNaN(parseNumber("12abc", en)));
    // A currency before or after, as a person may copy it: symbol or code.
    assert.equal(parseNumber("US$1,000", en), 1000);
    assert.equal(parseNumber("1.000 PEN", es), 1000);
    assert.equal(parseNumber("MX$ 2,500.5", en), 2500.5);
    assert.ok(Number.isNaN(parseNumber("1.2.3", en)));
  });
});
