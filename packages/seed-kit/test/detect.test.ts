import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { languageScript, readerRegion, regionOf } from "../src/detect.ts";
import { countryFromLanguage } from "../src/money.ts";

/** Runs the head script on an address, as a browser would, and says where it went. */
function visit(script: string, pathname: string, { languages = ["es-ES", "en"], referrer = "", type = "navigate" } = {}) {
  const went: string[] = [];
  const document = { documentElement: { lang: "" }, referrer };
  const location = { pathname, search: "", hash: "", origin: "https://seed-lab.example", replace: (to: string) => went.push(to) };
  const performance = { getEntriesByType: () => [{ type }] };
  const navigator = { languages, language: languages[0] };
  new Function("document", "location", "performance", "navigator", script)(document, location, performance, navigator);
  return { lang: document.documentElement.lang, went: went[0] ?? null };
}

describe("the language script", () => {
  const plain = languageScript();
  const folders = languageScript({ folders: true });
  const inFolder = languageScript({ basePath: "/wealth-lens", folders: true });

  it("names the page's language", () => {
    assert.equal(visit(plain, "/es/stocks").lang, "es");
    assert.equal(visit(plain, "/stocks", { languages: ["en"] }).lang, "en");
    assert.equal(visit(inFolder, "/wealth-lens/es/").lang, "es");
  });

  it("sends a first visit with a Spanish browser to the same page in Spanish", () => {
    assert.equal(visit(plain, "/").went, "/es");
    assert.equal(visit(plain, "/stocks").went, "/es/stocks");
    assert.equal(visit(folders, "/").went, "/es/");
    assert.equal(visit(folders, "/principles/").went, "/es/principles/");
    assert.equal(visit(inFolder, "/wealth-lens/stocks/").went, "/wealth-lens/es/stocks/");
  });

  it("stores nothing, and leaves alone a visit from the same site, a reload or an English reader", () => {
    assert.doesNotMatch(plain, /cookie|Storage|indexedDB/);
    assert.equal(visit(plain, "/", { referrer: "https://seed-lab.example/es/" }).went, null);
    assert.equal(visit(plain, "/", { type: "reload" }).went, null);
    assert.equal(visit(plain, "/", { languages: ["en-GB", "es"] }).went, null);
    assert.equal(visit(plain, "/es/").went, null);
  });

  it("names Dutch pages, but sends no browser to them while Dutch waits for review", () => {
    assert.equal(visit(folders, "/nl/").lang, "nl");
    assert.equal(visit(folders, "/", { languages: ["nl-NL", "en"] }).went, null);
    assert.equal(visit(folders, "/", { languages: ["nl-NL", "es"] }).went, "/es/");
  });
});

describe("the country of a browser language", () => {
  it("reads the region a language names, or the one it most likely means", () => {
    assert.equal(regionOf("es-ES"), "ES");
    assert.equal(regionOf("nl-NL"), "NL");
    assert.equal(regionOf("nl"), "NL");
    assert.equal(regionOf("de"), "DE");
    assert.equal(regionOf("en-GB"), "GB");
    assert.equal(regionOf("en"), "US");
    assert.equal(regionOf("pt-PT"), "PT");
    assert.equal(regionOf("pt"), "BR");
  });

  it("names none for a region of the world or what is not a language", () => {
    assert.equal(regionOf("es-419"), null);
    assert.equal(regionOf(""), null);
    assert.equal(regionOf("not a language"), null);
  });

  it("starts with the language's country when there are prices for it, and the fallback otherwise", () => {
    const supported = ["NL", "ES", "DE", "FR", "IT", "PT"];
    assert.equal(countryFromLanguage("es-ES", supported, "NL"), "ES");
    assert.equal(countryFromLanguage("fr", supported, "NL"), "FR");
    assert.equal(countryFromLanguage("de-AT", supported, "NL"), "NL");
    assert.equal(countryFromLanguage("en-US", supported, "NL"), "NL");
    assert.equal(countryFromLanguage("es-419", supported, "NL"), "NL");
    assert.equal(countryFromLanguage(undefined, supported, "NL"), "NL");
  });
});

describe("the reader's region", () => {
  it("is the browser's, only when it speaks the page's language", () => {
    assert.equal(readerRegion("es", "es-MX"), "MX");
    assert.equal(readerRegion("en", "en-IN"), "IN");
    assert.equal(readerRegion("en", "en"), "US");
    assert.equal(readerRegion("en", "nl-NL"), "");
    assert.equal(readerRegion("es", undefined), "");
    assert.equal(readerRegion("es", "es-419"), "");
  });
});
