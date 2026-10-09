/**
 * Builds the hub into dist/: one folder per page and language
 * (dist/es/principles/index.html), so any static host serves it as is.
 * Run with `npm run build`.
 */

import { cpSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { externalRequests, inlineScripts, renderWithWeight, storageUse } from "../../packages/seed-kit/src/checks.ts";
import { FAVICON } from "../../packages/seed-kit/src/icons.ts";
import { LOCALES, PAGES, SHOWN_LOCALES, localePath } from "./i18n/index.ts";
import type { Locale, PageId } from "./i18n/index.ts";
import { layout } from "./layout.ts";
import type { PageInput, Weight } from "./layout.ts";
import { figures, type Figures } from "./figures.ts";
import { about } from "./pages/about.ts";
import { home } from "./pages/home.ts";
import { notFound } from "./pages/not-found.ts";
import { principles } from "./pages/principles.ts";
import { roadmap } from "./pages/roadmap.ts";
import { SITE_URL } from "./site.ts";

export const DIST = fileURLToPath(new URL("../dist/", import.meta.url));
/** Files served as they are: the touch icon and the share image (drawn by scripts/images.ts). */
const STATIC = fileURLToPath(new URL("../static/", import.meta.url));

const RENDER: Readonly<Record<PageId, (locale: Locale, figures: Figures) => PageInput>> = { home, principles, about, roadmap };

function write(path: string, content: string): void {
  const file = join(DIST, path);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, content);
}

function sitemap(): string {
  const urls = (Object.keys(PAGES) as PageId[]).flatMap((id) =>
    SHOWN_LOCALES.map((locale) => {
      const alternates = SHOWN_LOCALES.map((other) => `<xhtml:link rel="alternate" hreflang="${other}" href="${SITE_URL + localePath(PAGES[id], other)}"/>`).join("");
      return `<url><loc>${SITE_URL + localePath(PAGES[id], locale)}</loc>${alternates}</url>`;
    }),
  );
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">${urls.join("")}</urlset>\n`;
}

/** Every page, rendered with the figures it shows. */
function renderAll(shown: Figures): { path: string; html: string; weight: Weight }[] {
  const pages: { path: string; input: PageInput }[] = [
    ...LOCALES.flatMap((locale) => (Object.keys(PAGES) as PageId[]).map((id) => ({ path: join(localePath(PAGES[id], locale).slice(1), "index.html"), input: RENDER[id](locale, shown) }))),
    { path: "404.html", input: notFound() },
  ];
  return pages.map(({ path, input }) => ({ path, ...renderWithWeight((measured) => layout(input, measured), [FAVICON]) }));
}

/**
 * The front page's figures are measured on the built pages: render, count
 * what the pages store and load from elsewhere and weigh the heaviest, and
 * render again until the figures shown are the ones measured.
 */
function settle(): { pages: { path: string; html: string; weight: Weight }[]; shown: Figures } {
  let measured = { cookies: 0, trackers: 0, maxKb: 1 };
  for (let round = 0; round < 10; round += 1) {
    const shown = figures(measured);
    const pages = renderAll(shown);
    const cookies = pages.flatMap(({ html }) => inlineScripts(html).flatMap(storageUse)).length;
    const trackers = pages.flatMap(({ html }) => externalRequests(html)).length;
    const maxKb = Math.max(...pages.map(({ weight }) => Math.ceil(weight.compressed / 1000)));
    if (cookies === measured.cookies && trackers === measured.trackers && maxKb <= measured.maxKb) return { pages, shown };
    measured = { cookies, trackers, maxKb: Math.max(maxKb, measured.maxKb) };
  }
  throw new Error("figures: the pages did not settle");
}

/** Writes dist/ and says what each page weighs, and the figures the front page shows. */
export function build(): { report: { path: string; weight: Weight }[]; figures: Figures } {
  rmSync(DIST, { recursive: true, force: true });
  const { pages, shown } = settle();
  for (const { path, html } of pages) write(path, html);
  write("favicon.svg", FAVICON);
  cpSync(STATIC, DIST, { recursive: true });
  write("robots.txt", `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}/sitemap.xml\n`);
  write("sitemap.xml", sitemap());
  return { report: pages.map(({ path, weight }) => ({ path, weight })), figures: shown };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { report, figures: shown } = build();
  console.log(`figures: ${JSON.stringify(shown)}`);
  for (const { path, weight } of report) {
    console.log(`${path.padEnd(28)} ${(weight.bytes / 1000).toFixed(1).padStart(6)} KB  ${(weight.compressed / 1000).toFixed(1).padStart(5)} KB gzip`);
  }
}
