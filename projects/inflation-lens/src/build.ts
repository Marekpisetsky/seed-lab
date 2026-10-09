/**
 * Builds Inflation Lens into dist/: one folder per page and language
 * (dist/es/privacy/index.html), the 404 page, the icon, the browser code
 * and the sitemap, so any static host serves it as is. Everything shared
 * comes from seed-kit: styles, header, footer, document, browser modules,
 * weight. Run with `npm run build`.
 */

import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { browserModules } from "../../../packages/seed-kit/src/browser.ts";
import { renderWithWeight, type Weight } from "../../../packages/seed-kit/src/checks.ts";
import { footerHtml, headerHtml } from "../../../packages/seed-kit/src/chrome-html.ts";
import { footerModel, headerModel } from "../../../packages/seed-kit/src/chrome.ts";
import { kitCss, minifyCss } from "../../../packages/seed-kit/src/css.ts";
import { FAVICON } from "../../../packages/seed-kit/src/icons.ts";
import { legalPage } from "../../../packages/seed-kit/src/legal.ts";
import { LOCALE_SETTINGS, LOCALES, localePath, SHOWN_LOCALES, type Locale } from "../../../packages/seed-kit/src/locales.ts";
import { documentHtml, pagePath } from "../../../packages/seed-kit/src/page.ts";
import { WORDS } from "./i18n/index.ts";
import { home, notFound, PAGES, privacy, type Page } from "./pages.ts";
import { BASE_PATH, ID, NAME, SITE_URL } from "./site.ts";

const SRC = fileURLToPath(new URL("./", import.meta.url));
const KIT = fileURLToPath(new URL("../../../packages/seed-kit/src/", import.meta.url));
export const DIST = fileURLToPath(new URL("../dist/", import.meta.url));

/** seed-kit's styles (colours, header and footer, the base of a tool), then the tool's own (styles.css). */
export const STYLES = minifyCss(kitCss("tokens.css", "chrome.css", "base.css") + readFileSync(new URL("./styles.css", import.meta.url), "utf8"));

function kb(bytes: number, locale: Locale): string {
  return new Intl.NumberFormat(LOCALE_SETTINGS[locale].intl, { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(bytes / 1000);
}

/** A whole page: Horalis's header and footer around it, and what it weighs. `modules`: the browser code its scripts load. */
function render(page: Page, weight: Weight, modules: readonly string[]): string {
  const { locale, id } = page;
  const words = WORDS[locale];
  const path = id === null ? null : PAGES[id];
  const header = headerModel({
    locale,
    name: NAME[locale],
    homeHref: pagePath("/", locale, BASE_PATH),
    homeCurrent: id === "home",
    languageHrefs: Object.fromEntries(LOCALES.map((other) => [other, pagePath(path ?? "/", other, BASE_PATH)])) as Record<Locale, string>,
    current: ID,
  });
  const footer = footerModel({
    locale,
    links: [{ label: legalPage(locale, NAME[locale]).title, href: pagePath(PAGES.privacy, locale, BASE_PATH), current: id === "privacy" }],
    notes: [words.footer.note, words.footer.weight(kb(weight.compressed, locale))],
  });
  return documentHtml({
    locale,
    title: page.title,
    description: page.description,
    siteUrl: SITE_URL,
    basePath: BASE_PATH,
    path,
    styles: STYLES,
    header: headerHtml(header),
    main: page.main,
    footer: footerHtml(footer),
    scripts: page.scripts,
    preload: page.scripts.length > 0 ? modules : [],
  });
}

export interface Built {
  path: string;
  weight: Weight;
}

/** Writes the site into `dist` and says what each page weighs on a first visit. */
export function build(dist = DIST): Built[] {
  rmSync(dist, { recursive: true, force: true });
  const write = (path: string, content: string) => {
    const file = join(dist, path);
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, content);
  };
  const modules = browserModules(join(SRC, "app.ts"), { js: SRC, "js/kit": KIT });
  for (const module of modules) write(module.path, module.code);
  write("favicon.svg", FAVICON);
  const report: Built[] = [];
  for (const page of [...LOCALES.flatMap((locale) => [home(locale), privacy(locale)]), notFound()]) {
    const extras = [FAVICON, ...(page.scripts.length > 0 ? modules.map((module) => module.code) : [])];
    const { html, weight } = renderWithWeight((measured) => render(page, measured, modules.map((module) => `/${module.path}`)), extras);
    const path = page.id === null ? "404.html" : join(localePath(PAGES[page.id], page.locale).slice(1), "index.html");
    write(path, html);
    report.push({ path, weight });
  }
  const site = SITE_URL + BASE_PATH;
  write("robots.txt", `User-agent: *\nAllow: /\n\nSitemap: ${site}/sitemap.xml\n`);
  const urls = Object.values(PAGES).flatMap((path) =>
    SHOWN_LOCALES.map((locale) => {
      const alternates = SHOWN_LOCALES.map((other) => `<xhtml:link rel="alternate" hreflang="${other}" href="${site + localePath(path, other)}"/>`).join("");
      return `<url><loc>${site + localePath(path, locale)}</loc>${alternates}</url>`;
    }),
  );
  write("sitemap.xml", `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">${urls.join("")}</urlset>\n`);
  return report;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  for (const { path, weight } of build()) {
    console.log(`${path.padEnd(24)} ${(weight.bytes / 1000).toFixed(1).padStart(6)} KB  ${(weight.compressed / 1000).toFixed(1).padStart(5)} KB gzip`);
  }
}
