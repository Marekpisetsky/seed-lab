import { html } from "../../../packages/seed-kit/src/html.ts";
import { SHOWN_LOCALES, localePath, messages } from "../i18n/index.ts";
import { band } from "../layout.ts";
import type { PageInput } from "../layout.ts";

/** One page for every missing address, in every shown language (the host cannot know which one the visitor reads): one band each. */
export function notFound(): PageInput {
  const [first] = SHOWN_LOCALES;
  const body = html`${SHOWN_LOCALES.map((locale, index) => {
    const m = messages(locale);
    const heading = index === 0 ? html`<h1>${m.notFound.title}</h1>` : html`<h2>${m.notFound.title}</h2>`;
    return band(
      index % 2 === 0 ? "dark" : "light",
      html`<div class="narrow" lang="${locale}">
${heading}
<p class="lead">${m.notFound.text}</p>
<p class="actions"><a class="button" href="${localePath("/", locale)}">${m.notFound.home}</a></p>
</div>`,
    );
  })}`;
  const titles = SHOWN_LOCALES.map((locale) => messages(locale).notFound.title).join(" · ");
  return { locale: first, id: null, title: `${titles} · Horalis`, description: messages(first).notFound.text, body };
}
