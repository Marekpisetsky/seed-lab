import { html, raw } from "./html.ts";
import type { Html } from "./html.ts";
import { DEFAULT_LOCALE, LOCALE_SETTINGS, LOCALES, PAGES, localePath, messages } from "./i18n/index.ts";
import type { Locale, PageId } from "./i18n/index.ts";
import { SEED } from "./icons.ts";
import { STYLES } from "./styles.ts";
import { EMAIL, EMAIL_SCRIPT, hasEmail } from "./email.ts";
import { SITE_URL } from "./site.ts";
import { TOOLS } from "./content.ts";

/** What the footer says about the page's own weight, in bytes. */
export interface Weight {
  bytes: number;
  compressed: number;
}

export interface PageInput {
  locale: Locale;
  /** null for the "not found" page: no address of its own, not indexed, no language redirect. */
  id: PageId | null;
  title: string;
  description: string;
  body: Html;
}

/** The address a word in a dictionary link stands for, in the page's language; "[email](email)" is the email address. */
export function linkTo(locale: Locale): (href: string) => string | Html {
  const named: Readonly<Record<string, string | Html>> = {
    "wealth-lens": TOOLS[0].url,
    email: EMAIL,
  };
  return (href) => named[href] ?? (href.startsWith("/") ? localePath(href, locale) : href);
}

/**
 * The first visit from elsewhere to an English page, with a browser that
 * prefers Spanish, goes to the Spanish page. Coming from this site (the
 * language switch) it stays. Nothing is stored. Only on English pages.
 */
const LANGUAGE_REDIRECT = `(function(){try{var r=document.referrer;if(r&&new URL(r).origin===location.origin)return;var l=((navigator.languages&&navigator.languages[0])||navigator.language||"").toLowerCase();if(l.slice(0,2)==="es")location.replace("/es"+location.pathname+location.hash)}catch(e){}})()`;

function formatKb(bytes: number, locale: Locale): string {
  return new Intl.NumberFormat(LOCALE_SETTINGS[locale].intl, { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(bytes / 1000);
}

export function layout(page: PageInput, weight: Weight): string {
  const { locale, id } = page;
  const m = messages(locale);
  const path = id === null ? "/" : PAGES[id];
  const here = localePath(path, locale);
  const indexed = id !== null;
  const nav: { id: PageId; label: string }[] = [
    { id: "principles", label: m.site.nav.principles },
    { id: "about", label: m.site.nav.about },
  ];
  const doc = html`<!doctype html>
<html lang="${locale}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
${indexed && locale === DEFAULT_LOCALE ? html`<script>${raw(LANGUAGE_REDIRECT)}</script>` : ""}
<title>${page.title}</title>
<meta name="description" content="${page.description}">
${
  indexed
    ? html`<link rel="canonical" href="${SITE_URL + here}">
${LOCALES.map((other) => html`<link rel="alternate" hreflang="${other}" href="${SITE_URL + localePath(path, other)}">\n`)}<link rel="alternate" hreflang="x-default" href="${SITE_URL + path}">
<meta property="og:url" content="${SITE_URL + here}">`
    : html`<meta name="robots" content="noindex">`
}
<meta name="color-scheme" content="light dark">
<meta name="theme-color" media="(prefers-color-scheme: light)" content="#ffffff">
<meta name="theme-color" media="(prefers-color-scheme: dark)" content="#0a0a0a">
<meta property="og:type" content="website">
<meta property="og:site_name" content="seed-lab">
<meta property="og:title" content="${page.title}">
<meta property="og:description" content="${page.description}">
<meta property="og:locale" content="${LOCALE_SETTINGS[locale].intl.replace("-", "_")}">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<style>${raw(STYLES)}</style>
</head>
<body>
<a class="skip" href="#main">${m.site.skip}</a>
<header class="top">
<div class="wrap bar">
<a class="mark" href="${localePath("/", locale)}"${id === "home" ? raw(' aria-current="page"') : ""}>${SEED}${m.site.name}</a>
<nav aria-label="${m.site.nav.label}">
<ul class="menu">
${nav.map((item) => html`<li><a href="${localePath(PAGES[item.id], locale)}"${item.id === id ? raw(' aria-current="page"') : ""}>${item.label}</a></li>`)}
<li><ul class="langs" aria-label="${m.site.language}">
${LOCALES.map((other) => html`<li><a href="${localePath(path, other)}" hreflang="${other}" lang="${other}"${indexed && other === locale ? raw(' aria-current="true"') : ""}>${LOCALE_SETTINGS[other].label}<span class="sr"> ${LOCALE_SETTINGS[other].name}</span></a></li>`)}
</ul></li>
</ul>
</nav>
</div>
</header>
<main id="main" tabindex="-1">
<div class="wrap">
${page.body}
</div>
</main>
<footer class="foot">
<div class="wrap">
<p class="weight">${m.site.weight(formatKb(weight.bytes, locale), formatKb(weight.compressed, locale))}</p>
<p>${m.site.noTracking}</p>
<nav aria-label="${m.site.footerNav}">
<ul>
<li><a href="${TOOLS[0].url}">${TOOLS[0].name}</a></li>
</ul>
</nav>
<p class="copyright">${m.site.copyright}</p>
</div>
</footer>
${hasEmail(page.body) ? html`<script>${EMAIL_SCRIPT}</script>\n` : ""}</body>
</html>
`;
  return doc.value;
}
