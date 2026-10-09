import assert from "node:assert/strict";
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { after, describe, it } from "node:test";
import { externalRequests, inlineScripts, storageUse } from "../../../packages/seed-kit/src/checks.ts";
import { LOCALES, localePath } from "../../../packages/seed-kit/src/locales.ts";
import { plainLanguageProblems, textsOf } from "../../../packages/seed-kit/src/plain-language.ts";
import { TOOLS } from "../../../packages/seed-kit/src/tools.ts";
import { build } from "../src/build.ts";
import { WORDS } from "../src/i18n.ts";
import { HICP, seriesFor } from "../src/hicp.ts";
import { DEFAULTS, PAGES } from "../src/pages.ts";
import { ID, LIMIT_KB, SITE_URL } from "../src/site.ts";
import { resultHtml, timelineHtml } from "../src/view.ts";

/**
 * What Horalis promises for every tool, checked on the built site: both
 * languages, Horalis's header and footer, nothing from other sites,
 * nothing stored, under the weight limit, plain words.
 */

const DIST = mkdtempSync(join(tmpdir(), `${ID}-`));
const report = build(DIST);
after(() => rmSync(DIST, { recursive: true, force: true }));

function files(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => (entry.isDirectory() ? files(join(dir, entry.name)) : [join(dir, entry.name)]));
}
const ALL = files(DIST).map((file) => ({ file: file.slice(DIST.length + 1), text: readFileSync(file, "utf8") }));
const HTML = ALL.filter(({ file }) => file.endsWith(".html"));
const JS = ALL.filter(({ file }) => file.endsWith(".js"));

describe("the site", () => {
  it("has every page in every language, the 404, the icon, the code, robots and sitemap", () => {
    for (const locale of LOCALES) {
      for (const path of Object.values(PAGES)) {
        const file = join(DIST, localePath(path, locale), "index.html");
        assert.ok(existsSync(file), file);
        assert.match(readFileSync(file, "utf8"), new RegExp(`<html lang="${locale}">`));
      }
    }
    for (const file of ["404.html", "favicon.svg", "js/app.js", "robots.txt", "sitemap.xml"]) assert.ok(existsSync(join(DIST, file)), file);
  });

  it("wears Horalis's header and footer: the name, EN/ES, the tools, privacy, Part of Horalis", () => {
    for (const { file, text } of HTML) {
      assert.match(text, /<header class="sk-header">[\s\S]*<a class="sk-brand"/, file);
      assert.match(text, /<nav class="sk-langs"[\s\S]*hreflang="en"[\s\S]*hreflang="es"/, file);
      assert.match(text, /<details class="sk-launcher">/, file);
      assert.match(text, /<footer class="sk-footer">[\s\S]*\/privacy\/"[\s\S]*(?:Part of Horalis|Parte de Horalis)/, file);
      assert.match(text, /© 2026 Horalis/, file);
    }
  });

  it("loads nothing from other sites and stores nothing in the browser", () => {
    for (const { file, text } of HTML) {
      assert.deepEqual(externalRequests(text), [], file);
      assert.deepEqual(inlineScripts(text).flatMap(storageUse), [], file);
    }
    for (const { file, text } of JS) {
      assert.deepEqual(storageUse(text), [], file);
      assert.deepEqual(externalRequests(text), [], file);
      assert.doesNotMatch(text, /fetch\(|XMLHttpRequest|sendBeacon/, file);
    }
  });

  it(`weighs at most ${LIMIT_KB} KB per page, compressed, on a first visit`, () => {
    for (const { path, weight } of report) assert.ok(weight.compressed <= LIMIT_KB * 1000, `${path}: ${weight.compressed} B compressed`);
  });

  it("links only to pages that exist", () => {
    for (const { file, text } of HTML) {
      for (const [, href] of text.matchAll(/(?:href|src)="(\/[^"#]*)"/g)) {
        const target = href.endsWith("/") ? join(DIST, href, "index.html") : join(DIST, href);
        assert.ok(existsSync(target), `${file} links to ${href}`);
      }
    }
  });

  it("shows the result and the timeline before anyone types, and the browser's code draws the same", async () => {
    const browser = (await import(pathToFileURL(join(DIST, "js/view.js")).href)) as { resultHtml: typeof resultHtml; timelineHtml: typeof timelineHtml };
    for (const locale of LOCALES) {
      const page = readFileSync(join(DIST, localePath(PAGES.home, locale), "index.html"), "utf8");
      const all = seriesFor(locale, WORDS[locale].groups);
      for (const draw of ["resultHtml", "timelineHtml"] as const) {
        const shown = ({ resultHtml, timelineHtml })[draw](DEFAULTS, all, locale).value;
        assert.ok(page.includes(shown), `${locale}: ${draw}`);
        assert.equal(browser[draw](DEFAULTS, all, locale).value, shown, `${locale}: ${draw}`);
      }
      const carried = JSON.parse(page.match(/<script type="application\/json" id="series">([^<]*)<\/script>/)?.[1] ?? "[]");
      assert.deepEqual(carried, all, `${locale}: the page carries the series the browser uses`);
    }
  });

  it("opens with the key sentence for 100 euros of 2010 in the euro area, and names Eurostat and its licence", () => {
    const en = readFileSync(join(DIST, "index.html"), "utf8");
    const es = readFileSync(join(DIST, "es", "index.html"), "utf8");
    assert.match(en, /€100 from 2010 buy today what ≈\u00a0€\d+ bought then\./);
    assert.match(es, /100\u00a0€ de 2010 compran hoy lo que ≈\u00a0\d+\u00a0€ entonces\./);
    for (const page of [en, es]) {
      assert.match(page, /href="https:\/\/ec\.europa\.eu\/eurostat\/databrowser\/view\/prc_hicp_aind\/default\/table"/);
      assert.match(page, /Creative Commons/);
    }
  });

  it("says on the page when its figures are provisional", () => {
    const page = readFileSync(join(DIST, "index.html"), "utf8");
    assert.equal(page.includes('class="sk-card provisional"'), HICP.provisional);
  });
});

describe("the words", () => {
  it("have the same texts in every language", () => {
    const shape = (value: unknown): unknown =>
      Array.isArray(value) ? value.map(shape) : value && typeof value === "object" ? Object.fromEntries(Object.entries(value).map(([key, inner]) => [key, shape(inner)])) : typeof value;
    for (const locale of LOCALES) assert.deepEqual(shape(WORDS[locale]), shape(WORDS.en), locale);
  });

  it("read plainly: no jargon, short sentences (seed-kit's check)", () => {
    for (const locale of LOCALES) {
      // The answers and the sources are read slowly: up to 22 words.
      const longForm = (path: string) => path.startsWith("footer.") || /^home\.(worthToday|worthThen|key|provisional|sources)/.test(path);
      assert.deepEqual(plainLanguageProblems(textsOf(WORDS[locale]), locale, { longForm: { maxWords: 22, paths: longForm } }), [], locale);
    }
  });
});

describe("seed-kit's tool list", () => {
  const tool = TOOLS.find((entry) => entry.id === ID);
  it("has this tool, at this address", { skip: tool ? false : "not in packages/seed-kit/src/tools.json yet" }, () => {
    assert.equal(tool?.url, SITE_URL);
  });
});
