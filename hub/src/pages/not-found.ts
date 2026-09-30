import { html } from "../html.ts";
import { LOCALES, localePath, messages } from "../i18n/index.ts";
import type { PageInput } from "../layout.ts";

/** One page for every missing address, in every language: the host cannot know which one the visitor reads. */
export function notFound(): PageInput {
  const [first] = LOCALES;
  const body = html`
<div class="narrow prose">
${LOCALES.map((locale, index) => {
  const m = messages(locale);
  const heading = index === 0 ? html`<h1>${m.notFound.title}</h1>` : html`<h2>${m.notFound.title}</h2>`;
  return html`<section lang="${locale}">
${heading}
<p>${m.notFound.text}</p>
<p><a class="button" href="${localePath("/", locale)}">${m.notFound.home}</a></p>
</section>`;
})}
</div>
`;
  const titles = LOCALES.map((locale) => messages(locale).notFound.title).join(" · ");
  return { locale: first, id: null, title: `${titles} · seed-lab`, description: messages(first).notFound.text, body };
}
