import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";
import { build, DIST } from "../src/build.ts";
import site from "../../deploy/site.json" with { type: "json" };
import { BLOCKS, PRINCIPLE_IDS, TOOLS, parseBlocks, parseTools, toolHref } from "../src/content.ts";
import { en } from "../src/i18n/en.ts";
import { es } from "../src/i18n/es.ts";
import { LOCALE_SETTINGS, LOCALES, PAGES, localePath } from "../src/i18n/index.ts";
import type { Locale } from "../src/i18n/index.ts";
import { BRAND, FAVICON, TOUCH_ICON } from "../src/icons.ts";
import { SITE_URL } from "../src/site.ts";
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
    for (const file of ["404.html", "favicon.svg", "apple-touch-icon.png", "og.png", "robots.txt", "sitemap.xml"]) assert.ok(existsSync(join(DIST, file)), file);
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
    // A tool's folder (/wealth-lens/…) is another build: deploy/combine.mjs checks those links in the whole site.
    const toolFolders = TOOLS.map((tool) => tool.url).filter((url) => url.startsWith("/"));
    for (const { file, text } of HTML) {
      for (const [, href] of text.matchAll(/href="(\/[^"#]*)/g)) {
        if (toolFolders.some((folder) => href.startsWith(folder))) continue;
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

  it("refuses tools with a missing language, a bad status or an http address", () => {
    const note = { en: "N", es: "N" };
    const tool = {
      id: "t", name: "T", status: "live", url: "https://example.org", languages: ["en"],
      tagline: { en: "T", es: "T" }, description: { en: "T", es: "T" },
      principles: Object.fromEntries(PRINCIPLE_IDS.map((id) => [id, { status: "meets", note }])),
    };
    assert.equal(parseTools([tool]).length, 1);
    assert.throws(() => parseTools([{ ...tool, tagline: { en: "T" } }]), /needs a text in es/);
    assert.throws(() => parseTools([{ ...tool, status: "beta" }]), /status/);
    assert.throws(() => parseTools([{ ...tool, url: "http://example.org" }]), /https/);
    assert.throws(() => parseTools([{ ...tool, url: "wealth-lens/" }]), /https/);
    assert.equal(parseTools([{ ...tool, url: "/t/" }])[0].url, "/t/");
    assert.throws(() => parseTools([{ ...tool, languages: ["fr"] }]), /languages/);
    assert.throws(() => parseTools([{ ...tool, principles: { ...tool.principles, light: { status: "almost", note } } }]), /status for the light principle/);
    assert.throws(() => parseTools([{ ...tool, principles: { ...tool.principles, speed: { status: "meets", note } } }]), /unknown principles speed/);
  });

  it("states every principle as a commitment, and puts each product's gaps in the table", () => {
    const live = TOOLS.filter((tool) => tool.status === "live");
    for (const locale of LOCALES) {
      const page = readFileSync(join(DIST, localePath(PAGES.principles, locale), "index.html"), "utf8");
      const [commitments, table] = page.split('id="products"');
      assert.equal((commitments.match(/class="commitment"/g) ?? []).length, PRINCIPLE_IDS.length, locale);
      assert.doesNotMatch(commitments, /Wealth Lens|Pending|Pendiente|Partly|En parte/, `${locale}: the principles name no product and no gap`);
      assert.match(commitments, /350 KB/, `${locale}: the weight limit is published`);
      assert.equal((table.match(/<tr><th scope="row">/g) ?? []).length, live.length, locale);
      assert.match(table, /<tr><th scope="row"><a href="[^"]+">Wealth Lens<\/a><\/th>/, `${locale}: Wealth Lens is the first row`);
      assert.equal((table.match(/class="state (meets|progress|partly|pending)"/g) ?? []).length, live.length * PRINCIPLE_IDS.length, locale);
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
  const TOKENS = readFileSync(new URL("../src/tokens.css", import.meta.url), "utf8");
  const read = (css: string) => Object.fromEntries([...css.matchAll(/--([\w-]+):\s*(#[0-9a-f]{6});/g)].map(([, name, hex]) => [name, hex]));
  /** The values of one block of tokens.css, by its selector. */
  const block = (selector: string) => {
    const start = TOKENS.indexOf(`${selector} {`);
    return read(TOKENS.slice(start, TOKENS.indexOf("}", start)));
  };
  const modes = { light: block(".theme-light"), dark: block(".theme-dark") };
  const luminance = (hex: string) => {
    const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const contrast = (a: string, b: string) => {
    const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p);
    return (x + 0.05) / (y + 0.05);
  };

  it("are the same file as Wealth Lens's, so both sites look like one family", () => {
    const wealthLens = new URL("../../projects/wealth-lens/src/app/tokens.css", import.meta.url);
    assert.equal(readFileSync(wealthLens, "utf8"), TOKENS);
  });

  it("keep every text colour at WCAG AA (4.5:1) on every surface, in both modes", () => {
    for (const [mode, t] of Object.entries(modes)) {
      for (const text of ["foreground", "muted", "accent", "positive", "negative", "warning-foreground"]) {
        for (const surface of ["background", "card", "subtle", "warning-bg"]) {
          assert.ok(contrast(t[text], t[surface]) >= 4.5, `${mode}: ${text} on ${surface} is ${contrast(t[text], t[surface]).toFixed(2)}`);
        }
      }
      assert.ok(contrast(t["accent-foreground"], t.accent) >= 4.5, `${mode}: text on an accent button`);
      assert.ok(contrast(t["brand-foreground"], t.brand) >= 4.5, `${mode}: text on a brand button`);
      assert.ok(contrast(t.brand, t.background) >= 3, `${mode}: the logo and icons (3:1 for graphics)`);
      assert.ok(contrast(t.accent, t["accent-soft"]) >= 4.5, `${mode}: the Meets label`);
    }
  });

  it("use neutral greys with no warm tint, and white and near-black behind everything", () => {
    for (const [mode, t] of Object.entries(modes)) {
      for (const grey of ["background", "foreground", "card", "subtle", "muted", "border"]) {
        const [r, g, b] = [1, 3, 5].map((i) => t[grey].slice(i, i + 2));
        assert.ok(r === g && g === b, `${mode}: ${grey} ${t[grey]} is not a neutral grey`);
      }
    }
    assert.equal(modes.light.background, "#ffffff");
    assert.equal(modes.dark.background, "#0a0a0a");
  });

  it("give the device's dark mode the same values as .theme-dark", () => {
    const start = TOKENS.indexOf("@media (prefers-color-scheme: dark)");
    assert.deepEqual(read(TOKENS.slice(start, TOKENS.indexOf(".theme-dark {"))), modes.dark);
  });

  it("are a seed green of their own, far from NVIDIA's yellow-green", () => {
    const hue = (hex: string) => {
      const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
      const max = Math.max(r, g, b);
      const d = max - Math.min(r, g, b);
      const h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
      return (h * 60 + 360) % 360;
    };
    for (const t of Object.values(modes)) assert.ok(hue(t.brand) - hue("#76b900") > 60, `${t.brand} is too close to #76b900`);
    assert.equal(modes.light["chart-growth"], modes.light.brand, "growth is drawn in the brand green");
  });

  it("are the colours of the icons", () => {
    assert.equal(BRAND, modes.light.brand);
    assert.ok(FAVICON.includes(`fill="${BRAND}"`) && TOUCH_ICON.includes(`fill="${BRAND}"`));
    assert.ok(TOUCH_ICON.includes(`fill="${modes.dark.background}"`));
  });

  it("put the tokens in every page", () => {
    for (const { file, text } of HTML) assert.match(text, /--brand:#00a36c/, file);
  });
});

describe("the layout", () => {
  const bands = (text: string) => [...text.matchAll(/<section class="band theme-(dark|light)"/g)].map(([, theme]) => theme);

  it("alternates dark and light bands, never one dark block, whatever the device's mode", () => {
    for (const { file, text } of HTML) {
      assert.match(text, /<header class="top theme-dark">/, file);
      assert.match(text, /<footer class="foot theme-light">/, file);
      const themes = bands(text);
      assert.ok(themes.length >= 1 && themes[0] === "dark", `${file}: the first band joins the dark header`);
      themes.forEach((theme, index) => index > 0 && assert.notEqual(theme, themes[index - 1], `${file}: two ${theme} bands in a row`));
    }
    for (const locale of LOCALES) {
      const home = readFileSync(join(DIST, localePath(PAGES.home, locale), "index.html"), "utf8");
      assert.deepEqual(bands(home), ["dark", "light", "dark"], `${locale}: intro dark, principles light, product dark`);
    }
  });

  it("has one highlighted button per band at most", () => {
    for (const { file, text } of HTML) {
      for (const section of text.split('<section class="band').slice(1)) {
        assert.ok((section.split("</section>")[0].match(/class="button"/g) ?? []).length <= 1, file);
      }
    }
  });

  it("shows the share image and the touch icon", () => {
    for (const { file, text } of HTML) {
      assert.match(text, /<meta property="og:image" content="https:\/\/[^"]+\/og\.png">/, file);
      assert.match(text, /<link rel="apple-touch-icon" href="\/apple-touch-icon\.png">/, file);
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

describe("one site: the hub at the root, the tools in folders", () => {
  const wealthLens = TOOLS.find((tool) => tool.id === "wealth-lens");

  it("takes the site's address from deploy/site.json, the one place to change it", () => {
    assert.equal(SITE_URL, site.origin);
    for (const { file, text } of HTML) {
      for (const [, url] of text.matchAll(/(?:rel="canonical"|hreflang="[^"]+"|property="og:(?:url|image)") (?:href|content)="([^"]+)"/g)) {
        assert.ok(url.startsWith(`${site.origin}/`), `${file}: ${url}`);
      }
    }
    const robots = readFileSync(join(DIST, "robots.txt"), "utf8");
    assert.match(robots, new RegExp(`Sitemap: ${site.origin}/sitemap.xml\n`));
    assert.match(robots, new RegExp(`Sitemap: ${site.origin}${site.wealthLensPath}/sitemap.xml\n`));
  });

  it("links Wealth Lens in its folder of the same site, in the page's language", () => {
    assert.equal(wealthLens?.url, `${site.wealthLensPath}/`);
    assert.ok(wealthLens);
    assert.equal(toolHref(wealthLens, "en"), "/wealth-lens/");
    assert.equal(toolHref(wealthLens, "es"), "/wealth-lens/es/");
    assert.equal(toolHref({ url: "https://example.org", languages: ["en", "es"] }, "es"), "https://example.org");
    for (const locale of LOCALES) {
      const home = readFileSync(join(DIST, localePath(PAGES.home, locale), "index.html"), "utf8");
      const links = [...home.matchAll(/href="([^"]*wealth-lens[^"]*)"/g)].map(([, href]) => href);
      assert.ok(links.length > 0, locale);
      assert.deepEqual([...new Set(links)], [locale === "en" ? "/wealth-lens/" : "/wealth-lens/es/"], locale);
    }
    for (const { file, text } of HTML) assert.doesNotMatch(text, /vercel\.app/, file);
  });

  it("says hosting in Europe is in progress for Wealth Lens, naming where it moves, until the move is live", () => {
    const europe = wealthLens?.principles.europe;
    assert.ok(europe && ["progress", "meets"].includes(europe.status), "in progress now; meets once the move is live (docs/hosting.md, step 9)");
    if (europe.status === "progress") assert.match(europe.note.en, /statichost\.eu/);
    for (const locale of LOCALES) {
      const table = readFileSync(join(DIST, localePath(PAGES.principles, locale), "index.html"), "utf8").split('id="products"')[1];
      assert.match(table, new RegExp(`class="state ${europe.status}"`), locale);
    }
    assert.equal(en.principles.status.progress, "In progress");
    assert.equal(es.principles.status.progress, "En curso");
  });
});
