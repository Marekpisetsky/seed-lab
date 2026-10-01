import { html } from "../html.ts";
import { TOOLS } from "../content.ts";
import { icon, isIconId } from "../icons.ts";
import { LOCALE_SETTINGS, PAGES, localePath, messages } from "../i18n/index.ts";
import type { Locale } from "../i18n/index.ts";
import { band } from "../layout.ts";
import type { PageInput } from "../layout.ts";

/**
 * The front page shows only what exists: the mission, the five principles
 * and the tools people can use today. Plans live on the Roadmap page.
 * Dark and light bands alternate; each has one highlighted button at most.
 */
export function home(locale: Locale): PageInput {
  const m = messages(locale);
  const live = TOOLS.filter((tool) => tool.status === "live");
  const body = html`
${band(
  "dark",
  html`<div class="hero">
<h1 id="mission">${m.home.title}</h1>
<p class="lead">${m.home.mission}</p>
<p class="actions"><a class="button" href="${live[0].url}">${m.home.cta}</a></p>
</div>`,
  "mission",
)}
${band(
  "light",
  html`<div class="section-head"><h2 id="principles">${m.home.principlesTitle}</h2><p>${m.home.principlesIntro}</p></div>
<ol class="principles">
${m.principles.items.map((item) => html`<li>${isIconId(item.id) ? icon(item.id) : ""}${item.short}</li>`)}
</ol>
<p><a class="link" href="${localePath(PAGES.principles, locale)}">${m.home.principlesLink} →</a></p>`,
  "principles",
)}
${live.map((tool) =>
  band(
    "dark",
    html`<div class="product">
<p class="kicker">${m.home.productKicker}</p>
<h2 id="${tool.id}">${tool.name}</h2>
<p class="tagline">${tool.tagline[locale]}</p>
<p class="muted">${tool.description[locale]}</p>
<p class="muted">${m.home.languages}: ${tool.languages.map((code) => LOCALE_SETTINGS[code].name).join(", ")}</p>
<p class="actions"><a class="button" href="${tool.url}">${m.home.open(tool.name)}</a></p>
</div>`,
    tool.id,
  ),
)}`;
  return { locale, id: "home", title: m.meta.home.title, description: m.meta.home.description, body };
}
