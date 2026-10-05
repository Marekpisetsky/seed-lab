/**
 * The header and footer every seed-lab app wears, as a plain model: the
 * logo and the app's name, its pages, the EN/ES switch, the theme menu
 * (theme.ts), the tools launcher, and the footer's links, notes and "Part
 * of seed-lab". Two
 * renderers draw the same model with the same markup and classes
 * (chrome.css): chrome-html.ts for static apps, react/chrome.tsx for
 * Wealth Lens. An app only says what is its own: its name, pages, links
 * and notes.
 */

import { LOCALE_SETTINGS, LOCALES, type Locale } from "./locales.ts";
import type { Theme } from "./theme.ts";
import { HUB_URL } from "./site.ts";
import { SHOWN_TOOLS } from "./tools.ts";

export const CHROME_WORDS = {
  en: {
    skip: "Skip to content",
    pages: "Pages",
    language: "Language",
    launcher: "seed-lab tools",
    hub: "seed-lab",
    hubNote: "All the seed-lab tools",
    tools: "Tools",
    here: "You are here",
    more: "More",
    theme: "Theme",
    themes: { auto: "Automatic", light: "Light", dark: "Dark" },
    themeAuto: "Like your device",
    themeNote: "Kept only in this tab.",
    partOf: "Part of seed-lab",
    copyright: "© 2026 seed-lab. Free to use.",
  },
  es: {
    skip: "Saltar al contenido",
    pages: "Páginas",
    language: "Idioma",
    launcher: "Herramientas de seed-lab",
    hub: "seed-lab",
    hubNote: "Todas las herramientas de seed-lab",
    tools: "Herramientas",
    here: "Estás aquí",
    more: "Más",
    theme: "Tema",
    themes: { auto: "Automático", light: "Claro", dark: "Oscuro" },
    themeAuto: "Como tu dispositivo",
    themeNote: "Solo se recuerda en esta pestaña.",
    partOf: "Parte de seed-lab",
    copyright: "© 2026 seed-lab. De uso gratuito.",
  },
} as const satisfies Record<Locale, Record<string, string | Readonly<Record<Theme, string>>>>;

export type ChromeWords = (typeof CHROME_WORDS)[Locale];

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
  /** The logo and the app's name, linking to its home page. */
  home: ChromeLink;
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
  /** Where "Part of seed-lab" goes; absent on the hub itself. */
  partOf?: string;
  /** "light": white (the hub's last band) unless a mode is chosen in the theme menu; otherwise it follows the device. */
  theme?: "light";
}

export interface HeaderInput {
  locale: Locale;
  /** The app's name next to the seed, and where it goes. */
  name: string;
  homeHref: string;
  homeCurrent?: boolean;
  nav?: ChromeLink[];
  /** The same page in each language. */
  languageHrefs: Readonly<Record<Locale, string>>;
  /** The tool showing this header ("hub" for the hub): marked "You are here", linked to `homeHref`. */
  current: string;
  /** Where the launcher's seed-lab entry goes; the hub by default. */
  hubHref?: string;
  theme?: "dark";
}

/** The header of an app's page. */
export function headerModel(input: HeaderInput): HeaderModel {
  const { locale } = input;
  return {
    locale,
    words: CHROME_WORDS[locale],
    home: { label: input.name, href: input.homeHref, current: input.homeCurrent ?? false },
    nav: input.nav ?? [],
    languages: LOCALES.map((other) => ({
      locale: other,
      label: LOCALE_SETTINGS[other].label,
      name: LOCALE_SETTINGS[other].name,
      href: input.languageHrefs[other],
      current: other === locale,
    })),
    hubHref: input.hubHref ?? HUB_URL,
    tools: SHOWN_TOOLS.map((tool) => ({
      id: tool.id,
      name: tool.name,
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
  /** Where "Part of seed-lab" goes: the hub by default; `false` on the hub itself. */
  partOf?: string | false;
  theme?: "light";
}

/** The footer of an app's page. */
export function footerModel(input: FooterInput): FooterModel {
  return {
    locale: input.locale,
    words: CHROME_WORDS[input.locale],
    links: input.links,
    notes: input.notes ?? [],
    ...(input.partOf === false ? {} : { partOf: input.partOf ?? HUB_URL }),
    ...(input.theme ? { theme: input.theme } : {}),
  };
}
