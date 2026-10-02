import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { languageScript } from "../src/detect.ts";

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
});
