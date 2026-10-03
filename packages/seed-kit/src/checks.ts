/**
 * The checks every seed-lab page passes, for an app's tests (they run in
 * Node, not in the page):
 *
 * - its weight, measured the way a first visit downloads it (gzip);
 * - no request to another site: no script, style, image, font or frame
 *   from elsewhere (a link someone can follow is not a request);
 * - nothing stored in the browser: no cookies, no local or session
 *   storage, no IndexedDB, no cache storage. One exception, by design:
 *   the light or dark mode someone picks, in sessionStorage under the
 *   theme's key, for the tab only (theme.ts).
 */

import { gzipSync } from "node:zlib";
import { THEME_KEY } from "./theme.ts";

/** What a browser downloads, raw and compressed, in bytes. */
export interface Weight {
  bytes: number;
  compressed: number;
}

/** The weight of files a page is made of (its HTML, styles inside, icons, scripts). */
export function measure(files: readonly string[]): Weight {
  return files.reduce<Weight>(
    (total, file) => ({
      bytes: total.bytes + Buffer.byteLength(file),
      compressed: total.compressed + gzipSync(file, { level: 9 }).length,
    }),
    { bytes: 0, compressed: 0 },
  );
}

/**
 * A page that states its own weight: writing the number changes the
 * weight, so render, measure, and render again until what the page says is
 * what it weighs. It settles in two or three rounds.
 */
export function renderWithWeight(render: (weight: Weight) => string, extras: readonly string[] = []): { html: string; weight: Weight } {
  let weight: Weight = { bytes: 0, compressed: 0 };
  let html = render(weight);
  for (let round = 0; round < 10; round += 1) {
    weight = measure([html, ...extras]);
    const next = render(weight);
    if (next === html) return { html, weight };
    html = next;
  }
  throw new Error("weight: the page did not settle");
}

/** "page.html weighs 61.2 KB compressed, over 50 KB", for each page over `limitKb` (compressed, 1 KB = 1000 bytes). */
export function overWeight(pages: readonly { name: string; files: readonly string[] }[], limitKb: number): string[] {
  return pages.flatMap(({ name, files }) => {
    const { compressed } = measure(files);
    return compressed > limitKb * 1000 ? [`${name} weighs ${(compressed / 1000).toFixed(1)} KB compressed, over ${limitKb} KB`] : [];
  });
}

const OUTSIDE = /^(?:[a-z][a-z0-9+.-]*:)?\/\//i;
/** <link> kinds a browser fetches, or connects for, on its own. */
const LOADING = /\b(stylesheet|icon|apple-touch-icon|mask-icon|manifest|preload|modulepreload|prefetch|prerender|preconnect|dns-prefetch)\b/i;

/**
 * Addresses of other sites a page would load by itself: in src, srcset,
 * <link> hrefs that load something (styles, icons, preloads, preconnects;
 * not a canonical or alternate address, which only names a page), CSS
 * url() and @import, and fetch() or import() of a full address in its
 * scripts. Empty when the page only loads from its own site.
 */
export function externalRequests(html: string): string[] {
  const found: string[] = [];
  const add = (url: string) => {
    if (OUTSIDE.test(url.trim())) found.push(url.trim());
  };
  for (const [, url] of html.matchAll(/\ssrc="([^"]*)"/gi)) add(url);
  for (const [, set] of html.matchAll(/\ssrcset="([^"]*)"/gi)) set.split(",").forEach((part) => add(part.trim().split(/\s+/)[0]));
  for (const [tag] of html.matchAll(/<link\b[^>]*>/gi)) {
    const rel = /\srel="([^"]*)"/i.exec(tag)?.[1] ?? "";
    const href = /\shref="([^"]*)"/i.exec(tag)?.[1];
    if (href && LOADING.test(rel)) add(href);
  }
  for (const [, url] of html.matchAll(/url\(\s*['"]?([^'")]+)['"]?\s*\)/gi)) add(url);
  for (const [, url] of html.matchAll(/@import\s+(?:url\()?['"]([^'"]+)['"]/gi)) add(url);
  for (const [, url] of html.matchAll(/\b(?:fetch|import)\(\s*['"`]([^'"`]+)['"`]/g)) add(url);
  return found;
}

/** The theme's own use of sessionStorage, by its key written out: allowed, and nothing else is. */
const THEME_STORAGE = new RegExp(`\\bsessionStorage\\.(?:get|set|remove)Item\\(\\s*["'\`]${THEME_KEY}["'\`]`, "g");

/** Browser storage a page's code touches; empty when it stores nothing but the tab's theme (theme.ts). */
export function storageUse(code: string): string[] {
  return [...code.replace(THEME_STORAGE, "").matchAll(/\b(localStorage|sessionStorage|indexedDB|document\.cookie|cookieStore|caches\.open)\b/g)].map(([use]) => use);
}

/** The code of a page's inline scripts, for storageUse(). */
export function inlineScripts(html: string): string[] {
  return [...html.matchAll(/<script\b(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)].map(([, code]) => code);
}
