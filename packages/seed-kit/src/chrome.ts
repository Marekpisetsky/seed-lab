/**
 * The header and footer every Horalis app wears, as a plain model: the
 * logo and the app's name, its pages, the language switch, the theme menu
 * (theme.ts), the tools launcher, and the footer's links, notes and "Part
 * of Horalis". Two
 * renderers draw the same model with the same markup and classes
 * (chrome.css): chrome-html.ts for static apps, react/chrome.tsx for
 * Wealth Lens. An app only says what is its own: its name, pages, links
 * and notes.
 */

import { isPendingReview, LOCALE_SETTINGS, LOCALES, SHOWN_LOCALES, type Locale } from "./locales.ts";
import { KIT_WORDS, type KitWords } from "./words/index.ts";
import { BRAND_NAME, HUB_URL } from "./site.ts";
import { SHOWN_TOOLS } from "./tools.ts";

/** The header's and footer's words in each language (words/en.ts, es.ts, nl.ts). */
export const CHROME_WORDS: Readonly<Record<Locale, KitWords["chrome"]>> = Object.fromEntries(LOCALES.map((locale) => [locale, KIT_WORDS[locale].chrome])) as Record<Locale, KitWords["chrome"]>;

export type ChromeWords = KitWords["chrome"];

export interface ChromeLink {
  label: string;
  href: string;
  /** The page being shown (aria-current="page"). */
  current?: boolean;
}

export interface LanguageLink {
  locale: Locale;
  label: string;
  name: string;
  href: string;
  current: boolean;
}

export interface LauncherTool {
  id: string;
  name: string;
  href: string;
  current: boolean;
}

export interface HeaderModel {
  locale: Locale;
  words: ChromeWords;
  /**
   * The seed and the brand, linking to the app's home page; a tool's own
   * name ("Growth") is `product`, drawn after the brand and, on a narrow
   * phone, under it.
   */
  home: ChromeLink & { product?: string };
  nav: ChromeLink[];
  languages: LanguageLink[];
  hubHref: string;
  tools: LauncherTool[];
  /** "dark": near-black (the hub's top band) unless a mode is chosen in the theme menu; otherwise it follows the device. */
  theme?: "dark";
}

export interface FooterModel {
  locale: Locale;
  words: ChromeWords;
  links: ChromeLink[];
  /** Short lines under the links: what the app stores (nothing), what it weighs. */
  notes: string[];
  /** Where "Part of Horalis" goes; absent on the hub itself. */
  partOf?: string;
  /** "light": white (the hub's last band) unless a mode is chosen in the theme menu; otherwise it follows the device. */
  theme?: "light";
}

export interface HeaderInput {
  locale: Locale;
  /** The app's name next to the seed ("Horalis Growth", "Horalis" on the hub), and where it goes. */
  name: string;
  homeHref: string;
  homeCurrent?: boolean;
  nav?: ChromeLink[];
  /** The same page in each language. */
  languageHrefs: Readonly<Record<Locale, string>>;
  /** The tool showing this header ("hub" for the hub): marked "You are here", linked to `homeHref`. */
  current: string;
  /** Where the launcher's Horalis entry goes; the hub by default. */
  hubHref?: string;
  theme?: "dark";
}

/** "Horalis Growth" → the brand and the tool's own name; "Horalis" alone → the brand. */
export function brandParts(name: string): { label: string; product?: string } {
  return name.startsWith(`${BRAND_NAME} `) ? { label: BRAND_NAME, product: name.slice(BRAND_NAME.length + 1) } : { label: name };
}

/** The header of an app's page. */
export function headerModel(input: HeaderInput): HeaderModel {
  const { locale } = input;
  return {
    locale,
    words: CHROME_WORDS[locale],
    home: { ...brandParts(input.name), href: input.homeHref, current: input.homeCurrent ?? false },
    nav: input.nav ?? [],
    // The shown languages, and the page's own if it waits for review (so it is marked current).
    languages: LOCALES.filter((other) => SHOWN_LOCALES.includes(other) || other === locale).map((other) => ({
      locale: other,
      label: LOCALE_SETTINGS[other].label,
      name: LOCALE_SETTINGS[other].name,
      href: input.languageHrefs[other],
      current: other === locale,
    })),
    hubHref: input.hubHref ?? HUB_URL,
    tools: SHOWN_TOOLS.map((tool) => ({
      id: tool.id,
      name: tool.name[locale],
      href: tool.id === input.current ? input.homeHref : tool.url,
      current: tool.id === input.current,
    })),
    ...(input.theme ? { theme: input.theme } : {}),
  };
}

export interface FooterInput {
  locale: Locale;
  links: ChromeLink[];
  notes?: string[];
  /** Where "Part of Horalis" goes: the hub by default; `false` on the hub itself. */
  partOf?: string | false;
  theme?: "light";
}

/** The footer of an app's page. */
export function footerModel(input: FooterInput): FooterModel {
  return {
    locale: input.locale,
    words: CHROME_WORDS[input.locale],
    links: input.links,
    notes: [...(input.notes ?? []), ...(isPendingReview(input.locale) ? [CHROME_WORDS[input.locale].reviewNote] : [])],
    ...(input.partOf === false ? {} : { partOf: input.partOf ?? HUB_URL }),
    ...(input.theme ? { theme: input.theme } : {}),
  };
}
