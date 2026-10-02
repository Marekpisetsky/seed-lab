import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";
import { build, DIST } from "../src/build.ts";
import { externalRequests, inlineScripts, measure, storageUse } from "../../packages/seed-kit/src/checks.ts";
import { escape } from "../../packages/seed-kit/src/html.ts";
import { FAVICON } from "../../packages/seed-kit/src/icons.ts";
import { plainLanguageProblems, textsOf } from "../../packages/seed-kit/src/plain-language.ts";
import { BLOCKS, PRINCIPLE_IDS, SHOWN_TOOLS, TOOLS, parseBlocks } from "../src/content.ts";
import { TYPICAL_PAGE_KB } from "../src/figures.ts";
import { SHOTS } from "../src/shots.ts";
import { en } from "../src/i18n/en.ts";
import { es } from "../src/i18n/es.ts";
import { LOCALE_SETTINGS, LOCALES, PAGES, localePath } from "../src/i18n/index.ts";
import type { Locale } from "../src/i18n/index.ts";

const { report, figures } = build();

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
    for (const file of ["404.html", "favicon.svg", "apple-touch-icon.png", "og.png", "robots.txt", "sitemap.xml"]) assert.ok(existsSync(join(DIST, file)), file);
    assert.equal(report.length, LOCALES.length * Object.keys(PAGES).length + 1);
  });

  it("states in the footer what each page really weighs", () => {
    for (const { file, text } of HTML) {
      const locale = (text.match(/<html lang="(\w+)">/)?.[1] ?? "en") as Locale;
      const real = measure([text, FAVICON]);
      const kb = (bytes: number) =>
        new Intl.NumberFormat(LOCALE_SETTINGS[locale].intl, { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(bytes / 1000);
      const said = text.match(/<p class="sk-note">((?:This page weighs|Esta página pesa)[^<]+)<\/p>/)?.[1];
      assert.ok(said, `${file} has no weight`);
      assert.ok(said.includes(kb(real.bytes)) && said.includes(kb(real.compressed)), `${file}: "${said}" but it weighs ${real.bytes} B, ${real.compressed} B compressed`);
    }
  });

  it("stays light: under 50 KB per page, compressed (the screenshots load later, on their own)", () => {
    for (const { path, weight } of report) assert.ok(weight.compressed < 50_000, `${path}: ${weight.compressed} B compressed`);
  });

  it("loads nothing from elsewhere, and has no cookies, storage or analytics", () => {
    for (const { file, text } of HTML) {
      assert.doesNotMatch(text, /<script[^>]+src=/i, file);
      assert.doesNotMatch(text, /<link[^>]+rel="(stylesheet|preconnect|dns-prefetch|preload)"/i, file);
      assert.doesNotMatch(text, /<(iframe|video|audio|source|embed|object)\b/i, file);
      for (const [img] of text.matchAll(/<img\b[^>]*>/g)) {
        assert.match(img, /\ssrc="\/shots\/[^"]+\.webp"/, `${file}: images are this site's screenshots`);
        assert.match(img, /loading="lazy"/, `${file}: images load only when they come near`);
        assert.match(img, /\swidth="\d+" height="\d+"/, `${file}: images keep their place while loading`);
        assert.match(img, /\salt="[^"]+"/, `${file}: images say what they show`);
      }
      assert.doesNotMatch(text, /@import|\burl\(/, file); // CSS; "new URL(" in the language script is fine
      assert.doesNotMatch(text, /document\.cookie|localStorage|sessionStorage|indexedDB|sendBeacon|fetch\(|XMLHttpRequest/, file);
      assert.doesNotMatch(text, /gtag|google-analytics|googletagmanager|plausible|umami|matomo|vercel\/analytics|insights/i, file);
      assert.deepEqual(externalRequests(text), [], file);
      assert.deepEqual(inlineScripts(text).flatMap(storageUse), [], file);
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

  it("links only to pages and files that exist", () => {
    for (const { file, text } of HTML) {
      const srcset = [...text.matchAll(/srcset="([^"]+)"/g)].flatMap(([, set]) => set.split(",").map((part) => ["", part.trim().split(/\s+/)[0]]));
      for (const [, href] of [...text.matchAll(/(?:href|src)="(\/[^"#]*)/g), ...srcset]) {
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

  it("has only two tiny scripts: the language one on English pages, the email one where the address is", () => {
    for (const { file, text } of HTML) {
      const scripts = [...text.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(([, code]) => code);
      const english = text.includes('<html lang="en">') && file !== "404.html";
      const email = text.includes('class="email"');
      assert.equal(scripts.length, Number(english) + Number(email), file);
      assert.equal(scripts.filter((code) => code.includes("navigator.language")).length, Number(english), file);
      assert.equal(scripts.filter((code) => code.includes('querySelectorAll(".email")')).length, Number(email), file);
      for (const code of scripts) assert.doesNotMatch(code, /cookie|Storage|fetch|XMLHttpRequest/, file);
    }
  });
});

describe("the contact", () => {
  it("is the email address, on About in both languages", () => {
    for (const locale of LOCALES) {
      const about = readFileSync(join(DIST, localePath(PAGES.about, locale), "index.html"), "utf8");
      assert.match(about, /<span class="email" data-user="seedlab\.eu" data-domain="proton\.me"><\/span>/, locale);
    }
  });

  it("never holds the address whole, a mail link or a GitHub link in the HTML", () => {
    for (const { file, text } of HTML) {
      assert.doesNotMatch(text, /seedlab\.eu@|@proton\.me|mailto/i, file);
      assert.doesNotMatch(text, /github\.com|Open an issue|Abre un issue/i, file);
    }
  });

  it("shows the parts as one address with CSS until the script makes it a link", () => {
    assert.match(HTML[0].text, /\.email::before\{content:attr\(data-user\) "\\40" attr\(data-domain\)\}/);
  });
});

describe("honesty", () => {
  it("shows only what exists on the front page: no Coming, Pending or Planned", () => {
    for (const locale of LOCALES) {
      const home = readFileSync(join(DIST, localePath(PAGES.home, locale), "index.html"), "utf8");
      assert.doesNotMatch(home, /Coming|Pending|Planned|Próximamente|Pendiente|Previsto|class="state/, locale);
      for (const block of BLOCKS) assert.doesNotMatch(home, new RegExp(block.name[locale]), locale);
    }
  });

  it("keeps every plan on the Roadmap page, linked from every footer", () => {
    for (const { file, text } of HTML) {
      const footer = text.slice(text.indexOf("<footer"));
      assert.match(footer, /href="(\/es)?\/roadmap\/"/, file);
    }
    for (const locale of LOCALES) {
      const roadmap = readFileSync(join(DIST, localePath(PAGES.roadmap, locale), "index.html"), "utf8");
      for (const block of BLOCKS) assert.match(roadmap, new RegExp(block.name[locale]), locale);
      assert.equal((roadmap.match(/class="state meets"/g) ?? []).length, 1, `${locale}: only step 1 exists`);
      assert.match(roadmap, /Vercel/);
    }
  });

  it("refuses a block marked live without the address where it is published", () => {
    const block = { id: "x", status: "live", name: { en: "X", es: "X" }, text: { en: "X", es: "X" } };
    assert.throws(() => parseBlocks([block]), /can only be "live"/);
    assert.equal(parseBlocks([{ ...block, url: "https://example.org" }])[0].status, "live");
  });

  it("states every principle as a commitment, and puts each product's gaps in the table", () => {
    const live = TOOLS.filter((tool) => tool.status === "live");
    for (const locale of LOCALES) {
      const page = readFileSync(join(DIST, localePath(PAGES.principles, locale), "index.html"), "utf8");
      const [commitments, table] = page.slice(page.indexOf("<main"), page.indexOf("</main>")).split('id="products"');
      assert.equal((commitments.match(/class="commitment"/g) ?? []).length, PRINCIPLE_IDS.length, locale);
      assert.doesNotMatch(commitments, /Wealth Lens|Pending|Pendiente|Partly|En parte/, `${locale}: the principles name no product and no gap`);
      assert.match(commitments, /350 KB/, `${locale}: the weight limit is published`);
      assert.equal((table.match(/<tr><th scope="row">/g) ?? []).length, live.length, locale);
      assert.match(table, /<tr><th scope="row"><a href="[^"]+">Wealth Lens<\/a><\/th>/, `${locale}: Wealth Lens is the first row`);
      assert.equal((table.match(/class="state (meets|partly|pending)"/g) ?? []).length, live.length * PRINCIPLE_IDS.length, locale);
    }
    for (const tool of live) assert.match(tool.principles.light.note.en, /350 KB/, `${tool.id}: weight against the limit`);
  });

  it("uses the principle ids of content.ts in both dictionaries", () => {
    assert.deepEqual(en.principles.items.map((item) => item.id), [...PRINCIPLE_IDS]);
    assert.deepEqual(es.principles.items.map((item) => item.id), [...PRINCIPLE_IDS]);
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

describe("the colours", () => {
  it("are seed-kit's tokens, in every page (seed-kit's tests check their contrast)", () => {
    const tokens = readFileSync(new URL("../../packages/seed-kit/src/tokens.css", import.meta.url), "utf8");
    assert.match(tokens, /--brand: #00a36c;/);
    for (const { file, text } of HTML) assert.match(text, /--brand:#00a36c/, file);
  });
});

describe("the layout", () => {
  const bands = (text: string) => [...text.matchAll(/<section class="band theme-(dark|light)[ "]/g)].map(([, theme]) => theme);

  it("alternates dark and light bands, never one dark block, whatever the device's mode", () => {
    for (const { file, text } of HTML) {
      assert.match(text, /<header class="sk-header theme-dark">/, file);
      assert.match(text, /<footer class="sk-footer theme-light">/, file);
      const themes = bands(text);
      assert.ok(themes.length >= 1 && themes[0] === "dark", `${file}: the first band joins the dark header`);
      themes.forEach((theme, index) => index > 0 && theme === "dark" && assert.notEqual(themes[index - 1], "dark", `${file}: two dark bands in a row`));
      const sections = [...text.matchAll(/<section class="band theme-(dark|light)( ruled)?"/g)];
      sections.forEach(([, theme, ruled], index) => index > 0 && theme === "light" && sections[index - 1][1] === "light" && assert.ok(ruled, `${file}: two light bands in a row need a line between them`));
    }
    for (const locale of LOCALES) {
      const home = readFileSync(join(DIST, localePath(PAGES.home, locale), "index.html"), "utf8");
      assert.deepEqual(bands(home), ["dark", "light", "light", "dark", "light", "dark"], `${locale}: opening, principles, tools, how we build, what is different, figures`);
    }
  });

  it("has one highlighted button per band at most", () => {
    for (const { file, text } of HTML) {
      for (const section of text.split('<section class="band').slice(1)) {
        assert.ok((section.split("</section>")[0].match(/class="button"/g) ?? []).length <= 1, file);
      }
    }
  });

  it("wears seed-kit's header and footer: the launcher lists the shown tools, and the hub is not Part of itself", () => {
    for (const { file, text } of HTML) {
      const header = text.slice(text.indexOf("<header"), text.indexOf("</header>"));
      assert.match(header, /<details class="sk-launcher">/, file);
      for (const tool of TOOLS.filter((entry) => entry.shown)) assert.match(header, new RegExp(`<a href="${tool.url}"><span class="sk-tool">${tool.name}</span>`), file);
      for (const tool of TOOLS.filter((entry) => !entry.shown)) assert.doesNotMatch(header, new RegExp(tool.name), file);
      assert.doesNotMatch(text, /Part of seed-lab|Parte de seed-lab/, file);
    }
  });

  it("shows the share image and the touch icon", () => {
    for (const { file, text } of HTML) {
      assert.match(text, /<meta property="og:image" content="https:\/\/[^"]+\/og\.png">/, file);
      assert.match(text, /<link rel="apple-touch-icon" href="\/apple-touch-icon\.png">/, file);
    }
  });
});

describe("the front page", () => {
  const page = (locale: Locale) => readFileSync(join(DIST, localePath(PAGES.home, locale), "index.html"), "utf8");
  const section = (text: string, id: string) => {
    const start = text.lastIndexOf("<section", text.indexOf(`aria-labelledby="${id}"`));
    return text.slice(start, text.indexOf("</section>\n", start));
  };

  it("opens with a real screenshot of Wealth Lens, in the page's language, loaded only when needed", () => {
    for (const locale of LOCALES) {
      const opening = section(page(locale), "mission");
      const img = opening.match(/<img\b[^>]*>/)?.[0] ?? "";
      for (const width of SHOTS.tools["wealth-lens"].hero?.widths ?? []) assert.ok(img.includes(`/shots/wealth-lens-hero-${locale}-${width}.webp ${width}w`), `${locale}: ${width}`);
      assert.match(opening, /<a class="button" href="https:\/\/[^"]+">/, locale);
    }
  });

  it("shows each principle with its icon and a rule anyone can check", () => {
    for (const [locale, words] of [["en", en], ["es", es]] as const) {
      const band = section(page(locale), "principles");
      assert.equal((band.match(/<li>/g) ?? []).length, PRINCIPLE_IDS.length, locale);
      assert.equal((band.match(/class="principle-icon"/g) ?? []).length, PRINCIPLE_IDS.length, locale);
      for (const item of words.principles.items) assert.ok(band.includes(escape(item.rules[item.homeRule])), `${locale}: ${item.id}`);
    }
  });

  it("shows the shown tools only, on their shelf, each with a screenshot, its status and a button", () => {
    for (const locale of LOCALES) {
      const band = section(page(locale), "tools");
      for (const tool of SHOWN_TOOLS) {
        assert.match(band, new RegExp(`id="shelf-${tool.category}"`), `${locale}: ${tool.id} shelf`);
        assert.ok(band.includes(`/shots/${tool.id}-card-${locale}-`), `${locale}: ${tool.id} screenshot`);
        assert.match(band, new RegExp(`<span>${tool.name}</span> <span class="badge ${tool.status}">`), `${locale}: ${tool.id} status`);
        assert.ok(band.includes(`<a class="button-secondary" href="${tool.url}">`), `${locale}: ${tool.id} button`);
      }
      for (const tool of TOOLS.filter((entry) => !entry.shown)) assert.ok(!band.includes(tool.name), `${locale}: ${tool.id} is not listed`);
      assert.equal((band.match(/class="shelf"/g) ?? []).length, new Set(SHOWN_TOOLS.map((tool) => tool.category)).size, `${locale}: no empty shelf`);
    }
  });

  it("explains how every tool is built: three steps and the base they share", () => {
    for (const locale of LOCALES) {
      const band = section(page(locale), "build");
      assert.equal((band.match(/<span class="step-number"/g) ?? []).length, 3, locale);
      assert.match(band, /<div class="diagram-base"><p>seed-kit<\/p>/, locale);
      assert.match(band, /Forja/, locale);
    }
  });

  it("compares a typical app with seed-lab, with the weights measured or sourced", () => {
    const number = (value: number, locale: Locale) => new Intl.NumberFormat(LOCALE_SETTINGS[locale].intl).format(value);
    for (const locale of LOCALES) {
      const band = section(page(locale), "different");
      assert.equal((band.match(/<tr><th scope="row">/g) ?? []).length, 5, locale);
      assert.ok(band.includes(`${number(TYPICAL_PAGE_KB, locale)} KB`), `${locale}: the typical weight`);
      assert.ok(band.includes(`${number(figures.maxKb, locale)} KB`), `${locale}: our weight`);
      assert.match(band, /href="https:\/\/almanac\.httparchive\.org\/[a-z]{2}\/2024\/page-weight"/, `${locale}: the source`);
    }
  });

  it("shows figures measured when the site was built: no cookies, no trackers, the heaviest page, languages, countries, tools", () => {
    assert.equal(figures.cookies, 0);
    assert.equal(figures.trackers, 0);
    assert.ok(Math.max(...report.map(({ weight }) => weight.compressed)) <= figures.maxKb * 1000, "no page weighs more than the figure");
    assert.equal(figures.languages, LOCALES.length);
    assert.equal(figures.countries, 172);
    assert.equal(figures.tools, TOOLS.filter((tool) => tool.status !== "coming").length);
    for (const locale of LOCALES) {
      const shown = [...section(page(locale), "figures").matchAll(/<dd>([^<]+)<\/dd>/g)].map(([, value]) => value);
      const expected: number[] = [figures.cookies, figures.trackers, figures.maxKb, figures.languages, figures.countries, figures.tools];
      assert.deepEqual(shown, expected.map((value) => new Intl.NumberFormat(LOCALE_SETTINGS[locale].intl).format(value)), locale);
    }
  });
});

describe("the words", () => {
  /** A dictionary link reads as its words: "[roadmap](/roadmap/)" is "roadmap". */
  const plain = (text: string) => text.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");

  it("read plainly: no jargon, and sentences of 25 words at most (seed-kit's check)", () => {
    for (const [locale, dictionary] of [["en", en], ["es", es]] as const) {
      const entries = textsOf(dictionary).map((entry) => ({ ...entry, text: plain(entry.text) }));
      assert.deepEqual(plainLanguageProblems(entries, locale, { maxWords: 25 }), [], locale);
    }
  });

  it("has the same texts in every language", () => {
    const shape = (value: unknown): unknown =>
      Array.isArray(value) ? value.map(shape) : value && typeof value === "object" ? Object.fromEntries(Object.entries(value).map(([key, inner]) => [key, shape(inner)])) : typeof value;
    assert.deepEqual(shape(es), shape(en));
  });
});
