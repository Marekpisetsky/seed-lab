import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, relative } from "node:path";
import { pathToFileURL } from "node:url";
import { describe, it } from "node:test";
import { browserModules } from "../src/browser.ts";
import { externalRequests, inlineScripts, storageUse } from "../src/checks.ts";
import { themeScript } from "../src/theme.ts";
import { kitCss, minifyCss } from "../src/css.ts";
import { html } from "../src/html.ts";
import { legalLink, legalPage } from "../src/legal.ts";
import { plainLanguageProblems, textsOf } from "../src/plain-language.ts";
import { documentHtml, pagePath } from "../src/page.ts";

const STYLES = minifyCss(kitCss("tokens.css", "chrome.css", "base.css"));
const page = (overrides: Partial<Parameters<typeof documentHtml>[0]> = {}) =>
  documentHtml({
    locale: "en",
    title: "A tool",
    description: "What it does.",
    siteUrl: "https://tool.example",
    path: "/",
    styles: STYLES,
    header: html`<header class="sk-header"></header>`,
    main: html`<h1>A tool</h1>`,
    footer: html`<footer class="sk-footer"></footer>`,
    scripts: ["/js/app.js"],
    preload: ["/js/app.js", "/js/kit/format.js"],
    ...overrides,
  });

describe("the page around a static tool", () => {
  it("names its language and every address of the page, and loads only its own files", () => {
    const en = page();
    assert.match(en, /<html lang="en">/);
    assert.match(en, /<link rel="canonical" href="https:\/\/tool\.example\/">/);
    assert.match(en, /<link rel="alternate" hreflang="es" href="https:\/\/tool\.example\/es\/">/);
    assert.match(en, /<link rel="alternate" hreflang="x-default" href="https:\/\/tool\.example\/">/);
    assert.match(en, /<main id="main" class="sk-main" tabindex="-1">/);
    assert.match(en, /<script type="module" src="\/js\/app\.js"><\/script>/);
    assert.match(en, /<link rel="modulepreload" href="\/js\/kit\/format\.js">/);
    assert.deepEqual(externalRequests(en), []);
    assert.deepEqual(inlineScripts(en).flatMap(storageUse), []);
  });

  it("puts the language script on English pages only, and keeps the 404 out of search", () => {
    assert.equal(inlineScripts(page()).filter((code) => code.includes("navigator.languages")).length, 1);
    assert.equal(inlineScripts(page({ locale: "es" })).filter((code) => code.includes("navigator.languages")).length, 0);
    const missing = page({ path: null });
    assert.match(missing, /<meta name="robots" content="noindex">/);
    assert.doesNotMatch(missing, /canonical|navigator/);
  });

  it("sets the tab's light or dark mode first in the head, on every page, and runs the header's menus", () => {
    for (const html of [page(), page({ locale: "es" }), page({ path: null })]) {
      const head = html.slice(0, html.indexOf("</head>"));
      const [first] = inlineScripts(head);
      assert.equal(first, themeScript({ menu: true }));
      assert.ok(head.indexOf(first) < head.indexOf("<style>"), "before the styles, so nothing paints in the other mode");
    }
  });

  it("can live in a folder of a bigger site", () => {
    const inFolder = page({ locale: "es", path: "/privacy/", basePath: "/tool" });
    assert.equal(pagePath("/privacy/", "es", "/tool"), "/tool/es/privacy/");
    assert.match(inFolder, /<link rel="canonical" href="https:\/\/tool\.example\/tool\/es\/privacy\/">/);
    assert.match(inFolder, /<link rel="icon" href="\/tool\/favicon\.svg"/);
    assert.match(inFolder, /src="\/tool\/js\/app\.js"/);
  });

  it("has the kit's styles, minified, with only the tokens' colours outside tokens.css", () => {
    assert.match(STYLES, /--brand:#00a36c/);
    assert.match(STYLES, /\.sk-header\{/);
    assert.match(STYLES, /\.sk-input\{/);
    assert.doesNotMatch(STYLES, /\/\*|\n/);
    assert.doesNotMatch(kitCss("base.css"), /#[0-9a-f]{3,8}\b/i);
  });
});

describe("the code for the browser", () => {
  it("takes the types out, points the imports at .js files, keeps the kit's layout, and runs", async () => {
    const dir = mkdtempSync(join(tmpdir(), "seed-kit-browser-"));
    try {
      mkdirSync(join(dir, "src"));
      const kit = join(import.meta.dirname, "../src");
      const fromTool = relative(join(dir, "src"), kit).replaceAll("\\", "/");
      writeFileSync(join(dir, "src", "data.json"), JSON.stringify({ rate: 0.5 }));
      writeFileSync(
        join(dir, "src", "app.ts"),
        `import type { Locale } from "${fromTool}/locales.ts";
import { numberFormats } from "${fromTool}/format.ts";
import data from "./data.json" with { type: "json" };
/** A doc comment the browser does not need. */
export function half(amount: number, locale: Locale = "en"): string {
  // A comment line.
  return numberFormats(locale === "en" ? "en-GB" : "es-ES").eur(amount * data.rate);
}
`,
      );
      const app = join(dir, "src", "app.ts");
      const modules = browserModules(app, { js: join(dir, "src"), "js/kit": kit });
      assert.deepEqual(modules.map((module) => module.path).sort(), ["js/app.js", "js/data.json.js", "js/kit/format.js", "js/kit/locales.js"]);
      const code = modules.find((module) => module.path === "js/app.js")?.code ?? "";
      assert.match(code, /from "\.\/kit\/format\.js"/);
      assert.match(code, /from "\.\/data\.json\.js";/);
      assert.doesNotMatch(code, /: number|Locale|A doc comment|A comment line|with \{/);
      const out = join(dir, "out");
      for (const module of modules) {
        mkdirSync(join(out, module.path, ".."), { recursive: true });
        writeFileSync(join(out, module.path), module.code);
      }
      const { half } = (await import(pathToFileURL(join(out, "js/app.js")).href)) as { half: (amount: number) => string };
      assert.equal(half(5000), "€2,500");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("refuses a module outside the folders it publishes", () => {
    assert.throws(() => browserModules(join(import.meta.dirname, "../src/format.ts"), { js: join(import.meta.dirname, "../test") }), /outside/);
  });
});

describe("the privacy and terms page", () => {
  it("says the same in every language, plainly", () => {
    const shape = (value: unknown): unknown =>
      Array.isArray(value) ? value.map(shape) : value && typeof value === "object" ? Object.fromEntries(Object.entries(value).map(([key, inner]) => [key, shape(inner)])) : typeof value;
    assert.deepEqual(shape(legalPage("es", "Tool")), shape(legalPage("en", "Tool")));
    for (const locale of ["en", "es"] as const) {
      const entries = textsOf(legalPage(locale, "Tool")).map((entry) => ({ ...entry, text: entry.text.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") }));
      assert.deepEqual(plainLanguageProblems(entries, locale, { maxWords: 22 }), [], locale);
    }
  });

  it("links the hub in the page's language", () => {
    assert.match(legalLink("es")("hub-about"), /^https:\/\/.+\/es\/about\/$/);
    assert.equal(legalLink("en")("/privacy/"), "/privacy/");
  });
});
