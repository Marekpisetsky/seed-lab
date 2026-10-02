import { html, raw, rich } from "../../../packages/seed-kit/src/html.ts";
import { isPrincipleIconId, principleIcon } from "../../../packages/seed-kit/src/icons.ts";
import { CATEGORIES, CATEGORY_NAMES } from "../../../packages/seed-kit/src/tools.ts";
import { SHOWN_TOOLS, TOOLS } from "../content.ts";
import { TYPICAL_PAGE_KB, type Figures } from "../figures.ts";
import { LOCALE_SETTINGS, PAGES, localePath, messages } from "../i18n/index.ts";
import type { Locale } from "../i18n/index.ts";
import { band, linkTo } from "../layout.ts";
import type { PageInput } from "../layout.ts";
import { shotHtml } from "../shots.ts";

/** The tool in the first band. */
const HERO = "wealth-lens";

/**
 * The front page, in bands like a product site: a dark opening with
 * Wealth Lens's real screenshot; the principles, each with a rule anyone
 * can check; the tools by shelf; how every tool is built; what makes us
 * different from a typical app; and the figures, measured when the site
 * is built. It shows only what exists: no plans (they live on the
 * Roadmap), and a beta only once it is listed.
 */
export function home(locale: Locale, figures: Figures): PageInput {
  const m = messages(locale);
  const t = m.home;
  const hero = TOOLS.find((tool) => tool.id === HERO);
  if (!hero) throw new Error(`home: ${HERO} is not in the tool list`);
  const number = (value: number) => new Intl.NumberFormat(LOCALE_SETTINGS[locale].intl).format(value);
  const shelves = CATEGORIES.map((category) => ({ category, tools: SHOWN_TOOLS.filter((tool) => tool.category === category) })).filter(({ tools }) => tools.length > 0);
  const platform = [t.diagram.hub, ...SHOWN_TOOLS.map((tool) => tool.name)];

  const body = html`
${band(
  "dark",
  html`<div class="hero hero-home">
<h1 id="mission">${t.title}</h1>
<p class="lead">${t.mission}</p>
<p class="actions"><a class="button" href="${hero.url}">${t.cta}</a></p>
</div>
<figure class="hero-shot">${shotHtml(HERO, "hero", locale, t.heroAlt, "(min-width: 72rem) 69.5rem, calc(100vw - 2.5rem)")}</figure>`,
  "mission",
)}
${band(
  "light",
  html`<div class="section-head"><p class="kicker">${t.principlesKicker}</p><h2 id="principles">${t.principlesTitle}</h2><p>${t.principlesIntro}</p></div>
<ol class="principle-grid">
${m.principles.items.map(
  (item) => html`<li>
${isPrincipleIconId(item.id) ? html`<span class="principle-icon">${raw(principleIcon(item.id, 32))}</span>` : ""}
<h3>${item.short}</h3>
<p>${item.rules[item.homeRule]}</p>
</li>`,
)}
</ol>
<p><a class="link" href="${localePath(PAGES.principles, locale)}">${t.principlesLink} →</a></p>`,
  "principles",
)}
${band(
  "light",
  html`<div class="section-head"><p class="kicker">${t.toolsKicker}</p><h2 id="tools">${t.toolsTitle}</h2><p>${t.toolsIntro}</p></div>
${shelves.map(
  ({ category, tools }) => html`<section class="shelf" aria-labelledby="shelf-${category}">
<h3 id="shelf-${category}">${CATEGORY_NAMES[category][locale]}</h3>
<ul class="cards">
${tools.map(
  (tool) => html`<li class="card">
${shotHtml(tool.id, "card", locale, t.cardAlt(tool.name), "(min-width: 48rem) 34rem, calc(100vw - 2.5rem)")}
<div class="card-body">
<p class="card-title"><span>${tool.name}</span> <span class="badge ${tool.status}">${t.status[tool.status === "live" ? "live" : "beta"]}</span></p>
<p class="card-text">${tool.tagline[locale]}</p>
<p class="muted card-meta">${t.languages}: ${tool.languages.map((code) => LOCALE_SETTINGS[code].name).join(", ")}</p>
<p><a class="button-secondary" href="${tool.url}">${t.open(tool.name)}</a></p>
</div>
</li>`,
)}
</ul>
</section>`,
)}`,
  "tools",
  "ruled",
)}
${band(
  "dark",
  html`<div class="section-head"><p class="kicker">${t.buildKicker}</p><h2 id="build">${t.buildTitle}</h2><p>${t.buildIntro}</p></div>
<div class="build">
<ol class="build-steps">
${t.buildSteps.map(
  (step, index) => html`<li><span class="step-number" aria-hidden="true">${index + 1}</span><div><p class="build-name">${step.name}</p><h3>${step.title}</h3><p>${step.text}</p></div></li>`,
)}
</ol>
<figure class="diagram" aria-label="${t.diagram.label}">
<ul class="diagram-tools">
${platform.map((name) => html`<li>${name}</li>`)}
<li class="diagram-next">${t.diagram.next}</li>
</ul>
<p class="diagram-mould"><span aria-hidden="true">↑</span> ${t.diagram.mould}</p>
<div class="diagram-base"><p>${t.diagram.base}</p><ul>${t.diagram.parts.map((part) => html`<li>${part}</li>`)}</ul></div>
</figure>
</div>
<p class="closing">${t.buildClosing}</p>`,
  "build",
)}
${band(
  "light",
  html`<div class="section-head"><p class="kicker">${t.differentKicker}</p><h2 id="different">${t.differentTitle}</h2><p>${t.differentIntro}</p></div>
<div class="table-wrap compare" role="region" aria-labelledby="different" tabindex="0">
<table>
<thead><tr><td></td><th scope="col">${t.typical}</th><th scope="col" class="ours">${t.ours}</th></tr></thead>
<tbody>
${t.rows.map((row) => html`<tr><th scope="row">${row.label}</th><td><span class="no" aria-hidden="true">✕</span> ${row.typical}</td><td class="ours"><span class="yes" aria-hidden="true">✓</span> ${row.ours}</td></tr>`)}
<tr><th scope="row">${t.weightLabel}</th><td><span class="no" aria-hidden="true">✕</span> ${t.weightTypical(number(TYPICAL_PAGE_KB))}</td><td class="ours"><span class="yes" aria-hidden="true">✓</span> ${t.weightOurs(number(figures.maxKb))}</td></tr>
</tbody>
</table>
</div>
<p class="muted source">${rich(t.weightSource, linkTo(locale))}</p>`,
  "different",
)}
${band(
  "dark",
  html`<div class="section-head"><p class="kicker">${t.figuresKicker}</p><h2 id="figures">${t.figuresTitle}</h2></div>
<dl class="figures">
${[
  [figures.cookies, t.figures.cookies],
  [figures.trackers, t.figures.trackers],
  [figures.maxKb, t.figures.weight],
  [figures.languages, t.figures.languages],
  [figures.countries, t.figures.countries],
  [figures.tools, t.figures.tools(figures.tools)],
].map(([value, label]) => html`<div><dt>${label}</dt><dd>${number(value as number)}</dd></div>`)}
</dl>`,
  "figures",
)}`;
  return { locale, id: "home", title: m.meta.home.title, description: m.meta.home.description, body };
}
