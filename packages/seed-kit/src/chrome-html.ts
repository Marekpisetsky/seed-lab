/**
 * The header and footer as static HTML, for apps without a framework (the
 * hub, the tools Forja makes). The same markup and classes as
 * react/chrome.tsx, styled by chrome.css. The launcher is a <details>
 * element: it opens and closes with no script.
 */

import type { FooterModel, HeaderModel } from "./chrome.ts";
import { html, raw, type Html } from "./html.ts";
import { CHECK_ICON, GRID_ICON, seedSvg } from "./icons.ts";

const current = (on: boolean | undefined, value = "page") => (on ? raw(` aria-current="${value}"`) : "");

/** The skip link, the header and its launcher. `id` names the launcher's panel. */
export function headerHtml(model: HeaderModel, id = "sk-launcher"): Html {
  const { words } = model;
  return html`<a class="sk-skip" href="#main">${words.skip}</a>
<header class="sk-header${model.theme ? ` theme-${model.theme}` : ""}">
<div class="sk-wrap sk-bar">
<a class="sk-brand" href="${model.home.href}"${current(model.home.current)}><span class="sk-seed">${raw(seedSvg())}</span><span>${model.home.label}</span></a>
${
  model.nav.length > 0
    ? html`<nav class="sk-nav" aria-label="${words.pages}"><ul>${model.nav.map((link) => html`<li><a href="${link.href}"${current(link.current)}>${link.label}</a></li>`)}</ul></nav>`
    : ""
}
<div class="sk-actions">
<nav class="sk-langs" aria-label="${words.language}"><ul>${model.languages.map(
    (link) =>
      html`<li><a href="${link.href}" hreflang="${link.locale}" lang="${link.locale}" title="${link.name}" aria-label="${link.name}"${current(link.current, "true")}>${link.label}</a></li>`,
  )}</ul></nav>
<details class="sk-launcher"><summary aria-label="${words.launcher}" title="${words.launcher}" aria-controls="${id}"><span class="sk-icon" aria-hidden="true">${raw(GRID_ICON)}</span></summary>
<div class="sk-panel" id="${id}">
<a class="sk-hub" href="${model.hubHref}"><strong>${words.hub}</strong><span>${words.hubNote}</span></a>
<p class="sk-panel-title">${words.tools}</p>
<ul>${model.tools.map(
    (tool) =>
      html`<li><a href="${tool.href}"${current(tool.current, "true")}><span class="sk-tool">${tool.name}</span>${
        tool.current ? html`<span class="sk-here"><span class="sk-icon" aria-hidden="true">${raw(CHECK_ICON)}</span>${words.here}</span>` : ""
      }</a></li>`,
  )}</ul>
</div>
</details>
</div>
</div>
</header>`;
}

/** The footer; `slot` goes first, inside it (an app's own controls). */
export function footerHtml(model: FooterModel, slot: Html | string = ""): Html {
  const { words } = model;
  return html`<footer class="sk-footer${model.theme ? ` theme-${model.theme}` : ""}">
<div class="sk-wrap">
${typeof slot === "string" ? raw(slot) : slot}<nav aria-label="${words.more}"><ul class="sk-links">${model.links.map((link) => html`<li><a href="${link.href}"${current(link.current)}>${link.label}</a></li>`)}${
    model.partOf ? html`<li><a href="${model.partOf}">${words.partOf}</a></li>` : ""
  }</ul></nav>
${model.notes.map((note) => html`<p class="sk-note">${note}</p>\n`)}<p class="sk-note">${words.copyright}</p>
</div>
</footer>`;
}
