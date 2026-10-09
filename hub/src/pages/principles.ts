import { html, raw, rich } from "../../../packages/seed-kit/src/html.ts";
import { PRINCIPLE_IDS, TOOLS } from "../content.ts";
import { isPrincipleIconId, principleIcon } from "../../../packages/seed-kit/src/icons.ts";
import { messages } from "../i18n/index.ts";
import type { Locale } from "../i18n/index.ts";
import { band, linkTo } from "../layout.ts";
import type { PageInput } from "../layout.ts";

/** A small mark beside each state, so the table never relies on colour alone. */
const MARK = { meets: "✓", partly: "◐", pending: "○" } as const;

/**
 * The principles as commitments of seed-lab, for any product, each with
 * rules anyone can check. Below, how each product meets them today: the
 * gaps live in that table and on the Roadmap, not in the principles.
 */
export function principles(locale: Locale): PageInput {
  const m = messages(locale);
  const link = linkTo(locale);
  const byId = new Map(m.principles.items.map((item) => [item.id, item]));
  const body = html`
${band("dark", html`<div class="hero"><h1 id="title">${m.principles.title}</h1><p class="lead">${m.principles.lead}</p></div>`, "title")}
${band(
  "light",
  html`<ol class="commitments">
${m.principles.items.map(
  (item, index) => html`<li class="commitment" id="${item.id}">
<div class="commitment-title">${isPrincipleIconId(item.id) ? html`<span class="principle-icon">${raw(principleIcon(item.id, 32))}</span>` : ""}<h2><span>${index + 1}.</span> ${item.title}</h2></div>
<p class="commitment-text">${item.text}</p>
<h3 class="label">${m.principles.rulesLabel}</h3>
<ul class="rules">${item.rules.map((rule) => html`<li>${rule}</li>`)}</ul>
</li>`,
)}
</ol>`,
)}
${band(
  "dark",
  html`<div class="section-head"><h2 id="products">${m.principles.tableTitle}</h2><p>${rich(m.principles.tableIntro, link)}</p></div>
<div class="table-wrap" role="region" aria-labelledby="products" tabindex="0">
<table>
<thead><tr><th scope="col">${m.principles.product}</th>${PRINCIPLE_IDS.map((id) => html`<th scope="col">${byId.get(id)?.short ?? id}</th>`)}</tr></thead>
<tbody>
${TOOLS.filter((tool) => tool.status === "live").map(
  (tool) => html`<tr><th scope="row"><a href="${tool.url}">${tool.name[locale]}</a></th>${PRINCIPLE_IDS.map((id) => {
    const { status, note } = tool.principles[id];
    return html`<td><span class="state ${status}"><span aria-hidden="true">${MARK[status]}</span> ${m.principles.status[status]}</span><span class="note">${note[locale]}</span></td>`;
  })}</tr>`,
)}
</tbody>
</table>
</div>`,
)}`;
  return { locale, id: "principles", title: m.meta.principles.title, description: m.meta.principles.description, body };
}
