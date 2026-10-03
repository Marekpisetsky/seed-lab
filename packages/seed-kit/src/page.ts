/**
 * The document around a page of a static seed-lab tool (the ones Forja
 * makes): the head (language, title, description, addresses in every
 * language, the share tags, the icon, the styles inline, the theme script,
 * the language script on English pages) and the body (the kit's header, the page, the
 * kit's footer, the page's scripts). Nothing comes from another site.
 */

import { languageScript } from "./detect.ts";
import { themeScript } from "./theme.ts";
import { html, raw, type Html } from "./html.ts";
import { DEFAULT_LOCALE, LOCALE_SETTINGS, LOCALES, localePath, type Locale } from "./locales.ts";

export interface DocumentInput {
  locale: Locale;
  title: string;
  description: string;
  /** Where the tool is published, without a trailing slash: "https://cost-lens.example". */
  siteUrl: string;
  /** The folder the tool lives in on its site, if any ("/cost-lens"); "" at the root. */
  basePath?: string;
  /** The page's address without the language ("/", "/privacy/"); null for the "not found" page (not indexed). */
  path: string | null;
  /** The whole CSS, minified (css.ts). */
  styles: string;
  header: Html;
  main: Html;
  footer: Html;
  /** Module scripts of the tool, by their address on the site ("/js/app.js"). */
  scripts?: readonly string[];
  /** Every module those scripts import, fetched at once instead of one level at a time. */
  preload?: readonly string[];
}

/** A page's address in a language, inside the tool's folder: ("/", "es", "/cost-lens") → "/cost-lens/es/". */
export function pagePath(path: string, locale: Locale, basePath = ""): string {
  return basePath + localePath(path, locale);
}

/** The tab's light or dark mode before anything is painted, and the header's menus (theme.ts). */
const THEME_SCRIPT = themeScript({ menu: true });

/** The whole HTML document. */
export function documentHtml(page: DocumentInput): string {
  const { locale, siteUrl, path } = page;
  const base = page.basePath ?? "";
  const indexed = path !== null;
  const address = (other: Locale) => siteUrl + pagePath(path ?? "/", other, base);
  return html`<!doctype html>
<html lang="${locale}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<script>${raw(THEME_SCRIPT)}</script>
${indexed && locale === DEFAULT_LOCALE ? html`<script>${raw(languageScript({ basePath: base, folders: true }))}</script>\n` : ""}<title>${page.title}</title>
<meta name="description" content="${page.description}">
${
  indexed
    ? html`<link rel="canonical" href="${address(locale)}">
${LOCALES.map((other) => html`<link rel="alternate" hreflang="${other}" href="${address(other)}">\n`)}<link rel="alternate" hreflang="x-default" href="${address(DEFAULT_LOCALE)}">
<meta property="og:url" content="${address(locale)}">`
    : html`<meta name="robots" content="noindex">`
}
<meta name="color-scheme" content="light dark">
<meta property="og:type" content="website">
<meta property="og:site_name" content="seed-lab">
<meta property="og:title" content="${page.title}">
<meta property="og:description" content="${page.description}">
<meta property="og:locale" content="${LOCALE_SETTINGS[locale].intl.replace("-", "_")}">
<link rel="icon" href="${base}/favicon.svg" type="image/svg+xml">
${(page.preload ?? []).map((src) => html`<link rel="modulepreload" href="${base}${src}">\n`)}<style>${raw(page.styles)}</style>
</head>
<body>
${page.header}
<main id="main" class="sk-main" tabindex="-1">
${page.main}
</main>
${page.footer}
${(page.scripts ?? []).map((src) => html`<script type="module" src="${base}${src}"></script>\n`)}</body>
</html>
`.value;
}
