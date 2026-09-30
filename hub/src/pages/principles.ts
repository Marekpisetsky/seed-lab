import { html, rich } from "../html.ts";
import { icon, isIconId } from "../icons.ts";
import { messages } from "../i18n/index.ts";
import type { Locale } from "../i18n/index.ts";
import { linkTo } from "../layout.ts";
import type { PageInput } from "../layout.ts";

/** Each principle, what Wealth Lens does about it today, and, just as plainly, what is still missing. */
export function principles(locale: Locale): PageInput {
  const m = messages(locale);
  const link = linkTo(locale);
  const body = html`
<div class="narrow">
<h1>${m.principles.title}</h1>
<p class="lead">${m.principles.lead}</p>
</div>
${m.principles.items.map(
  (item, index) => html`
<section class="principle" id="${item.id}" aria-labelledby="${item.id}-title">
<div class="principle-title">${isIconId(item.id) ? html`<span class="principle-icon">${icon(item.id, 32)}</span>` : ""}<h2 id="${item.id}-title"><span>${index + 1}.</span> ${item.title}</h2></div>
<p class="narrow">${item.text}</p>
<div class="columns">
<div class="card"><h3>${m.principles.today}</h3><ul>${item.today.map((text) => html`<li>${rich(text, link)}</li>`)}</ul></div>
<div class="card"><h3>${m.principles.missing}</h3><ul>${item.missing.map(
    (gap) => html`<li>${gap.pending ? html`<span class="badge pending">${m.principles.pending}</span>` : ""}${rich(gap.text, link)}</li>`,
  )}</ul></div>
</div>
</section>`,
)}
`;
  return { locale, id: "principles", title: m.meta.principles.title, description: m.meta.principles.description, body };
}
