import { html, rich } from "../html.ts";
import { messages } from "../i18n/index.ts";
import type { Locale } from "../i18n/index.ts";
import { linkTo } from "../layout.ts";
import type { PageInput } from "../layout.ts";

/** What seed-lab is, the long-run vision in one sentence, what it is not, who makes it. */
export function about(locale: Locale): PageInput {
  const m = messages(locale);
  const link = linkTo(locale);
  const body = html`
<div class="narrow prose">
<h1>${m.about.title}</h1>
<p class="lead">${m.about.lead}</p>
${m.about.sections.map(
  (section) => html`
<section>
<h2>${section.heading}</h2>
${section.body.map((text) => html`<p>${rich(text, link)}</p>`)}
</section>`,
)}
</div>
`;
  return { locale, id: "about", title: m.meta.about.title, description: m.meta.about.description, body };
}
