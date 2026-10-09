/**
 * The privacy and terms page every static Horalis tool publishes (the
 * ones Forja makes): the same promises, in the same words, for each
 * tool. A tool with more to say (files, prices it downloads) writes its
 * own page instead. Texts use "**bold**" and "[words](address)" (html.ts,
 * rich); "hub" and "hub-about" are addresses of the hub. The words are in
 * words/<language>.ts.
 */

import type { LegalPage } from "./legal-types.ts";
import { localePath, type Locale } from "./locales.ts";
import { HUB_URL } from "./site.ts";
import { KIT_WORDS } from "./words/index.ts";

export type { LegalPage, ProseSection } from "./legal-types.ts";
export { HOSTING } from "./hosting.ts";

/** The privacy and terms page of a tool, in a language. */
export function legalPage(locale: Locale, name: string): LegalPage {
  return KIT_WORDS[locale].legal(name);
}

/** The hub's addresses the legal texts link to, in the page's language. */
export function legalLink(locale: Locale): (href: string) => string {
  return (href) => (href === "hub" ? HUB_URL : href === "hub-about" ? HUB_URL + localePath("/about/", locale) : href);
}
