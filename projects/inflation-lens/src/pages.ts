/**
 * The pages of Inflation Lens, in each language: the tool itself, the privacy
 * and terms page (seed-kit's words), and one "not found" page for every
 * language. Each says its title, description, content and scripts; the
 * build puts Horalis's header and footer around it.
 */

import { formatsFor } from "../../../packages/seed-kit/src/format.ts";
import { html, raw, rich, type Html } from "../../../packages/seed-kit/src/html.ts";
import { legalLink, legalPage } from "../../../packages/seed-kit/src/legal.ts";
import { LOCALES, type Locale } from "../../../packages/seed-kit/src/locales.ts";
import { pagePath } from "../../../packages/seed-kit/src/page.ts";
import { WORDS } from "./i18n.ts";
import { BASE_PATH, NAME } from "./site.ts";
import { lastYear, yearOptions } from "./calc.ts";
import { HICP, seriesFor } from "./hicp.ts";
import { resultHtml, timelineHtml, type Choice } from "./view.ts";

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

/** What the tool opens with: the example of the key sentence, "100 € of 2010", in the euro area. */
export const DEFAULTS: Choice = { amount: 100, year: 2010, place: "EA", direction: "today" };

function json(value: unknown): Html {
  // Inside a script element, "<" could close it: written as its escape.
  return raw(JSON.stringify(value).replace(/</g, "\\u003c"));
}

export function home(locale: Locale): Page {
  const words = WORDS[locale];
  const t = words.home;
  const formats = formatsFor(locale);
  const all = seriesFor(locale, words.groups);
  const choice = DEFAULTS;
  const current = all.find((series) => series.code === choice.place) ?? all[0];
  const radio = (value: Choice["direction"], label: string) =>
    html`<label class="choice"><input type="radio" name="direction" value="${value}"${value === choice.direction ? raw(" checked") : ""}> ${label}</label>`;
  return {
    id: "home",
    locale,
    title: words.meta.title,
    description: words.meta.description,
    scripts: ["/js/app.js"],
    main: html`<h1>${t.title}</h1>
<p class="sk-lead">${t.lead}</p>
${HICP.provisional ? html`<aside class="sk-card provisional" aria-labelledby="provisional-title"><h2 id="provisional-title">${t.provisionalTitle}</h2><p>${t.provisional}</p></aside>` : ""}
<div class="sk-layout">
<form class="sk-card sk-form" id="calc" aria-label="${t.form}">
<div class="sk-field"><label for="amount">${t.amount}</label><input class="sk-input" id="amount" name="amount" inputmode="decimal" autocomplete="off" value="${formats.grouped(choice.amount)}"></div>
<div class="sk-row">
<div class="sk-field"><label for="year">${t.year}</label><select class="sk-input" id="year" name="year">${yearOptions(current).map((year) => html`<option${year === choice.year ? raw(" selected") : ""}>${year}</option>`)}</select></div>
<div class="sk-field"><label for="place">${t.place}</label><select class="sk-input" id="place" name="place">${all.map((series) => html`<option value="${series.code}"${series.code === choice.place ? raw(" selected") : ""}>${series.name}</option>`)}</select></div>
</div>
<fieldset class="sk-field directions"><legend class="sk-label">${t.direction}</legend>${radio("today", t.toToday)}${radio("then", t.toThen)}</fieldset>
</form>
<section class="sk-card" aria-labelledby="result-title">
<h2 id="result-title">${t.result}</h2>
<div class="sk-result" id="result" aria-live="polite">${resultHtml(choice, all, locale)}</div>
<p class="sk-small">${t.private}</p>
</section>
</div>
<section class="sk-card timeline-card" id="timeline" aria-labelledby="timeline-title">${timelineHtml(choice, all, locale)}</section>
<section class="sk-prose sources" aria-labelledby="sources-title">
<h2 id="sources-title">${t.sourcesTitle}</h2>
<ul>${t.sources({ retrieved: formats.date(HICP.retrievedOn), today: String(lastYear(current)) }).map((line) => html`<li>${line}</li>`)}</ul>
<p><a href="${HICP.sourceUrl}">${t.sourceLink}</a> · <a href="${HICP.licenseUrl}">${t.licenseLink}</a></p>
</section>
<script type="application/json" id="series">${json(all)}</script>`,
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

/** One page for every missing address, in every language (the host cannot know which one the visitor reads). */
export function notFound(): Page {
  const [first] = LOCALES;
  return {
    id: null,
    locale: first,
    title: `${LOCALES.map((locale) => WORDS[locale].notFound.title).join(" · ")} · ${NAME[first]}`,
    description: WORDS[first].notFound.text,
    scripts: [],
    main: html`${LOCALES.map((locale, index) => {
      const words = WORDS[locale].notFound;
      return html`<div class="sk-prose" lang="${locale}">
${index === 0 ? html`<h1>${words.title}</h1>` : html`<h2>${words.title}</h2>`}
<p>${words.text}</p>
<p><a href="${pagePath("/", locale, BASE_PATH)}">${words.home}</a></p>
</div>\n`;
    })}`,
  };
}
