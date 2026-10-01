import { html, raw } from "./html.ts";
import type { Html } from "./html.ts";
import { CONTACT } from "./site.ts";

/**
 * seed-lab's email address in the page: two data attributes that CSS shows
 * as one address (styles.ts, .email), so it reads even without JavaScript.
 */
export const EMAIL: Html = html`<span class="email" data-user="${CONTACT.user}" data-domain="${CONTACT.domain}"></span>`;

/**
 * Turns each address into a normal mail link once the page runs. Written
 * so the HTML never holds the address or the word for a mail link: the @
 * is "@" and the scheme is built from two halves.
 */
export const EMAIL_SCRIPT = raw(
  `document.querySelectorAll(".email").forEach(function(e){var a=document.createElement("a"),m=e.dataset.user+"\\u0040"+e.dataset.domain;a.href="mail"+"to:"+m;a.textContent=m;e.replaceWith(a)})`,
);

/** Whether a page shows the address, and so needs the script. */
export function hasEmail(body: Html): boolean {
  return body.value.includes('class="email"');
}
