import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";
import { build, DIST } from "../src/build.ts";
import { BLOCKS, parseBlocks, parseTools } from "../src/content.ts";
import { en } from "../src/i18n/en.ts";
import { es } from "../src/i18n/es.ts";
import { LOCALE_SETTINGS, LOCALES, PAGES, localePath } from "../src/i18n/index.ts";
import type { Locale } from "../src/i18n/index.ts";
import { FAVICON } from "../src/icons.ts";
import { measure } from "../src/weight.ts";

const report = build();

function pages(dir = DIST): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    return entry.isDirectory() ? pages(path) : entry.name.endsWith(".html") ? [path] : [];
  });
}
const HTML = pages().map((file) => ({ file: file.slice(DIST.length), text: readFileSync(file, "utf8") }));

describe("the build", () => {
  it("writes every page in every language, plus 404, icon, robots and sitemap", () => {
    for (const locale of LOCALES) {
      for (const path of Object.values(PAGES)) {
        const file = join(DIST, localePath(path, locale), "index.html");
        assert.ok(existsSync(file), file);
        assert.match(readFileSync(file, "utf8"), new RegExp(`<html lang="${locale}">`));
      }
    }
    for (const file of ["404.html", "favicon.svg", "robots.txt", "sitemap.xml"]) assert.ok(existsSync(join(DIST, file)), file);
    assert.equal(report.length, LOCALES.length * Object.keys(PAGES).length + 1);
  });

  it("states in the footer what each page really weighs", () => {
    for (const { file, text } of HTML) {
      const locale = (text.match(/<html lang="(\w+)">/)?.[1] ?? "en") as Locale;
      const real = measure([text, FAVICON]);
      const kb = (bytes: number) =>
        new Intl.NumberFormat(LOCALE_SETTINGS[locale].intl, { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(bytes / 1000);
      const said = text.match(/<p class="weight">([^<]+)<\/p>/)?.[1];
      assert.ok(said, `${file} has no weight`);
      assert.ok(said.includes(kb(real.bytes)) && said.includes(kb(real.compressed)), `${file}: "${said}" but it weighs ${real.bytes} B, ${real.compressed} B compressed`);
    }
  });

  it("stays light: under 30 KB per page, 10 KB compressed", () => {
    for (const { path, weight } of report) {
      assert.ok(weight.bytes < 30_000 && weight.compressed < 10_000, `${path}: ${weight.bytes} B`);
    }
  });

  it("loads nothing from elsewhere, and has no cookies, storage or analytics", () => {
    for (const { file, text } of HTML) {
      assert.doesNotMatch(text, /<script[^>]+src=/i, file);
      assert.doesNotMatch(text, /<link[^>]+rel="(stylesheet|preconnect|dns-prefetch|preload)"/i, file);
      assert.doesNotMatch(text, /<(img|iframe|video|audio|source|embed|object)\b/i, file);
      assert.doesNotMatch(text, /@import|\burl\(/, file); // CSS; "new URL(" in the language script is fine
      assert.doesNotMatch(text, /document\.cookie|localStorage|sessionStorage|indexedDB|sendBeacon|fetch\(|XMLHttpRequest/, file);
      assert.doesNotMatch(text, /gtag|google-analytics|googletagmanager|plausible|umami|matomo|vercel\/analytics|insights/i, file);
    }
  });

  it("never calls the code open source or MIT, and says it is free to use", () => {
    for (const { file, text } of HTML) {
      assert.doesNotMatch(text, /\bMIT\b|open[ -]source|código abierto|LICENSE/i, file);
      const lang = text.match(/<html lang="(\w+)">/)?.[1];
      assert.match(text, lang === "es" && file !== "404.html" ? /© 2026 seed-lab\. De uso gratuito\./ : /© 2026 seed-lab\. Free to use\./, file);
    }
  });

  it("uses no flags, stars or emblems", () => {
    for (const { file, text } of HTML) assert.doesNotMatch(text, /🇪🇺|★|☆|⭐|\bflag\b|emblem/i, file);
  });

  it("links only to pages that exist", () => {
    for (const { file, text } of HTML) {
      for (const [, href] of text.matchAll(/href="(\/[^"#]*)/g)) {
        const target = href.endsWith("/") ? join(DIST, href, "index.html") : join(DIST, href);
        assert.ok(existsSync(target), `${file} links to ${href}`);
      }
    }
  });

  it("names every language version of each page", () => {
    for (const { file, text } of HTML) {
      if (file === "404.html") {
        assert.match(text, /<meta name="robots" content="noindex">/);
        continue;
      }
      for (const locale of [...LOCALES, "x-default"]) assert.match(text, new RegExp(`hreflang="${locale}"`), file);
      assert.match(text, /<link rel="canonical" href="https:\/\//, file);
    }
  });

  it("redirects by language only on English pages, and stores nothing to do it", () => {
    for (const { file, text } of HTML) {
      const scripts = [...text.matchAll(/<script>([\s\S]*?)<\/script>/g)];
      const english = text.includes('<html lang="en">') && file !== "404.html";
      assert.equal(scripts.length, english ? 1 : 0, file);
    }
  });
});

describe("honesty", () => {
  it("shows every building block as coming until it is published", () => {
    for (const block of BLOCKS) assert.equal(block.status === "live", block.url !== undefined, block.id);
    const home = readFileSync(join(DIST, "index.html"), "utf8");
    const coming = home.match(/<span class="badge coming">Coming<\/span>/g) ?? [];
    assert.equal(coming.length, BLOCKS.filter((block) => block.status === "coming").length);
  });

  it("refuses a block marked live without the address where it is published", () => {
    const block = { id: "x", status: "live", name: { en: "X", es: "X" }, text: { en: "X", es: "X" } };
    assert.throws(() => parseBlocks([block]), /can only be "live"/);
    assert.equal(parseBlocks([{ ...block, url: "https://example.org" }])[0].status, "live");
  });

  it("refuses tools with a missing language, a bad status or an http address", () => {
    const tool = {
      id: "t", name: "T", status: "live", url: "https://example.org", languages: ["en"],
      tagline: { en: "T", es: "T" }, description: { en: "T", es: "T" },
    };
    assert.equal(parseTools([tool]).length, 1);
    assert.throws(() => parseTools([{ ...tool, tagline: { en: "T" } }]), /needs a text in es/);
    assert.throws(() => parseTools([{ ...tool, status: "beta" }]), /status/);
    assert.throws(() => parseTools([{ ...tool, url: "http://example.org" }]), /https/);
    assert.throws(() => parseTools([{ ...tool, languages: ["fr"] }]), /languages/);
  });

  it("says where it is hosted today, and marks moving to Europe as pending", () => {
    for (const locale of LOCALES) {
      const page = readFileSync(join(DIST, localePath(PAGES.principles, locale), "index.html"), "utf8");
      assert.match(page, /Vercel/);
      assert.match(page, locale === "en" ? /Pending/ : /Pendiente/);
    }
  });

  it("puts the vision on About only, as a direction, and says which step we are on", () => {
    for (const locale of LOCALES) {
      const about = readFileSync(join(DIST, localePath(PAGES.about, locale), "index.html"), "utf8");
      const home = readFileSync(join(DIST, localePath(PAGES.home, locale), "index.html"), "utf8");
      const stack = locale === "en" ? /its own technology stack/ : /su propia pila tecnológica/;
      assert.match(about, stack);
      assert.doesNotMatch(home, stack);
      assert.match(about, locale === "en" ? /Today we are at the first step/ : /Hoy estamos en el primer peldaño/);
    }
  });
});

describe("the words", () => {
  /** Every text of a dictionary, with its functions filled in. */
  function texts(value: unknown): string[] {
    if (typeof value === "string") return [value];
    if (typeof value === "function") return texts((value as (...args: string[]) => unknown)("12,3", "4,5"));
    if (Array.isArray(value)) return value.flatMap(texts);
    if (value && typeof value === "object") return Object.values(value).flatMap(texts);
    return [];
  }
  const plain = (text: string) => text.replace(/\*\*/g, "").replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");

  it("keeps sentences short: at most 25 words", () => {
    for (const [name, dictionary] of [["en", en], ["es", es]] as const) {
      for (const text of texts(dictionary)) {
        for (const sentence of plain(text).split(/(?<=[.!?:])\s+/)) {
          const words = sentence.split(/\s+/).filter((word) => /\p{L}|\d/u.test(word));
          assert.ok(words.length <= 25, `${name}: ${words.length} words in "${sentence}"`);
        }
      }
    }
  });

  it("has the same texts in every language", () => {
    const shape = (value: unknown): unknown =>
      Array.isArray(value) ? value.map(shape) : value && typeof value === "object" ? Object.fromEntries(Object.entries(value).map(([key, inner]) => [key, shape(inner)])) : typeof value;
    assert.deepEqual(shape(es), shape(en));
  });
});
