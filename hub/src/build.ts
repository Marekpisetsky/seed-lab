/**
 * Builds the hub into dist/: one folder per page and language
 * (dist/es/principles/index.html), so any static host serves it as is.
 * Run with `npm run build`.
 */

import { cpSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { renderWithWeight } from "../../packages/seed-kit/src/checks.ts";
import { FAVICON } from "../../packages/seed-kit/src/icons.ts";
import { LOCALES, PAGES, localePath } from "./i18n/index.ts";
import type { Locale, PageId } from "./i18n/index.ts";
import { layout } from "./layout.ts";
import type { PageInput, Weight } from "./layout.ts";
import { about } from "./pages/about.ts";
import { home } from "./pages/home.ts";
import { notFound } from "./pages/not-found.ts";
import { principles } from "./pages/principles.ts";
import { roadmap } from "./pages/roadmap.ts";
import { SITE_URL } from "./site.ts";

export const DIST = fileURLToPath(new URL("../dist/", import.meta.url));
/** Files served as they are: the touch icon and the share image (drawn by scripts/images.ts). */
const STATIC = fileURLToPath(new URL("../static/", import.meta.url));

const RENDER: Readonly<Record<PageId, (locale: Locale) => PageInput>> = { home, principles, about, roadmap };

function write(path: string, content: string): void {
  const file = join(DIST, path);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, content);
}

function sitemap(): string {
  const urls = (Object.keys(PAGES) as PageId[]).flatMap((id) =>
    LOCALES.map((locale) => {
      const alternates = LOCALES.map((other) => `<xhtml:link rel="alternate" hreflang="${other}" href="${SITE_URL + localePath(PAGES[id], other)}"/>`).join("");
      return `<url><loc>${SITE_URL + localePath(PAGES[id], locale)}</loc>${alternates}</url>`;
    }),
  );
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">${urls.join("")}</urlset>\n`;
}

export function build(): { path: string; weight: Weight }[] {
  rmSync(DIST, { recursive: true, force: true });
  const report: { path: string; weight: Weight }[] = [];
  const page = (path: string, input: PageInput) => {
    const { html, weight } = renderWithWeight((measured) => layout(input, measured), [FAVICON]);
    write(path, html);
    report.push({ path, weight });
  };
  for (const locale of LOCALES) {
    for (const id of Object.keys(PAGES) as PageId[]) {
      page(join(localePath(PAGES[id], locale).slice(1), "index.html"), RENDER[id](locale));
    }
  }
  page("404.html", notFound());
  write("favicon.svg", FAVICON);
  cpSync(STATIC, DIST, { recursive: true });
  write("robots.txt", `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}/sitemap.xml\n`);
  write("sitemap.xml", sitemap());
  return report;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  for (const { path, weight } of build()) {
    console.log(`${path.padEnd(28)} ${(weight.bytes / 1000).toFixed(1).padStart(6)} KB  ${(weight.compressed / 1000).toFixed(1).padStart(5)} KB gzip`);
  }
}
