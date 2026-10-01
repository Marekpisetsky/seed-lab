import { html, rich } from "../html.ts";
import type { Html } from "../html.ts";
import { BLOCKS, TOOLS } from "../content.ts";
import type { Status } from "../content.ts";
import { icon, isIconId } from "../icons.ts";
import { LOCALE_SETTINGS, PAGES, localePath, messages } from "../i18n/index.ts";
import type { Locale } from "../i18n/index.ts";
import type { PageInput } from "../layout.ts";

export function badge(status: Status, locale: Locale): Html {
  return html`<span class="badge ${status}">${messages(locale).status[status]}</span>`;
}

/** The front page: the mission, the five principles, what exists today, and what is coming. */
export function home(locale: Locale): PageInput {
  const m = messages(locale);
  const body = html`
<section aria-labelledby="mission">
<h1 id="mission">${m.home.title}</h1>
<p class="lead">${m.home.mission}</p>
</section>

<section class="section" aria-labelledby="principles">
<div class="section-head"><h2 id="principles">${m.home.principlesTitle}</h2></div>
<ol class="principles">
${m.principles.items.map((item) => html`<li>${isIconId(item.id) ? icon(item.id) : ""}${item.short}</li>`)}
</ol>
<p><a class="link" href="${localePath(PAGES.principles, locale)}">${m.home.principlesLink} →</a></p>
</section>

<section class="section" aria-labelledby="tools">
<div class="section-head"><h2 id="tools">${m.home.toolsTitle}</h2><p>${m.home.toolsIntro}</p></div>
<ul class="cards">
${TOOLS.map(
  (tool) => html`<li class="card">
<div class="card-head"><h3>${tool.name}</h3>${badge(tool.status, locale)}</div>
<p class="tagline">${tool.tagline[locale]}</p>
<p class="muted">${tool.description[locale]}</p>
<p class="muted">${m.home.languages}: ${tool.languages.map((code) => LOCALE_SETTINGS[code].name).join(", ")}</p>
<div class="actions"><a class="button" href="${tool.url}">${m.home.open(tool.name)}</a></div>
</li>`,
)}
</ul>
</section>

<section class="section" aria-labelledby="blocks">
<div class="section-head"><h2 id="blocks">${m.home.blocksTitle}</h2>${m.home.blocksIntro.map((text) => html`<p>${rich(text)}</p>`)}</div>
<ul class="cards quiet">
${BLOCKS.map(
  (block) => html`<li class="card">
<div class="card-head"><h3>${block.url ? html`<a href="${block.url}">${block.name[locale]}</a>` : block.name[locale]}</h3>${badge(block.status, locale)}</div>
<p class="muted">${block.text[locale]}</p>
</li>`,
)}
</ul>
</section>
`;
  return { locale, id: "home", title: m.meta.home.title, description: m.meta.home.description, body };
}
