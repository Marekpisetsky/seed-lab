import { footerHtml, headerHtml } from "../../packages/seed-kit/src/chrome-html.ts";
import { footerModel, headerModel } from "../../packages/seed-kit/src/chrome.ts";
import type { Weight } from "../../packages/seed-kit/src/checks.ts";
import { languageScript } from "../../packages/seed-kit/src/detect.ts";
import { html, raw } from "../../packages/seed-kit/src/html.ts";
import type { Html } from "../../packages/seed-kit/src/html.ts";
import { DEFAULT_LOCALE, LOCALE_SETTINGS, LOCALES, PAGES, localePath, messages } from "./i18n/index.ts";
import type { Locale, PageId } from "./i18n/index.ts";
import { STYLES } from "./styles.ts";
import { EMAIL, EMAIL_SCRIPT, hasEmail } from "./email.ts";
import { SITE_URL } from "./site.ts";
import { SHOWN_TOOLS, toolById } from "./content.ts";

export type { Weight };

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
    "wealth-lens": toolById("wealth-lens").url,
    email: EMAIL,
  };
  return (href) => named[href] ?? (href.startsWith("/") ? localePath(href, locale) : href);
}

/**
 * seed-kit's language script: the first visit from elsewhere to an English
 * page, with a browser that prefers Spanish, goes to the Spanish page.
 * Coming from this site (the language switch) or reloading, it stays.
 * Nothing is stored. Only on English pages: the others need nothing.
 */
const LANGUAGE_SCRIPT = languageScript({ folders: true });

function formatKb(bytes: number, locale: Locale): string {
  return new Intl.NumberFormat(LOCALE_SETTINGS[locale].intl, { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(bytes / 1000);
}

/**
 * A band of the page, always dark or always light whatever the device's
 * mode: the hub alternates them (tokens.css, .theme-dark and .theme-light),
 * so a page is never one dark block.
 */
export function band(theme: "dark" | "light", content: Html, labelledBy?: string): Html {
  return html`<section class="band theme-${theme}"${labelledBy ? html` aria-labelledby="${labelledBy}"` : ""}>
<div class="wrap">
${content}
</div>
</section>
`;
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
  const header = headerModel({
    locale,
    name: m.site.name,
    homeHref: localePath("/", locale),
    homeCurrent: id === "home",
    nav: nav.map((item) => ({ label: item.label, href: localePath(PAGES[item.id], locale), current: item.id === id })),
    languageHrefs: Object.fromEntries(LOCALES.map((other) => [other, localePath(path, other)])) as Record<Locale, string>,
    current: "hub",
    hubHref: localePath("/", locale),
    theme: "dark",
  });
  const footer = footerModel({
    locale,
    links: [
      ...SHOWN_TOOLS.map((tool) => ({ label: tool.name, href: tool.url })),
      { label: m.site.nav.principles, href: localePath(PAGES.principles, locale) },
      { label: m.site.nav.about, href: localePath(PAGES.about, locale) },
      { label: m.site.roadmap, href: localePath(PAGES.roadmap, locale), current: id === "roadmap" },
    ],
    notes: [m.site.weight(formatKb(weight.bytes, locale), formatKb(weight.compressed, locale)), m.site.noTracking],
    partOf: false,
    theme: "light",
  });
  const doc = html`<!doctype html>
<html lang="${locale}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
${indexed && locale === DEFAULT_LOCALE ? html`<script>${raw(LANGUAGE_SCRIPT)}</script>` : ""}
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
<meta name="theme-color" content="#0a0a0a">
<meta property="og:type" content="website">
<meta property="og:site_name" content="seed-lab">
<meta property="og:title" content="${page.title}">
<meta property="og:description" content="${page.description}">
<meta property="og:locale" content="${LOCALE_SETTINGS[locale].intl.replace("-", "_")}">
<meta property="og:image" content="${SITE_URL}/og.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<style>${raw(STYLES)}</style>
</head>
<body>
${headerHtml(header)}
<main id="main" tabindex="-1">
${page.body}
</main>
${footerHtml(footer)}
${hasEmail(page.body) ? html`<script>${EMAIL_SCRIPT}</script>\n` : ""}</body>
</html>
`;
  return doc.value;
}
