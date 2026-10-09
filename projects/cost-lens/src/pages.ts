/**
 * The pages of Cost Lens, in each language: the tool itself (the
 * countries it compares travel inside the page, as JSON), the privacy
 * and terms page (seed-kit's words), and one "not found" page for every
 * language. Each says its title, description, content and scripts; the
 * build puts Horalis's header and footer around it.
 */

import { formatsFor } from "../../../packages/seed-kit/src/format.ts";
import { html, raw, rich, type Html } from "../../../packages/seed-kit/src/html.ts";
import { legalLink, legalPage } from "../../../packages/seed-kit/src/legal.ts";
import { SHOWN_LOCALES, type Locale } from "../../../packages/seed-kit/src/locales.ts";
import { pagePath } from "../../../packages/seed-kit/src/page.ts";
import { WORDS } from "./i18n/index.ts";
import { BASE_PATH, NAME } from "./site.ts";
import { countriesFor, DATA, defaultChoice } from "./countries.ts";
import { byCode } from "./calc.ts";
import { listsHtml, resultHtml } from "./view.ts";

/** The pages, by their address without the language. */
export const PAGES = { home: "/", privacy: "/privacy/" } as const;
export type PageId = keyof typeof PAGES;

export interface Page {
  /** null for the "not found" page: no address of its own, not indexed. */
  id: PageId | null;
  locale: Locale;
  title: string;
  description: string;
  main: Html;
  /** Module scripts, by their address on the site. */
  scripts: string[];
}

function json(value: unknown): Html {
  // Inside a script element, "<" could close it: written as its escape.
  return raw(JSON.stringify(value).replace(/</g, "\\u003c"));
}

export function home(locale: Locale): Page {
  const words = WORDS[locale];
  const t = words.home;
  const formats = formatsFor(locale);
  const countries = countriesFor(locale);
  const choice = defaultChoice(countries);
  const select = (name: "from" | "to") =>
    html`<div class="sk-field"><label for="${name}">${t[name]}</label><select class="sk-input" id="${name}" name="${name}">${countries.map(
      (country) => html`<option value="${country.code}"${country.code === choice[name] ? raw(" selected") : ""}>${country.name}</option>`,
    )}</select></div>`;
  const facts = {
    surveys: `${DATA.surveyFrom}–${DATA.surveyTo}`,
    year: String(DATA.priceYear),
    compiled: formats.date(DATA.compiledOn),
    provisional: DATA.provisional,
  };
  return {
    id: "home",
    locale,
    title: words.meta.title,
    description: words.meta.description,
    scripts: ["/js/app.js"],
    main: html`<h1>${t.title}</h1>
<p class="sk-lead">${t.lead(formats.number(countries.length))}</p>
<div class="sk-layout">
<form class="sk-card sk-form" id="calc" aria-label="${t.form}">
<div class="sk-field"><label for="amount">${t.amount(byCode(choice.from, countries)?.currency ?? "")}</label><input class="sk-input" id="amount" name="amount" inputmode="decimal" autocomplete="off" value="${formats.grouped(choice.amount)}"></div>
${select("from")}
${select("to")}
</form>
<section class="sk-card" aria-labelledby="result-title">
<h2 id="result-title">${t.result}</h2>
<div class="sk-result" id="result" aria-live="polite">${resultHtml(choice, countries, locale)}</div>
<p class="sk-small">${t.private}</p>
</section>
</div>
<div id="lists">${listsHtml(choice, countries, locale)}</div>
<section class="sk-prose sources" aria-labelledby="sources-title">
<h2 id="sources-title">${t.sourcesTitle}</h2>
<ul>${t.sources(facts).map((line) => html`<li>${line}</li>`)}</ul>
</section>
<script type="application/json" id="countries">${json(countries)}</script>`,
  };
}

export function privacy(locale: Locale): Page {
  const page = legalPage(locale, NAME[locale]);
  const link = legalLink(locale);
  return {
    id: "privacy",
    locale,
    title: `${page.title} · ${NAME[locale]}`,
    description: page.description,
    scripts: [],
    main: html`<div class="sk-prose">
<h1>${page.title}</h1>
<p class="sk-small">${page.updated}</p>
${page.sections.map((section) => html`<section><h2>${section.heading}</h2>${section.body.map((text) => html`<p>${rich(text, link)}</p>`)}</section>\n`)}</div>`,
  };
}

/** One page for every missing address, in every shown language (the host cannot know which one the visitor reads). */
export function notFound(): Page {
  const [first] = SHOWN_LOCALES;
  return {
    id: null,
    locale: first,
    title: `${SHOWN_LOCALES.map((locale) => WORDS[locale].notFound.title).join(" · ")} · ${NAME[first]}`,
    description: WORDS[first].notFound.text,
    scripts: [],
    main: html`${SHOWN_LOCALES.map((locale, index) => {
      const words = WORDS[locale].notFound;
      return html`<div class="sk-prose" lang="${locale}">
${index === 0 ? html`<h1>${words.title}</h1>` : html`<h2>${words.title}</h2>`}
<p>${words.text}</p>
<p><a href="${pagePath("/", locale, BASE_PATH)}">${words.home}</a></p>
</div>\n`;
    })}`,
  };
}
