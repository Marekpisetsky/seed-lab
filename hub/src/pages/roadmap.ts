import { html, rich } from "../html.ts";
import { BLOCKS } from "../content.ts";
import { messages } from "../i18n/index.ts";
import type { Locale } from "../i18n/index.ts";
import { band, linkTo } from "../layout.ts";
import type { PageInput } from "../layout.ts";

/**
 * The one page for plans: the ladder of steps (only the first exists) and
 * everything still missing. Linked quietly from the footer; the front page
 * never shows what does not exist yet.
 */
export function roadmap(locale: Locale): PageInput {
  const m = messages(locale);
  const t = m.roadmap;
  const link = linkTo(locale);
  const body = html`
${band("dark", html`<div class="hero"><h1 id="title">${t.title}</h1><p class="lead">${t.lead}</p></div>`, "title")}
${band(
  "light",
  html`<div class="section-head"><h2 id="steps">${t.ladderTitle}</h2><p>${t.ladderIntro}</p></div>
<ol class="ladder">
${t.steps.map(
  (step, index) => html`<li class="step${index === 0 ? " current" : ""}">
<span class="step-number" aria-hidden="true">${index + 1}</span>
<div><p class="step-what">${step.what} <span class="state ${index === 0 ? "meets" : "pending"}">${index === 0 ? t.here : t.notYet}</span></p>
${step.until ? html`<p class="muted">${t.next}: ${step.until}</p>` : ""}</div>
</li>`,
)}
</ol>`,
  "steps",
)}
${band(
  "dark",
  html`<div class="section-head"><h2 id="missing">${t.missingTitle}</h2><p>${rich(t.missingIntro, link)}</p></div>
<ul class="missing">${t.missing.map((item) => html`<li>${item}</li>`)}</ul>
<h3 class="subhead">${t.blocksTitle}</h3>
<p class="muted narrow">${t.blocksIntro}</p>
<ul class="blocks">
${BLOCKS.map((block) => html`<li><p class="block-name">${block.name[locale]} <span class="state pending">${t.planned}</span></p><p class="muted">${block.text[locale]}</p></li>`)}
</ul>`,
  "missing",
)}`;
  return { locale, id: "roadmap", title: m.meta.roadmap.title, description: m.meta.roadmap.description, body };
}
